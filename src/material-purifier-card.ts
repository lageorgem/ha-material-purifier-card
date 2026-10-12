import { LitElement, css, html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { applyThemesOnElement, type HomeAssistant } from 'custom-card-helpers';
import { styleMap, type StyleInfo } from 'lit/directives/style-map.js';
import { CARD_NAME, CARD_DISPLAY_NAME, CARD_DESCRIPTION, CARD_VERSION } from './const';
import type { AqiMetric, FeatureConfig, MaterialPurifierCardConfig } from './types';
import {
  CARD_PADDING_X,
  DIAL_MAX_PX,
  DIAL_MIN_PX,
  GRID_COLUMNS,
  MAX_WIDTH_PCT,
  MIN_WIDTH_PCT,
  TILE_DEFAULT_PCT,
  WIDE_MIN_PX,
  WIDTH_STEP,
} from './grid';
import { presetIcon, prettyLabel, tokens } from './theme';
import { convertAqi, metricLabel, pm25Color } from './calc/aqi';
import {
  autoRpmEntity,
  displayAqi,
  loadMetric,
  motorFraction,
  readAqi,
  readNumber,
  saveMetric,
  resolveMetric,
  toggleMetric,
} from './entities';
import { formatSpeed, resolveSpeedTarget, speedFraction, speedPreset, speedSource } from './speed';
import { resolveMaxRpm } from './speed-calibration';
import './dial/purifier-dial';
import './features/feature-row';

export class MaterialPurifierCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: MaterialPurifierCardConfig;
  @state() private _metric: AqiMetric = 'us_aqi';
  @state() private _widthPx = 0;

  private _resizeObserver?: ResizeObserver;

  public setConfig(config: MaterialPurifierCardConfig): void {
    if (!config || typeof config.entity !== 'string' || !config.entity.startsWith('fan.')) {
      throw new Error('Specify a fan entity');
    }
    this._config = { ...config, features: config.features ?? [] };
    const metric = resolveMetric(config.aqi);
    const stored = config.aqi?.allow_cycle === true ? loadMetric(config.entity, metric) : metric;
    this._metric = stored === 'pm25' ? stored : toggleMetric('pm25', config.aqi);
  }

  public getCardSize(): number {
    return (
      7 +
      Math.ceil((this._config?.features?.length ?? 0) / 2) -
      (this._config?.show_name === false ? 1 : 0)
    );
  }

  public static async getConfigElement(): Promise<HTMLElement> {
    await import('./editor');
    return document.createElement('material-purifier-card-editor');
  }

  public static getStubConfig(hass: HomeAssistant): MaterialPurifierCardConfig {
    return {
      type: `custom:${CARD_NAME}`,
      entity: Object.keys(hass.states).find((entity) => entity.startsWith('fan.')) ?? '',
      features: [{ type: 'fan-presets', display: 'tile' }, { type: 'speed-wheel' }],
    };
  }

  private _trackedEntityIds(hass: HomeAssistant): Set<string> {
    const cfg = this._config!;
    const ids = new Set<string>([cfg.entity]);
    const add = (id: string | null | undefined): void => {
      if (id) ids.add(id);
    };
    add(cfg.aqi?.entity);
    add(readAqi(hass, cfg.entity, cfg.aqi).entity);
    add(cfg.motor_speed_entity ?? autoRpmEntity(hass, cfg.entity));
    const speed = speedSource(cfg);
    add(speed.entity);
    add(resolveSpeedTarget(hass, cfg.entity, speed).entity);
    for (const feature of cfg.features ?? []) {
      if ('entity' in feature) add(feature.entity);
      if ('entities' in feature) feature.entities.forEach((item) => add(item.entity));
      if ('items' in feature) feature.items.forEach((item) => add(item.entity));
      if ('counter_entity' in feature) add(feature.counter_entity);
      if ('dust_level_entity' in feature) add(feature.dust_level_entity);
    }
    return ids;
  }

  protected shouldUpdate(changed: PropertyValues): boolean {
    if (changed.has('_config') || changed.has('_metric') || changed.has('_widthPx')) return true;
    if (!this._config || !this.hass) return false;
    if (changed.has('hass')) {
      const old = changed.get('hass') as HomeAssistant | undefined;
      if (!old || (this._config.theme && old.themes !== this.hass.themes)) return true;
      const cfg = this._config;
      if (
        readAqi(old, cfg.entity, cfg.aqi).entity !== readAqi(this.hass, cfg.entity, cfg.aqi).entity
      ) {
        return true;
      }
      if (
        (cfg.motor_speed_entity ?? autoRpmEntity(old, cfg.entity)) !==
        (cfg.motor_speed_entity ?? autoRpmEntity(this.hass, cfg.entity))
      ) {
        return true;
      }
      const ids = new Set([...this._trackedEntityIds(old), ...this._trackedEntityIds(this.hass)]);
      return [...ids].some((id) => old.states[id] !== this.hass!.states[id]);
    }
    return false;
  }

  protected updated(changed: PropertyValues): void {
    if (this._config?.theme && this.hass && (changed.has('hass') || changed.has('_config'))) {
      const old = changed.get('hass') as HomeAssistant | undefined;
      if (!old || old.themes !== this.hass.themes || changed.has('_config')) {
        applyThemesOnElement(this, this.hass.themes, this._config.theme);
      }
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (this._resizeObserver || typeof ResizeObserver === 'undefined') return;
    this._resizeObserver = new ResizeObserver((entries) => {
      const outer = entries[0]?.contentRect.width ?? 0;
      const inner = Math.max(0, outer - CARD_PADDING_X);
      if (Math.abs(inner - this._widthPx) >= 1) this._widthPx = inner;
    });
    // The host exists before config/hass, unlike the inner ha-card.
    this._resizeObserver.observe(this);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
  }

  private _featureWidthPct(feature: FeatureConfig): number {
    if (typeof feature.width === 'number' && feature.width > 0) {
      return Math.max(
        MIN_WIDTH_PCT,
        Math.min(MAX_WIDTH_PCT, Math.round(feature.width / WIDTH_STEP) * WIDTH_STEP)
      );
    }
    if (['percentage-tile', 'entity-tile', 'speed-wheel', 'filter-vacuum'].includes(feature.type)) {
      return TILE_DEFAULT_PCT;
    }
    return MAX_WIDTH_PCT;
  }

  private _layout(): {
    wide: boolean;
    dialStyle: StyleInfo;
    featureStyle: StyleInfo;
    gridCols: number;
  } {
    const features = this._config?.features ?? [];
    const maxPct = features.length
      ? Math.max(...features.map((feature) => this._featureWidthPct(feature)))
      : MAX_WIDTH_PCT;
    const leftoverPx = (this._widthPx * (100 - maxPct)) / 100;
    const wide =
      features.length > 0 &&
      maxPct < MAX_WIDTH_PCT &&
      this._widthPx >= WIDE_MIN_PX &&
      leftoverPx >= DIAL_MIN_PX;
    if (!wide) {
      return {
        wide: false,
        dialStyle: {},
        featureStyle: {},
        gridCols: GRID_COLUMNS,
      };
    }
    return {
      wide: true,
      dialStyle: { flex: '1 1 auto' },
      featureStyle: { flex: `0 0 ${maxPct}%` },
      gridCols: Math.max(1, maxPct / WIDTH_STEP),
    };
  }

  private _cycleMetric(): void {
    if (!this._config || this._config.aqi?.allow_cycle !== true) return;
    this._metric = toggleMetric(this._metric, this._config.aqi);
    saveMetric(this._config.entity, this._metric);
  }

  private _cycleMode(): void {
    if (!this._config || !this.hass) return;
    const fan = this.hass.states[this._config.entity];
    if (!fan || fan.state === 'unavailable') return;
    const modes: string[] = fan.attributes.preset_modes ?? [];
    if (modes.length < 2) return;
    const next = modes[(modes.indexOf(fan.attributes.preset_mode) + 1) % modes.length];
    void this.hass.callService('fan', 'set_preset_mode', {
      entity_id: this._config.entity,
      preset_mode: next,
    });
  }

  private _togglePower(): void {
    if (!this._config || !this.hass) return;
    const fan = this.hass.states[this._config.entity];
    if (!fan || fan.state === 'unavailable') return;
    void this.hass.callService('fan', fan.state === 'on' ? 'turn_off' : 'turn_on', {
      entity_id: this._config.entity,
    });
  }

  protected render() {
    if (!this._config || !this.hass) return html``;
    const cfg = this._config;
    const fan = this.hass.states[cfg.entity];
    const available = !!fan && fan.state !== 'unavailable';
    const running = fan?.state === 'on';
    const reading = readAqi(this.hass, cfg.entity, cfg.aqi);
    const display = displayAqi(reading, this._metric, cfg.aqi?.us_breakpoints ?? '2024');
    const density =
      reading.value === null
        ? null
        : convertAqi(reading.value, reading.source, 'pm25', cfg.aqi?.us_breakpoints ?? '2024');
    const rpmEntity = cfg.motor_speed_entity ?? autoRpmEntity(this.hass, cfg.entity);
    const speed = speedSource(cfg);
    const target = resolveSpeedTarget(this.hass, cfg.entity, speed);
    const maxRpm = resolveMaxRpm(cfg);
    const percentage: unknown = fan?.attributes.percentage;
    const fraction =
      (maxRpm === null ? null : motorFraction(this.hass, rpmEntity, maxRpm)) ??
      speedFraction(target) ??
      (typeof percentage === 'number' && Number.isFinite(percentage) ? percentage / 100 : null);
    const parts: string[] = [];
    const preset: unknown = fan?.attributes.preset_mode;
    const currentPreset = typeof preset === 'string' ? preset : undefined;
    if (typeof preset === 'string' && preset) parts.push(prettyLabel(preset));
    const targetPreset = speedPreset(fan, speed);
    const speedActive =
      target.kind === 'fan_percentage' ||
      targetPreset === null ||
      (typeof preset === 'string' && preset.toLowerCase() === targetPreset.toLowerCase());
    if (target.kind !== 'none' && target.value !== null && speedActive) {
      parts.push(formatSpeed(target, target.value, speed.display ?? 'percent'));
    }
    const rpm = readNumber(this.hass, rpmEntity);
    if (rpm !== null && rpm > 0) parts.push(`${Math.round(rpm).toLocaleString()} rpm`);
    const status = !available ? 'Unavailable' : !running ? 'Off' : parts.join(' · ') || 'On';
    const name = cfg.name ?? fan?.attributes.friendly_name ?? cfg.entity;
    const layout = this._layout();

    return html`
      <ha-card aria-label=${cfg.show_name === false ? name : nothing}>
        ${
          cfg.show_name === false
            ? nothing
            : html`<div class="header"><div class="name" title=${name}>${name}</div></div>`
        }
        <div class=${`body ${layout.wide ? 'wide' : 'stacked'}`}>
          <div class="dial-wrap" style=${styleMap(layout.dialStyle)}>
            <mp-purifier-dial
              .value=${display.value === null ? null : display.text}
              .density=${density}
              .unit=${metricLabel(this._metric)}
              .category=${
                display.level?.label ?? (reading.entity ? 'No reading' : 'No air quality sensor')
              }
              .color=${pm25Color(density) ?? 'var(--mp-outline)'}
              .running=${running}
              .available=${available}
              .speedFraction=${fraction}
              .status=${status}
              .allowCycle=${cfg.aqi?.allow_cycle === true}
              .disabled=${!available}
              .modeAvailable=${available && (fan?.attributes.preset_modes?.length ?? 0) >= 2}
              .modeIcon=${currentPreset ? presetIcon(currentPreset) : 'mdi:fan-auto'}
              .modeLabel=${`Mode: ${prettyLabel(currentPreset ?? 'none')}. Change mode`}
              @mode-cycle=${this._cycleMode}
              @metric-cycle=${this._cycleMetric}
              @power-toggle=${this._togglePower}
            ></mp-purifier-dial>
          </div>
          ${
            cfg.features?.length
              ? html`<div
                  class="features"
                  style=${styleMap({
                    ...layout.featureStyle,
                    gridTemplateColumns: `repeat(${layout.gridCols}, minmax(0, 1fr))`,
                  })}
                >
                  ${cfg.features.map(
                    (feature) =>
                      html`<mp-feature-row
                        .hass=${this.hass}
                        .entity=${cfg.entity}
                        .feature=${feature}
                        .cardConfig=${cfg}
                        .rpmEntity=${rpmEntity}
                        .parentOff=${!running}
                      ></mp-feature-row>`
                  )}
                </div>`
              : nothing
          }
        </div>
      </ha-card>
    `;
  }

  static styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      ha-card {
        padding: 16px;
        border-radius: var(--ha-card-border-radius, var(--mp-radius-card, var(--mp-shape-card)));
        overflow: visible;
      }
      .header {
        display: grid;
        align-items: center;
        min-height: 36px;
        min-width: 0;
      }
      .name {
        text-align: left;
        font-size: var(--md-sys-typescale-title-large-size, 20px);
        color: var(--mp-on-surface);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .body {
        display: flex;
        margin-top: 8px;
      }
      ha-card[aria-label] > .body {
        margin-top: 0;
      }
      .body.stacked {
        flex-direction: column;
        gap: 12px;
      }
      .body.wide {
        flex-direction: row;
        align-items: center;
        gap: 16px;
      }
      .dial-wrap {
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        min-width: 0;
      }
      mp-purifier-dial {
        width: 100%;
        max-width: ${DIAL_MAX_PX}px;
      }
      .features {
        box-sizing: border-box;
        display: grid;
        align-content: flex-start;
        gap: 12px;
        min-width: 0;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'material-purifier-card': MaterialPurifierCard;
  }
}

if (!customElements.get(CARD_NAME)) {
  customElements.define(CARD_NAME, MaterialPurifierCard);
}

console.info(
  `%c ${CARD_DISPLAY_NAME} %c v${CARD_VERSION} `,
  'color: white; background: #6750a4; font-weight: bold;',
  'color: #6750a4; background: #eaddff;'
);

const cardWindow = window as Window & { customCards?: Record<string, unknown>[] };
cardWindow.customCards = cardWindow.customCards ?? [];
cardWindow.customCards.push({
  type: CARD_NAME,
  name: CARD_DISPLAY_NAME,
  description: CARD_DESCRIPTION,
  preview: true,
  documentationURL: 'https://github.com/lageorgem/ha-material-purifier-card',
});
