import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { HomeAssistant, LovelaceCardEditor } from 'custom-card-helpers';
import type { FeatureConfig, FeatureType, MaterialPurifierCardConfig } from './types';
import { tokens } from './theme';
import { readAqi, displayAqi, resolveMetric, autoRpmEntity, readNumber } from './entities';
import { metricLabel } from './calc/aqi';
import { speedSource, resolveSpeedTarget, detentCount, formatSpeed } from './speed';
import { resolveMaxRpm, calibrationFromConfig, detentFromRpm } from './speed-calibration';
import { runCalibration, type CalibrationProgress } from './calibrate';
import './editors/entity-picker';
import './editors/text-field';
import './editors/select-field';
import { ensureHaComponents } from './editors/load-ha';
import './editors/purifier-feature-editor';
import './editors/entity-tile-editor';
import './editors/entity-list-editor';
import './editors/input-select-editor';

/** Mutable module seam; tests replace `run` without changing the production runner. */
export const calibrationRunner = { run: runCalibration };

interface Schema {
  name: string;
  required?: boolean;
  selector: Record<string, unknown>;
}
type FormData = Record<string, unknown>;
const entity = (domain: string | string[]) => ({ entity: { domain } });
const BASE_SCHEMA: Schema[] = [
  { name: 'entity', required: true, selector: entity('fan') },
  { name: 'name', selector: { text: {} } },
  { name: 'show_name', selector: { boolean: {} } },
  { name: 'theme', selector: { theme: {} } },
];
const metrics = [
  { value: 'aqi', label: 'AQI' },
  { value: 'pm25', label: 'µg/m³' },
];
const CYCLE_SCHEMA: Schema[] = [{ name: 'aqi_allow_cycle', selector: { boolean: {} } }];
const sources = [
  { value: '', label: 'Auto-detect' },
  { value: 'pm25', label: 'PM2.5 µg/m³' },
  { value: 'us_aqi', label: 'US AQI' },
  { value: 'cn_aqi', label: 'CN AQI' },
];
const scales = [
  { value: 'us', label: 'US (EPA)' },
  { value: 'cn', label: 'China (HJ 633)' },
];
const breakpoints = [
  { value: '2024', label: '2024' },
  { value: '2012', label: '2012' },
];
const FEATURES: { type: FeatureType; label: string; icon: string }[] = [
  { type: 'fan-presets', label: 'Fan presets', icon: 'mdi:fan-auto' },
  { type: 'speed-wheel', label: 'Speed wheel', icon: 'mdi:fan' },
  { type: 'filter-vacuum', label: 'Vacuum filter', icon: 'mdi:air-filter' },
  { type: 'entity-tile', label: 'Entity tile', icon: 'mdi:card-outline' },
  { type: 'sensor-list', label: 'Sensor list', icon: 'mdi:format-list-bulleted' },
  { type: 'switch-list', label: 'Switch list', icon: 'mdi:toggle-switch' },
  { type: 'switch-group', label: 'Switch group', icon: 'mdi:toggle-switch-outline' },
  { type: 'button-list', label: 'Button list', icon: 'mdi:gesture-tap-button' },
  { type: 'input-select', label: 'Input select', icon: 'mdi:form-dropdown' },
  { type: 'percentage-tile', label: 'Percentage tile', icon: 'mdi:percent' },
];
function defaultFeature(type: FeatureType): FeatureConfig {
  switch (type) {
    case 'fan-presets':
      return { type, display: 'tile' };
    case 'speed-wheel':
      return { type };
    case 'filter-vacuum':
      return { type };
    case 'entity-tile':
    case 'percentage-tile':
    case 'input-select':
      return { type, entity: '' };
    case 'sensor-list':
    case 'button-list':
      return { type, items: [] };
    case 'switch-list':
    case 'switch-group':
      return { type, entities: [] };
  }
}
const LABELS: Record<string, string> = {
  entity: 'Fan entity (required)',
  name: 'Name',
  show_name: 'Show name',
  theme: 'Theme',
  aqi_entity: 'Air quality sensor',
  aqi_attribute: 'Attribute (optional)',
  aqi_source: 'Reported value',
  aqi_scale: 'AQI scale',
  aqi_metric: 'Shown value',
  aqi_allow_cycle: 'Allow tapping the unit to switch AQI ↔ µg/m³',
  aqi_us_breakpoints: 'US breakpoints',
  motor_speed_entity: 'Motor speed sensor',
  max_rpm: 'Max RPM (optional)',
  cadr: 'CADR (m³/h)',
};

