import { LitElement, html, css, nothing, type TemplateResult, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type {
  FanPresetsFeatureConfig,
  SpeedWheelFeatureConfig,
  FilterVacuumFeatureConfig,
  OptionOverride,
  DustLevel,
  PercentageTileFeatureConfig,
  MaterialPurifierCardConfig,
} from '../types';
import { tokens, orderValues, prettyLabel, presetIcon, presetColor } from '../theme';
import { DEFAULT_THRESHOLDS } from '../calc/vacuum';
import { MAX_WIDTH_PCT, TILE_DEFAULT_PCT } from '../grid';
import { ensureHaComponents } from './load-ha';
import { createVacuumHelpers } from '../setup-helpers';
import './select-field';
import './display-toggle';
import './width-field';
import './icon-field';
import './text-field';
import './color-field';
import './entity-picker';

type PurifierFeature =
  | FanPresetsFeatureConfig
  | SpeedWheelFeatureConfig
  | FilterVacuumFeatureConfig
  | PercentageTileFeatureConfig;
type PercentageRange = NonNullable<PercentageTileFeatureConfig['ranges']>[number];
interface Schema {
  name: string;
  required?: boolean;
  selector: Record<string, unknown>;
}
/** Mutable dependency seam for helper creation without real HA service calls. */
export const helperCreator = { create: createVacuumHelpers };

/** Editors for purifier-specific features; all patches retain unexposed YAML. */
export class MpPurifierFeatureEditor extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) feature!: PurifierFeature;
  @property() fanEntity = '';
  @property({ attribute: false }) cardConfig?: MaterialPurifierCardConfig;
  @property() rpmEntity = '';
  @state() private _settingUp = false;
  @state() private _setupError = '';
  @state() private _rangeDrafts: PercentageRange[] = [];
  private _emittedFeature?: PurifierFeature;

  protected willUpdate(changed: PropertyValues): void {
    if (changed.has('feature') && this.feature !== this._emittedFeature) {
      this._rangeDrafts =
        this.feature?.type === 'percentage-tile'
          ? (this.feature.ranges ?? []).map((range) => ({ ...range }))
          : [];
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    void ensureHaComponents().then(() => this.requestUpdate());
  }

  private _emit(patch: Record<string, unknown>): void {
    const feature = { ...this.feature, ...patch };
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) delete (feature as Record<string, unknown>)[key];
    }
    if (feature.type === 'speed-wheel') {
      if (!feature.entity) delete feature.entity;
      if (feature.preset === '') delete feature.preset;
      if (feature.display === 'percent') delete feature.display;
      if (feature.estimate_auto !== false) delete feature.estimate_auto;
      if (feature.show_coverage !== false) delete feature.show_coverage;
    }
    if (feature.type === 'percentage-tile') {
      for (const key of ['attribute', 'name', 'icon', 'color', 'min', 'max', 'width'] as const) {
        if (feature[key] === '' || feature[key] === undefined) delete feature[key];
      }
      const ranges = this._rangeDrafts
        .filter((range) => range.color.trim())
        .map((range) => ({ ...range }));
      if (ranges.length) feature.ranges = ranges;
      else delete feature.ranges;
      this._emittedFeature = feature;
      this.feature = feature;
    }
    this.dispatchEvent(
      new CustomEvent('feature-changed', { detail: { feature }, bubbles: true, composed: true })
    );
  }
  private _values(): string[] {
    const values: unknown = this.hass?.states?.[this.fanEntity]?.attributes.preset_modes;
    return Array.isArray(values)
      ? values.filter((value): value is string => typeof value === 'string')
      : [];
  }
  private _orderedValues(): string[] {
    return orderValues(
      [...this._values()],
      this.feature.type === 'fan-presets' ? this.feature.order : undefined
    );
  }
  private _moveOption(e: CustomEvent<{ oldIndex: number; newIndex: number }>): void {
    e.stopPropagation();
    const order = this._orderedValues();
    const { oldIndex, newIndex } = e.detail;
    if (
      !Number.isInteger(oldIndex) ||
      !Number.isInteger(newIndex) ||
      oldIndex < 0 ||
      newIndex < 0 ||
      oldIndex >= order.length ||
      newIndex >= order.length
    )
      return;
    const [moved] = order.splice(oldIndex, 1);
    order.splice(newIndex, 0, moved);
    this._emit({ order });
  }
  private _setOverride(value: string, patch: Partial<OptionOverride>): void {
    if (this.feature.type !== 'fan-presets') return;
    const options = [...(this.feature.options ?? [])];
    const index = options.findIndex((o) => o.value === value);
    const merged: OptionOverride = { ...(index >= 0 ? options[index] : { value }), ...patch };
    if (!merged.label) delete merged.label;
    if (merged.icon === undefined) delete merged.icon;
    if (!merged.color) delete merged.color;
    if (!merged.hide) delete merged.hide;
    const meaningful = Object.keys(merged).some((key) => key !== 'value');
    if (index >= 0) {
      if (meaningful) options[index] = merged;
      else options.splice(index, 1);
    } else if (meaningful) options.push(merged);
    this._emit({ options });
  }
  private _computeLabel = (s: Schema): string =>
    s.name === 'show_off' ? 'Show Off option' : s.name;
  private _formChanged(e: CustomEvent<{ value: Record<string, unknown> }>): void {
    e.stopPropagation();
    const patch: Record<string, unknown> = {};
    const thresholds = {
      ...(this.feature.type === 'filter-vacuum' ? this.feature.thresholds : undefined),
    };
    let changedThresholds = false;
    for (const [key, value] of Object.entries(e.detail.value)) {
      const empty = value === '' || value === undefined || value === null;
      if (key.startsWith('threshold_')) {
        const level = key.slice(10) as DustLevel;
        changedThresholds = true;
        if (empty) delete thresholds[level];
        else if (typeof value === 'number' && Number.isFinite(value) && value > 0)
          thresholds[level] = value;
      } else patch[key] = empty ? undefined : value;
    }
    if (changedThresholds)
      patch.thresholds = Object.keys(thresholds).length ? thresholds : undefined;
    this._emit(patch);
  }

  private _thresholdChanged(level: DustLevel, e: CustomEvent<{ value: string }>): void {
    if (this.feature.type !== 'filter-vacuum') return;
    const input = (e.target as HTMLElement).shadowRoot!.querySelector('input')!;
    if (!input.checkValidity()) return;
    const thresholds = { ...this.feature.thresholds };
    if (input.value === '') delete thresholds[level];
    else thresholds[level] = input.valueAsNumber;
    this._emit({ thresholds: Object.keys(thresholds).length ? thresholds : undefined });
  }

  private async _setupTracking(): Promise<void> {
    if (this._settingUp || !this.rpmEntity || this.feature.type !== 'filter-vacuum') return;
    const original = this.feature;
    this._settingUp = true;
    this._setupError = '';
    try {
      const name = this.hass.states[this.fanEntity]?.attributes.friendly_name;
      const helpers = await helperCreator.create(this.hass, {
        rpmEntity: this.rpmEntity,
        name: typeof name === 'string' ? name : this.fanEntity,
      });
      // Never attach helpers to another feature selected while the request was pending.
      if (!this.isConnected || this.feature !== original) return;
      this._emit({
        counter_entity: helpers.counterEntity,
      });
      this.feature = {
        ...original,
        counter_entity: helpers.counterEntity,
      };
    } catch {
      if (this.feature === original)
        this._setupError =
          'Could not set up tracking. Check your connection and permissions, then try again.';
    } finally {
      this._settingUp = false;
    }
  }

  private _renderSpeed(f: SpeedWheelFeatureConfig): TemplateResult {
    return html`
      <div class="field-column">
        <span class="field-label">Speed entity</span>
        <mp-entity-picker
          .hass=${this.hass}
          .value=${f.entity ?? ''}
          label="Speed entity"
          .includeDomains=${['number', 'input_number']}
          .allowCustom=${true}
          @value-changed=${(e: CustomEvent<{ value: string }>) => this._emit({ entity: e.detail.value || undefined })}
        ></mp-entity-picker>
        <p class="hint">Leave empty to use the fan's percentage</p>
      </div>
      <div class="short-row">
        <div class="field-column short-field">
          <span class="field-label">Preset</span>
          <mp-select-field
            label="Preset"
            .value=${f.preset === false ? 'none' : f.preset ? `preset:${f.preset}` : ''}
            .options=${[
              { value: '', label: 'Auto-detect' },
              { value: 'none', label: 'None' },
              ...this._values().map((value) => ({ value: `preset:${value}`, label: value })),
            ]}
            @value-changed=${(e: CustomEvent<{ value: string }>) => this._emit({ preset: e.detail.value === 'none' ? false : e.detail.value ? e.detail.value.slice(7) : undefined })}
          ></mp-select-field>
        </div>
        <div class="field-column short-field">
          <span class="field-label">Display</span>
          <mp-select-field
            label="Display"
            .value=${f.display ?? 'percent'}
            .options=${[
              { value: 'percent', label: 'Percent' },
              { value: 'level', label: 'Level' },
            ]}
            @value-changed=${(e: CustomEvent<{ value: string }>) => this._emit({ display: e.detail.value === 'level' ? 'level' : undefined })}
          ></mp-select-field>
        </div>
      </div>
      ${(['estimate_auto', 'show_coverage'] as const).map(
        (key) => html`
          <div class="field-column">
            <span class="field-label"
              >${key === 'estimate_auto' ? 'Show live speed in Auto' : 'Show room coverage'}</span
            >
            <label class="toggle">
              <input
                type="checkbox"
                data-field=${key}
                .checked=${f[key] !== false}
                @change=${(e: Event) => this._emit({ [key]: (e.target as HTMLInputElement).checked ? undefined : false })}
              />
              ${key === 'estimate_auto' ? 'Show live speed in Auto' : 'Show room coverage'}
            </label>
          </div>
        `
      )}
      ${this.cardConfig?.cadr === undefined ? html`<p class="hint">Needs CADR in card settings</p>` : nothing}
    `;
  }

  private _renderTracking(f: FilterVacuumFeatureConfig): TemplateResult {
    return f.counter_entity
      ? html`
          <p class="hint" role="status">Counting motor runtime since the last vacuum</p>
          <details>
            <summary>Advanced</summary>
            <div class="editor">
              <div class="field-column">
                <span class="field-label">Tracking counter</span>
                <mp-entity-picker
                  .hass=${this.hass}
                  .value=${f.counter_entity}
                  label="Counter entity"
                  .includeDomains=${['sensor']}
                  .allowCustom=${true}
                  @value-changed=${(e: CustomEvent<{ value: string }>) => this._emit({ counter_entity: e.detail.value || undefined })}
                ></mp-entity-picker>
                <p class="hint">
                  Utility Meter (no cycle) over an Integration of the motor speed sensor
                </p>
              </div>
            </div>
          </details>
        `
      : html`
          <button
            type="button"
            class="setup-tracking"
            ?disabled=${!this.rpmEntity || this._settingUp}
            aria-describedby="tracking-status"
            @click=${this._setupTracking}
          >
            Set up tracking
          </button>
          <p id="tracking-status" class="hint" role="status">
            ${this._settingUp ? 'Setting up tracking…' : !this.rpmEntity ? 'Choose a motor speed sensor in card settings' : ''}
          </p>
          ${this._setupError ? html`<p class="hint" role="alert">${this._setupError}</p>` : nothing}
        `;
  }

  protected render(): TemplateResult {
    if (!this.feature) return html``;
    const f = this.feature;
    if (f.type === 'percentage-tile') return this._renderPercentage(f);
    return html`<div class="editor">
      ${
        f.type === 'filter-vacuum'
          ? html`
              <div class="vacuum-info" role="note">
                <ha-icon icon="mdi:information-outline" aria-hidden="true"></ha-icon>
                <div>
                  <div class="vacuum-info-title">What this tracks</div>
                  <p>
                    Dust and hair collect on the outer mesh of the purifier's cylindrical filter.
                    Vacuuming it regularly keeps air flowing and the filter working longer. This
                    tile counts how much air has passed through since you last vacuumed it and tells
                    you when it's time again. Tap ✓ on the tile after vacuuming to start a new
                    count.
                  </p>
                </div>
              </div>
            `
          : nothing
      }
      <div class="field-column">
        <span class="field-label">Title</span>
        <mp-text-field
          label="Title (optional)"
          .value=${f.label ?? ''}
          @value-changed=${(e: CustomEvent<{ value: string }>) => this._emit({ label: e.detail.value || undefined })}
        ></mp-text-field>
      </div>
      ${
        f.type === 'fan-presets'
          ? html`
              <div class="field-column">
                <span class="field-label">Display</span>
                <mp-display-toggle
                  .value=${f.display ?? 'tile'}
                  @value-changed=${(e: CustomEvent<{ value: string }>) => this._emit({ display: e.detail.value })}
                ></mp-display-toggle>
              </div>
              <div class="field-column">
                <span class="field-label">Show Off option</span>
                <ha-form
                  .hass=${this.hass}
                  .data=${{ show_off: f.show_off ?? false }}
                  .schema=${[{ name: 'show_off', selector: { boolean: {} } }]}
                  .computeLabel=${this._computeLabel}
                  @value-changed=${this._formChanged}
                ></ha-form>
              </div>
            `
          : nothing
      }
      ${f.type === 'speed-wheel' ? this._renderSpeed(f) : nothing}
      ${
        f.type === 'filter-vacuum'
          ? html`${this._renderTracking(f)}
              <div class="field-column">
                <span class="field-label">Household dust level</span>
                <mp-select-field
                  label="Household dust level"
                  .value=${f.dust_level ?? (f.dust_level_entity ? undefined : 'medium')}
                  .options=${(['low', 'medium', 'high'] as const).map((value) => ({ value, label: prettyLabel(value) }))}
                  @value-changed=${(e: CustomEvent<{ value: string }>) => this._emit({ dust_level: e.detail.value || undefined })}
                ></mp-select-field>
              </div>
              <div class="field-column">
                <span class="field-label">Air filtered between vacuums</span>
                <p class="hint">
                  How many m³ of air the purifier can clean before the pre-filter needs vacuuming.
                  The household dust level picks which one applies.
                </p>
                <div class="thresholds">
                  ${(['low', 'medium', 'high'] as const).map(
                    (level) => html`
                      <div class="field-column">
                        <span class="field-label">${prettyLabel(level)} dust (m³)</span>
                        <mp-text-field
                          type="number"
                          label=${`${prettyLabel(level)} threshold (m³)`}
                          min="1"
                          step="any"
                          data-level=${level}
                          placeholder=${String(DEFAULT_THRESHOLDS[level])}
                          .value=${f.thresholds?.[level] === undefined ? '' : String(f.thresholds[level])}
                          @value-changed=${(e: CustomEvent<{ value: string }>) => this._thresholdChanged(level, e)}
                        ></mp-text-field>
                      </div>
                    `
                  )}
                </div>
                <p class="hint">
                  Leave empty to use the defaults shown. Medium is about 2 months of mostly-Auto use
                  on a 360 m³/h purifier.
                </p>
              </div>
              <div class="field-column">
                <span class="field-label">Dust level helper (optional)</span>
                <mp-entity-picker
                  .hass=${this.hass}
                  .value=${f.dust_level_entity ?? ''}
                  label="Dust level entity"
                  .includeDomains=${['input_select', 'select']}
                  .allowCustom=${true}
                  @value-changed=${(e: CustomEvent<{ value: string }>) => this._emit({ dust_level_entity: e.detail.value || undefined })}
                ></mp-entity-picker>
                <p class="hint">
                  Optional: read the level from a helper when no dust level is set (read-only)
                </p>
              </div>`
          : nothing
      }
      ${
        f.type !== 'fan-presets'
          ? html`<div class="appearance-row">
              <div class="field-column">
                <span class="field-label">Icon</span>
                <mp-icon-field
                  .hass=${this.hass}
                  .value=${f.icon}
                  .defaultIcon=${f.type === 'speed-wheel' ? 'mdi:fan' : 'mdi:vacuum'}
                  @value-changed=${(e: CustomEvent<{ value: string | undefined }>) => this._emit({ icon: e.detail.value })}
                ></mp-icon-field>
              </div>
              <div class="field-column">
                <span class="field-label">Color</span>
                <mp-color-field
                  .value=${f.color}
                  @value-changed=${(e: CustomEvent<{ value: string | undefined }>) => this._emit({ color: e.detail.value || undefined })}
                ></mp-color-field>
              </div>
            </div>`
          : nothing
      }
      <div class="field-column">
        <span class="field-label">Width</span>
        <mp-width-field
          .hass=${this.hass}
          .value=${f.width}
          .default=${f.type === 'fan-presets' ? MAX_WIDTH_PCT : TILE_DEFAULT_PCT}
          @width-changed=${(e: CustomEvent<{ value: number | undefined }>) => this._emit({ width: e.detail.value })}
        ></mp-width-field>
      </div>
      ${f.type === 'fan-presets' ? this._renderOptions() : nothing}
    </div>`;
  }
  private _percentageNumber(key: 'min' | 'max', e: CustomEvent<{ value: string }>): void {
    const input = (e.target as HTMLElement).shadowRoot!.querySelector('input')!;
    if (!input.checkValidity()) return;
    this._emit({ [key]: input.value === '' ? undefined : input.valueAsNumber });
  }

  private _rangeChanged(index: number, patch: Partial<PercentageRange>): void {
    this._rangeDrafts = this._rangeDrafts.map((range, i) => {
      if (i !== index) return range;
      const next = { ...range, ...patch };
      if (next.from === undefined) delete next.from;
      if (next.to === undefined) delete next.to;
      return next;
    });
    this._emit({});
  }

  private _renderPercentage(f: PercentageTileFeatureConfig): TemplateResult {
    return html`<div class="editor">
      <div class="field-column">
        <span class="field-label">Entity</span>
        <mp-entity-picker
          .hass=${this.hass}
          .value=${f.entity}
          label="Entity"
          .includeDomains=${['sensor', 'number', 'input_number']}
          .allowCustom=${true}
          @value-changed=${(e: CustomEvent<{ value: string }>) => this._emit({ entity: e.detail.value })}
        ></mp-entity-picker>
      </div>
      <div class="short-row">
        ${(['attribute', 'name'] as const).map(
          (key) =>
            html`<div class="field-column short-field">
              <span class="field-label">${key === 'name' ? 'Name' : 'Attribute (optional)'}</span>
              <mp-text-field
                label=${key === 'name' ? 'Name' : 'Attribute'}
                .value=${f[key] ?? ''}
                @value-changed=${(e: CustomEvent<{ value: string }>) => this._emit({ [key]: e.detail.value || undefined })}
              ></mp-text-field>
            </div>`
        )}
      </div>
      <div class="appearance-row">
        <div class="field-column">
          <span class="field-label">Icon</span>
          <mp-icon-field
            .hass=${this.hass}
            .value=${f.icon}
            .defaultIcon=${'mdi:gauge'}
            @value-changed=${(e: CustomEvent<{ value: string | undefined }>) => this._emit({ icon: e.detail.value || undefined })}
          ></mp-icon-field>
        </div>
        <div class="field-column">
          <span class="field-label">Color</span>
          <mp-color-field
            .value=${f.color}
            label="Fallback color"
            @value-changed=${(e: CustomEvent<{ value: string | undefined }>) => this._emit({ color: e.detail.value || undefined })}
          ></mp-color-field>
        </div>
      </div>
      <div class="thresholds">
        ${(['min', 'max'] as const).map(
          (key) =>
            html`<div class="field-column">
              <span class="field-label">${key === 'min' ? 'Min' : 'Max'}</span>
              <mp-text-field
                type="number"
                label=${key === 'min' ? 'Min' : 'Max'}
                step="any"
                data-field=${key}
                placeholder=${key === 'min' ? '0' : '100'}
                .value=${f[key] === undefined ? '' : String(f[key])}
                @value-changed=${(e: CustomEvent<{ value: string }>) => this._percentageNumber(key, e)}
              ></mp-text-field>
            </div>`
        )}
      </div>
      <div class="field-label">Color ranges</div>
      <div class="ranges">
        <div class="range-header"><span>From</span><span>To</span><span>Color</span></div>
        ${this._rangeDrafts.length ? nothing : html`<p class="hint">No ranges. The fallback color applies.</p>`}
        ${this._rangeDrafts.map(
          (range, index) =>
            html`<div class="range">
              ${(['from', 'to'] as const).map(
                (key) =>
                  html`<mp-text-field
                    label=${key === 'from' ? 'From' : 'To'}
                    placeholder="—"
                    type="number"
                    step="any"
                    data-field=${key}
                    .value=${range[key] === undefined ? '' : String(range[key])}
                    @value-changed=${(e: CustomEvent<{ value: string }>) => {
                      const input = (e.target as HTMLElement).shadowRoot!.querySelector('input')!;
                      if (input.checkValidity())
                        this._rangeChanged(index, {
                          [key]: input.value === '' ? undefined : input.valueAsNumber,
                        });
                    }}
                  ></mp-text-field>`
              )}
              <mp-color-field
                label="Color"
                .value=${range.color}
                @value-changed=${(e: CustomEvent<{ value: string | undefined }>) => this._rangeChanged(index, { color: e.detail.value || '' })}
              ></mp-color-field>
              <button
                class="opt-hide"
                type="button"
                aria-label="Remove range"
                @click=${() => {
                  this._rangeDrafts = this._rangeDrafts.filter((_, i) => i !== index);
                  this._emit({});
                }}
              >
                <ha-icon icon="mdi:delete"></ha-icon>
              </button>
            </div>`
        )}
      </div>
      <button
        class="add-range"
        type="button"
        aria-label="Add range"
        @click=${() => {
          this._rangeDrafts = [...this._rangeDrafts, { color: '' }];
        }}
      >
        Add range
      </button>
      <div class="field-column">
        <span class="field-label">Width</span>
        <mp-width-field
          .hass=${this.hass}
          .value=${f.width}
          .default=${TILE_DEFAULT_PCT}
          @width-changed=${(e: CustomEvent<{ value: number | undefined }>) => this._emit({ width: e.detail.value })}
        ></mp-width-field>
      </div>
    </div>`;
  }
  private _renderOptions(): TemplateResult {
    if (!this._values().length)
      return html`<p class="hint">
        Pick a fan entity that exposes preset modes to customize them.
      </p>`;
    return html`<ha-sortable handle-selector=".handle" @item-moved=${this._moveOption}>
      <div class="options">${this._orderedValues().map((value) => this._renderOption(value))}</div>
    </ha-sortable>`;
  }
  private _renderOption(value: string): TemplateResult {
    const override =
      this.feature.type === 'fan-presets'
        ? this.feature.options?.find((o) => o.value === value)
        : undefined;
    return html`<div class="opt">
      <div class="handle"><ha-icon icon="mdi:drag"></ha-icon></div>
      <div class="opt-name" title=${value}>${prettyLabel(value)}</div>
      <div class="title-group field-column">
        <span class="field-label">Name</span>
        <mp-text-field
          label=${prettyLabel(value)}
          .value=${override?.label ?? ''}
          @value-changed=${(e: CustomEvent<{ value: string }>) => this._setOverride(value, { label: e.detail.value })}
        ></mp-text-field>
      </div>
      <div class="appearance-row option-appearance">
        <div class="field-column">
          <span class="field-label">Icon</span>
          <mp-icon-field
            .hass=${this.hass}
            .value=${override?.icon}
            .defaultIcon=${presetIcon(value)}
            @value-changed=${(e: CustomEvent<{ value: string | undefined }>) => this._setOverride(value, { icon: e.detail.value })}
          ></mp-icon-field>
        </div>
        <div class="field-column">
          <span class="field-label">Color</span>
          <mp-color-field
            .value=${override?.color}
            .defaultColor=${presetColor(value)}
            @value-changed=${(e: CustomEvent<{ value: string }>) => this._setOverride(value, { color: e.detail.value })}
          ></mp-color-field>
        </div>
      </div>
      <button
        class="opt-hide"
        aria-pressed=${String(!!override?.hide)}
        aria-label=${override?.hide ? 'Show option' : 'Hide option'}
        @click=${() => this._setOverride(value, { hide: !override?.hide })}
      >
        <ha-icon icon=${override?.hide ? 'mdi:eye-off' : 'mdi:eye'}></ha-icon>
      </button>
    </div>`;
  }
  static styles = [
    tokens,
    css`
      .editor,
      .options {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .vacuum-info {
        display: flex;
        align-items: start;
        gap: 12px;
        background: var(--mp-surface-container-high);
        border-radius: var(--mp-shape-chip-square);
        padding: 12px 16px;
        color: var(--mp-on-surface);
        font-family: var(--md-sys-typescale-body-medium-font, inherit);
        font-size: var(--md-sys-typescale-body-medium-size, 14px);
        font-weight: var(--md-sys-typescale-body-medium-weight, 400);
        line-height: var(--md-sys-typescale-body-medium-line-height, 20px);
      }
      .vacuum-info ha-icon {
        flex: none;
        color: var(--mp-on-surface-variant);
      }
      .vacuum-info-title {
        font-family: var(--md-sys-typescale-label-large-font, inherit);
        font-size: var(--md-sys-typescale-label-large-size, 14px);
        font-weight: var(--md-sys-typescale-label-large-weight, 500);
        line-height: var(--md-sys-typescale-label-large-line-height, 20px);
      }
      .vacuum-info p {
        margin: 4px 0 0;
      }
      .field {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .appearance-row,
      .short-row {
        display: flex;
        align-items: start;
        gap: 12px;
        min-width: 0;
      }
      .field-column {
        display: flex;
        flex-direction: column;
        gap: 8px;
        color: var(--mp-on-surface-variant);
        min-width: 0;
      }
      .short-field {
        flex: 1;
      }
      .option-appearance {
        grid-column: 1 / 3;
      }
      .ranges {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .range-header,
      .range {
        display: grid;
        grid-template-columns: minmax(0, 88px) minmax(0, 88px) 56px 40px;
        gap: 8px;
        align-items: center;
      }
      .range-header {
        color: var(--mp-on-surface-variant);
      }
      .range .opt-hide {
        align-self: center;
        width: 40px;
        height: 40px;
        padding: 0;
      }
      .add-range {
        align-self: start;
        min-height: 40px;
        padding: 8px 16px;
        border: none;
        border-radius: var(--mp-shape-full);
        background: var(--mp-secondary-container);
        color: var(--mp-on-secondary-container);
        font: inherit;
        cursor: pointer;
      }
      .add-range:hover {
        background: var(--mp-surface-container-highest);
        color: var(--mp-on-surface);
      }
      .add-range:focus-visible {
        outline: 2px solid var(--mp-primary);
        outline-offset: 2px;
      }
      .field-label,
      .hint,
      .opt-name {
        color: var(--mp-on-surface-variant);
      }
      .hint {
        margin: 0;
        font-size: 13px;
      }
      .opt {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
      }
      .opt-name {
        grid-column: 2 / -1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .title-group {
        display: flex;
        align-items: stretch;
        min-width: 0;
        grid-column: 1 / 3;
      }
      .title-group mp-text-field {
        flex: 1;
        min-width: 0;
      }
      .handle {
        cursor: grab;
        color: var(--mp-on-surface-variant);
      }
      .opt-hide {
        width: 44px;
        height: 44px;
        border: none;
        border-radius: var(--mp-shape-full);
        color: var(--mp-on-surface-variant);
        background: transparent;
        cursor: pointer;
      }
      .opt-hide[aria-pressed='true'] {
        color: var(--mp-error);
      }
      .opt-hide:hover {
        background: var(--mp-surface-container-highest);
      }
      .opt-hide:focus-visible {
        outline: 2px solid var(--mp-primary);
        outline-offset: 2px;
      }
      .thresholds {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 12px;
      }
      .thresholds label {
        display: flex;
        flex-direction: column;
        gap: 8px;
        color: var(--mp-on-surface-variant);
      }
      .thresholds input {
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        min-height: 44px;
        padding: 8px 12px;
        border: 1px solid var(--mp-outline-variant);
        border-radius: var(--mp-shape-full);
        background: var(--mp-surface-container-high);
        color: var(--mp-on-surface);
        font: inherit;
      }
      .thresholds input:focus-visible {
        outline: 2px solid var(--mp-primary);
        outline-offset: 2px;
      }
      .thresholds input::placeholder {
        color: var(--mp-on-surface-variant);
      }
      .toggle,
      summary {
        display: flex;
        align-items: center;
        min-height: 44px;
        gap: 12px;
        cursor: pointer;
      }
      summary {
        display: list-item;
      }
      .toggle input {
        accent-color: var(--mp-primary);
      }
      .setup-tracking {
        min-height: 44px;
        padding: 8px 12px;
        border: 1px solid var(--mp-outline-variant);
        border-radius: var(--mp-shape-full);
        background: var(--mp-surface-container-high);
        color: var(--mp-on-surface);
        font: inherit;
        cursor: pointer;
      }
      .setup-tracking:hover:not(:disabled) {
        background: var(--mp-surface-container-highest);
      }
      .setup-tracking:disabled {
        color: var(--mp-on-surface-variant);
        cursor: not-allowed;
      }
      .setup-tracking:focus-visible,
      summary:focus-visible,
      .toggle input:focus-visible {
        outline: 2px solid var(--mp-primary);
        outline-offset: 2px;
      }
      [role='alert'] {
        color: var(--mp-error);
      }
    `,
  ];
}
if (!customElements.get('mp-purifier-feature-editor'))
  customElements.define('mp-purifier-feature-editor', MpPurifierFeatureEditor);
declare global {
  interface HTMLElementTagNameMap {
    'mp-purifier-feature-editor': MpPurifierFeatureEditor;
  }
}