/** Lovelace editor; patches only the fields exposed by each form. */
export class MaterialPurifierCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config!: MaterialPurifierCardConfig;
  @state() private _editingIndex: number | null = null;
  @state() private _addOpen = false;
  @state() private _confirmCalibration = false;
  @state() private _calibrating = false;
  @state() private _progress: CalibrationProgress | null = null;
  @state() private _calibrationMessage = '';
  @state() private _calibrationError = false;
  private _abort: AbortController | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    void ensureHaComponents().then(() => this.requestUpdate());
  }

  public setConfig(config: MaterialPurifierCardConfig): void {
    if (this._config && config.entity !== this._config.entity) this._abort?.abort();
    this._config = config;
  }

  disconnectedCallback(): void {
    this._abort?.abort();
    super.disconnectedCallback();
  }

  private _emit(config: MaterialPurifierCardConfig): void {
    if (config.entity !== this._config.entity) this._abort?.abort();
    const index = config.features?.findIndex((feature) => feature.type === 'speed-wheel') ?? -1;
    if (config.speed && index >= 0) {
      const features = [...config.features!];
      const wheel = features[index];
      if (wheel.type === 'speed-wheel') {
        features[index] = {
          ...wheel,
          ...(wheel.entity === undefined && config.speed.entity !== undefined
            ? { entity: config.speed.entity }
            : {}),
          ...(wheel.preset === undefined && config.speed.preset !== undefined
            ? { preset: config.speed.preset }
            : {}),
          ...(wheel.display === undefined && config.speed.display !== undefined
            ? { display: config.speed.display }
            : {}),
          ...(wheel.estimate_auto === undefined && config.speed.estimate_auto !== undefined
            ? { estimate_auto: config.speed.estimate_auto }
            : {}),
        };
        config = { ...config, features };
        delete config.speed;
      }
    }
    this._config = config;
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _computeLabel = (schema: Schema): string => LABELS[schema.name] ?? schema.name;
  private _computeHelper = (): string => '';

  private _fieldChanged(key: string, e: CustomEvent<{ value: string }>): void {
    e.stopPropagation();
    let value: unknown = e.detail.value;
    if ((key === 'cadr' || key === 'max_rpm') && value !== '') {
      const number = Number(value);
      if (!Number.isFinite(number) || number <= 0) return;
      value = number;
    }
    this._formChanged(new CustomEvent('value-changed', { detail: { value: { [key]: value } } }));
  }

  private _formChanged(e: CustomEvent<{ value: FormData }>): void {
    e.stopPropagation();
    const config = { ...this._config };
    const aqi = { ...config.aqi };
    const values = e.detail.value;
    if (values.aqi_metric || values.aqi_scale) {
      aqi.scale = aqi.scale ?? (aqi.metric === 'cn_aqi' ? 'cn' : 'us');
      aqi.metric = aqi.metric === 'pm25' ? 'pm25' : 'aqi';
    }
    for (const [key, value] of Object.entries(e.detail.value)) {
      const target = key.startsWith('aqi_') ? aqi : config;
      const name = key.startsWith('aqi_') ? key.slice(4) : key;
      const record = target as Record<string, unknown>;
      if (
        value === '' ||
        value === undefined ||
        value === null ||
        (key === 'show_name' && value === true)
      )
        delete record[name];
      else record[name] = value;
    }
    if (Object.keys(aqi).length) config.aqi = aqi;
    else delete config.aqi;
    this._emit(config);
  }

  private get _features(): FeatureConfig[] {
    return this._config.features ?? [];
  }
  private _setFeatures(features: FeatureConfig[]): void {
    this._emit({ ...this._config, features });
  }
  private _pickFeature(type: FeatureType): void {
    this._addOpen = false;
    this._editingIndex = this._features.length;
    this._setFeatures([...this._features, defaultFeature(type)]);
  }
  private _removeFeature(index: number): void {
    this._editingIndex = null;
    this._setFeatures(this._features.filter((_, i) => i !== index));
  }
  private _moveFeature(e: CustomEvent<{ oldIndex: number; newIndex: number }>): void {
    e.stopPropagation();
    const { oldIndex, newIndex } = e.detail;
    const features = [...this._features];
    if (
      !Number.isInteger(oldIndex) ||
      !Number.isInteger(newIndex) ||
      oldIndex < 0 ||
      newIndex < 0 ||
      oldIndex >= features.length ||
      newIndex >= features.length
    )
      return;
    const [moved] = features.splice(oldIndex, 1);
    features.splice(newIndex, 0, moved);
    this._editingIndex = null;
    this._setFeatures(features);
  }
  private _featureChanged(index: number, e: CustomEvent<{ feature: FeatureConfig }>): void {
    e.stopPropagation();
    const features = [...this._features];
    features[index] = e.detail.feature;
    this._setFeatures(features);
  }

  private _form(schema: Schema[], data: FormData): TemplateResult {
    return html`<ha-form
      .hass=${this.hass}
      .schema=${schema}
      .data=${data}
      .computeLabel=${this._computeLabel}
      .computeHelper=${this._computeHelper}
      @value-changed=${this._formChanged}
    ></ha-form>`;
  }

  private get _rpmEntity(): string | undefined {
    return this._config.motor_speed_entity ?? autoRpmEntity(this.hass, this._config.entity);
  }

  private get _calibrationDisabledReason(): string {
    if (!this._rpmEntity || !this.hass.states[this._rpmEntity])
      return 'Select a motor speed sensor to calibrate.';
    const target = resolveSpeedTarget(this.hass, this._config.entity, speedSource(this._config));
    if (target.kind === 'none')
      return 'No speed control available. Configure a speed-wheel feature or a fan with speed control.';
    if (!target.available) return 'Speed control is unavailable.';
    return '';
  }

  private async _startCalibration(): Promise<void> {
    if (this._calibrating || this._calibrationDisabledReason) return;
    const fanEntity = this._config.entity;
    const rpmEntity = this._rpmEntity!;
    const speed = speedSource(this._config);
    const target = resolveSpeedTarget(this.hass, fanEntity, speed);
    const controller = new AbortController();
    this._abort = controller;
    this._confirmCalibration = false;
    this._calibrating = true;
    this._calibrationMessage = '';
    this._calibrationError = false;
    this._progress = null;
    try {
      const points = await calibrationRunner.run(() => this.hass, {
        fanEntity,
        rpmEntity,
        target,
        speed,
        signal: controller.signal,
        onProgress: (progress) => {
          this._progress = progress;
        },
      });
      // Never apply a stopped/stale run to a newly selected purifier.
      if (!controller.signal.aborted && this._config.entity === fanEntity) {
        this._emit({ ...this._config, calibration: points });
        this._calibrationMessage = 'Calibration complete.';
      } else if (controller.signal.aborted) {
        this._calibrationMessage = 'Calibration stopped.';
      }
    } catch {
      this._calibrationError = !controller.signal.aborted;
      this._calibrationMessage = controller.signal.aborted
        ? 'Calibration stopped.'
        : 'Calibration failed. Check the motor speed sensor and speed control, then try again.';
    } finally {
      this._calibrating = false;
      this._abort = null;
    }
  }

  private _calibrationSummary(): string {
    const maximum = resolveMaxRpm({ ...this._config, max_rpm: undefined });
    if (maximum === null) return '';
    const speed = speedSource(this._config);
    const target = resolveSpeedTarget(this.hass, this._config.entity, speed);
    const calibration = calibrationFromConfig(this._config.calibration, target);
    const rpm = readNumber(this.hass, this._rpmEntity);
    const summary = `Max ${maximum.toLocaleString()} rpm`;
    if (!calibration || rpm === null || target.kind === 'none') return summary;
    const maxDetent = detentCount(target.min, target.max, target.step) - 1;
    const estimatedDetent = detentFromRpm(calibration, rpm, maxDetent);
    if (estimatedDetent === null) return summary;
    const detent = Math.max(0, Math.min(maxDetent, Math.round(estimatedDetent)));
    const value = Math.min(target.max, target.min + detent * target.step);
    return `${summary} · now ${formatSpeed(target, value, speed.display ?? 'percent')}`;
  }

  private _renderCalibration(): TemplateResult {
    const reason = this._calibrationDisabledReason;
    const progress = this._progress;
    return html`<div class="calibration">
      <button
        class="add-btn calibrate"
        ?disabled=${Boolean(reason) || this._calibrating}
        aria-describedby="calibration-reason"
        @click=${() => {
          this._confirmCalibration = true;
          this._calibrationMessage = '';
        }}
      >
        Calibrate fan speed
      </button>
      <p class="hint" id="calibration-reason">${reason}</p>
      ${
        this._confirmCalibration
          ? html`<div class="warning" role="group" aria-label="Confirm fan speed calibration">
              <p>
                The purifier will run at its lowest and highest speed for up to a minute or two,
                then return to its current mode.
              </p>
              <div class="actions">
                <button
                  class="add-btn start-calibration"
                  ?disabled=${Boolean(reason)}
                  @click=${this._startCalibration}
                >
                  Start
                </button>
                <button
                  class="add-opt cancel-calibration"
                  @click=${() => (this._confirmCalibration = false)}
                >
                  Cancel
                </button>
              </div>
            </div>`
          : nothing
      }
      ${
        this._calibrating
          ? html`<div class="actions">
              <p class="hint" role="status">
                ${this._abort?.signal.aborted ? 'Stopping · restoring previous mode…' : progress?.phase === 'restoring' ? 'Restoring previous mode…' : progress ? `Step ${progress.step} of ${progress.total}${progress.rpm === null ? '' : ` · ${Math.round(progress.rpm).toLocaleString('en-US')} rpm`}` : 'Starting calibration…'}
              </p>
              <button
                class="add-opt stop-calibration"
                ?disabled=${this._abort?.signal.aborted}
                @click=${() => {
                  this._abort?.abort();
                  this.requestUpdate();
                }}
              >
                Stop
              </button>
            </div>`
          : nothing
      }
      ${this._calibrationMessage ? html`<p class="hint" role=${this._calibrationError ? 'alert' : 'status'}>${this._calibrationMessage}</p>` : nothing}
      ${this._calibrationSummary() ? html`<p class="hint">${this._calibrationSummary()}</p>` : nothing}
    </div>`;
  }

  /** The shared primitive currently exposes text only; adapt its native input locally. */
  protected updated(): void {
    for (const key of ['aqi_entity', 'motor_speed_entity']) {
      const field = this.shadowRoot?.querySelector(`mp-entity-picker[data-key="${key}"]`);
      if (!field) continue;
      void (field as LitElement).updateComplete.then(() => {
        field.shadowRoot?.querySelector('button')?.setAttribute('aria-label', LABELS[key]);
      });
    }
    for (const key of ['cadr', 'max_rpm']) {
      const field = this.shadowRoot?.querySelector(`mp-text-field[data-key="${key}"]`);
      if (!field) continue;
      void (field as LitElement).updateComplete.then(() => {
        const input = field.shadowRoot?.querySelector('input');
        if (!input) return;
        input.type = 'number';
        input.min = '0';
        input.step = 'any';
        input.inputMode = 'decimal';
        const calibrated =
          key === 'max_rpm' ? resolveMaxRpm({ ...this._config, max_rpm: undefined }) : null;
        input.placeholder =
          calibrated === null ? LABELS[key] : `Calibrated: ${Math.round(calibrated)}`;
        input.setAttribute(
          'aria-description',
          key === 'cadr'
            ? "From your purifier's datasheet; used for air volume and room coverage"
            : 'Leave empty to use calibration'
        );
      });
    }
  }

  private _labeledField(key: string, control: TemplateResult, helper?: string): TemplateResult {
    return html`<div class="field-column">
      <span class="field-label">${LABELS[key]}</span>
      ${control} ${helper ? html`<p class="hint">${helper}</p>` : nothing}
    </div>`;
  }

  private _select(
    key: string,
    value: string,
    options: { value: string; label: string }[]
  ): TemplateResult {
    return this._labeledField(
      key,
      html`<mp-select-field
        data-key=${key}
        .label=${LABELS[key]}
        .value=${value}
        .options=${options}
        @value-changed=${(e: CustomEvent<{ value: string }>) => this._fieldChanged(key, e)}
      ></mp-select-field>`
    );
  }

  private _renderAqi(): TemplateResult {
    const aqi = this._config.aqi;
    const metric = resolveMetric(aqi);
    const reading = readAqi(this.hass, this._config.entity, aqi);
    const shown = displayAqi(reading, metric, aqi?.us_breakpoints);
    const shownUnit = `${metricLabel(metric)}${metric === 'pm25' ? '' : metric === 'cn_aqi' ? ' (CN)' : ' (US)'}`;
    return html`<div class="fields">
      ${this._labeledField(
        'aqi_entity',
        html`<mp-entity-picker
          data-key="aqi_entity"
          .hass=${this.hass}
          .label=${LABELS.aqi_entity}
          .includeDomains=${['sensor']}
          .value=${aqi?.entity ?? ''}
          @value-changed=${(e: CustomEvent<{ value: string }>) => this._fieldChanged('aqi_entity', e)}
        ></mp-entity-picker>`
      )}
      <div class="field-row halves">
        ${this._labeledField(
          'aqi_attribute',
          html`<mp-text-field
            data-key="aqi_attribute"
            .label=${LABELS.aqi_attribute}
            .value=${aqi?.attribute ?? ''}
            @value-changed=${(e: CustomEvent<{ value: string }>) => this._fieldChanged('aqi_attribute', e)}
          ></mp-text-field>`
        )}
        ${this._select('aqi_source', aqi?.source ?? '', sources)}
      </div>
      <p class="hint aqi-preview" role="status">
        ${reading.value === null ? 'No reading available. Select an air quality sensor with a numeric reading.' : `Sensor: ${reading.value} ${metricLabel(reading.source)} → Shown: ${shown.text} ${shownUnit}`}
      </p>
      <div class="field-row thirds">
        ${this._select('aqi_scale', aqi?.scale ?? (aqi?.metric === 'cn_aqi' ? 'cn' : 'us'), scales)}
        ${this._select('aqi_metric', aqi?.metric === 'pm25' ? 'pm25' : 'aqi', metrics)}
        ${this._select('aqi_us_breakpoints', aqi?.us_breakpoints ?? '2024', breakpoints)}
      </div>
      ${this._form(CYCLE_SCHEMA, { aqi_allow_cycle: aqi?.allow_cycle ?? false })}
    </div>`;
  }

  private _renderMotor(): TemplateResult {
    return html`<div class="fields">
      ${this._labeledField(
        'motor_speed_entity',
        html`<mp-entity-picker
          data-key="motor_speed_entity"
          .hass=${this.hass}
          .label=${LABELS.motor_speed_entity}
          .includeDomains=${['sensor']}
          .value=${this._config.motor_speed_entity ?? ''}
          @value-changed=${(e: CustomEvent<{ value: string }>) => this._fieldChanged('motor_speed_entity', e)}
        ></mp-entity-picker>`
      )}
      <div class="field-row halves">
        ${(['cadr', 'max_rpm'] as const).map((key) =>
          this._labeledField(
            key,
            html`<mp-text-field
              data-key=${key}
              .label=${LABELS[key]}
              .value=${String(this._config[key] ?? '')}
              @value-changed=${(e: CustomEvent<{ value: string }>) => this._fieldChanged(key, e)}
            ></mp-text-field>`,
            key === 'cadr'
              ? "From your purifier's datasheet; used for air volume and room coverage"
              : 'Leave empty to use calibration'
          )
        )}
      </div>
      ${this._renderCalibration()}
    </div>`;
  }

  protected render(): TemplateResult {
    if (!this._config || !this.hass) return html``;
    const c = this._config;
    return html`<div class="editor">
      ${this._form(BASE_SCHEMA, {
        entity: c.entity,
        name: c.name,
        show_name: c.show_name !== false,
        theme: c.theme,
      })}
      <details>
        <summary>Air quality</summary>
        ${this._renderAqi()}
      </details>
      <details>
        <summary>Motor speed and CADR</summary>
        ${this._renderMotor()}
      </details>
      <div class="features-header">Features</div>
      ${this._features.length ? nothing : html`<p class="hint">No features yet. Add a feature below.</p>`}
      <ha-sortable handle-selector=".handle" @item-moved=${this._moveFeature}>
        <div class="features">
          ${this._features.map((feature, index) => this._renderFeatureRow(feature, index))}
        </div>
      </ha-sortable>
      <div class="add">
        <button
          class="add-btn"
          aria-expanded=${String(this._addOpen)}
          @click=${() => (this._addOpen = !this._addOpen)}
        >
          <ha-icon icon=${this._addOpen ? 'mdi:close' : 'mdi:plus'}></ha-icon>Add feature
        </button>
        ${this._addOpen ? html`<div class="add-menu">${FEATURES.map((f) => html`<button class="add-opt" @click=${() => this._pickFeature(f.type)}>${f.label}</button>`)}</div>` : nothing}
      </div>
    </div>`;
  }

  private _summary(feature: FeatureConfig): string {
    if ('entities' in feature) return `${feature.entities.length} entities`;
    if ('items' in feature) return `${feature.items.length} entities`;
    if ('entity' in feature) return feature.entity || 'No entity selected';
    if (feature.type === 'filter-vacuum') return feature.counter_entity || 'Tracking not set up';
    return feature.type === 'fan-presets' ? (feature.display ?? 'tile') : 'Fan speed';
  }
  private _renderFeatureRow(feature: FeatureConfig, index: number): TemplateResult {
    const expanded = this._editingIndex === index;
    const info = FEATURES.find((f) => f.type === feature.type);
    return html`<div class="feature">
      <div class="feature-head">
        <div class="handle"><ha-icon icon="mdi:drag"></ha-icon></div>
        <ha-icon icon=${info?.icon ?? 'mdi:card-outline'}></ha-icon>
        <div class="feature-title">
          <div>${info?.label ?? feature.type}</div>
          <div class="hint">${this._summary(feature)}</div>
        </div>
        <button
          class="icon-btn"
          aria-label="Edit feature"
          aria-expanded=${String(expanded)}
          @click=${() => (this._editingIndex = expanded ? null : index)}
        >
          <ha-icon icon=${expanded ? 'mdi:chevron-up' : 'mdi:pencil'}></ha-icon>
        </button>
        <button
          class="icon-btn"
          aria-label="Delete feature"
          @click=${() => this._removeFeature(index)}
        >
          <ha-icon icon="mdi:delete"></ha-icon>
        </button>
      </div>
      ${expanded ? html`<div class="feature-editor">${this._renderFeatureEditor(feature, index)}</div>` : nothing}
    </div>`;
  }
  private _renderFeatureEditor(feature: FeatureConfig, index: number): TemplateResult {
    const change = (e: CustomEvent<{ feature: FeatureConfig }>) => this._featureChanged(index, e);
    switch (feature.type) {
      case 'fan-presets':
      case 'speed-wheel':
      case 'filter-vacuum':
      case 'percentage-tile':
        return html`<mp-purifier-feature-editor
          .hass=${this.hass}
          .fanEntity=${this._config.entity}
          .cardConfig=${this._config}
          .rpmEntity=${this._rpmEntity}
          .feature=${feature}
          @feature-changed=${change}
        ></mp-purifier-feature-editor>`;
      case 'entity-tile':
        return html`<mp-entity-tile-editor
          .hass=${this.hass}
          .feature=${feature}
          @feature-changed=${change}
        ></mp-entity-tile-editor>`;
      case 'input-select':
        return html`<mp-input-select-editor
          .hass=${this.hass}
          .feature=${feature}
          @feature-changed=${change}
        ></mp-input-select-editor>`;
      default: {
        const domains =
          feature.type === 'sensor-list'
            ? ['sensor', 'binary_sensor']
            : feature.type === 'button-list'
              ? ['button', 'input_button', 'scene', 'script']
              : ['switch', 'input_boolean', 'light', 'fan'];
        return html`<mp-entity-list-editor
          .hass=${this.hass}
          .feature=${feature}
          itemsKey=${feature.type === 'switch-list' || feature.type === 'switch-group' ? 'entities' : 'items'}
          .showDisplay=${feature.type === 'switch-group'}
          .includeDomains=${domains}
          @feature-changed=${change}
        ></mp-entity-list-editor>`;
      }
    }
  }

  static styles = [
    tokens,
    css`
      :host {
        display: block;
        container-type: inline-size;
      }
      .fields,
      .calibration {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 0;
      }
      .field-row {
        display: grid;
        gap: 12px;
        min-width: 0;
      }
      .field-column {
        display: flex;
        flex-direction: column;
        gap: 8px;
        color: var(--mp-on-surface-variant);
      }
      .field-row > * {
        min-width: 0;
      }
      .halves {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .thirds {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      @container (width < 360px) {
        .field-row {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      .actions {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
      }
      .warning {
        border: 1px solid var(--mp-outline-variant);
        background: var(--mp-surface-container);
        border-radius: var(--mp-shape-chip-square);
        padding: 12px;
        color: var(--mp-on-surface);
        overflow-wrap: anywhere;
      }
      button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      .editor,
      .features,
      .add-menu {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .features {
        gap: 8px;
      }
      summary {
        cursor: pointer;
        padding: 12px 0;
        color: var(--mp-on-surface);
      }
      .features-header {
        font-weight: 500;
        color: var(--mp-on-surface);
      }
      .feature {
        border: 1px solid var(--mp-outline-variant);
        border-radius: var(--mp-shape-chip-square);
        overflow: visible;
        background: var(--mp-surface-container);
      }
      .feature-head {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
      }
      .handle {
        cursor: grab;
        color: var(--mp-on-surface-variant);
        display: grid;
        place-items: center;
      }
      .feature-title {
        flex: 1;
        min-width: 0;
        color: var(--mp-on-surface);
        overflow-wrap: anywhere;
      }
      button {
        font: inherit;
        cursor: pointer;
        border: none;
      }
      .icon-btn {
        flex-shrink: 0;
        width: 44px;
        height: 44px;
        border-radius: var(--mp-shape-full);
        background: transparent;
        color: var(--mp-on-surface-variant);
      }
      button:hover {
        background: var(--mp-surface-container-highest);
      }
      button:focus-visible,
      summary:focus-visible {
        outline: 2px solid var(--mp-primary);
        outline-offset: 2px;
      }
      .feature-editor {
        padding: 8px 12px 12px;
        border-top: 1px solid var(--mp-outline-variant);
      }
      .hint {
        color: var(--mp-on-surface-variant);
        font-size: 13px;
        margin: 0;
        overflow-wrap: anywhere;
      }
      .add-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 44px;
        padding: 10px 18px;
        border-radius: var(--mp-shape-full);
        background: var(--mp-primary);
        color: var(--mp-on-primary);
      }
      .add-btn:hover {
        background: var(--mp-primary);
        filter: brightness(0.95);
      }
      .add-menu {
        margin-top: 8px;
        gap: 0;
        background: var(--mp-surface);
        border: 1px solid var(--mp-outline-variant);
        border-radius: var(--mp-shape-chip-square);
        overflow: hidden;
      }
      .add-opt {
        text-align: left;
        min-height: 44px;
        padding: 12px 16px;
        background: transparent;
        color: var(--mp-on-surface);
      }
    `,
  ];
}

if (!customElements.get('material-purifier-card-editor'))
  customElements.define('material-purifier-card-editor', MaterialPurifierCardEditor);
declare global {
  interface HTMLElementTagNameMap {
    'material-purifier-card-editor': MaterialPurifierCardEditor;
  }
}
