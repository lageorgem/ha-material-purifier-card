import { LitElement, css, html, nothing, svg, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { DustLevel, FilterVacuumFeatureConfig, MaterialPurifierCardConfig } from '../types';
import {
  runtimeRatePerHour,
  etaDays,
  fetchHourlyChanges,
  formatEta,
  resolveDustLevel,
  thresholdFor,
  vacuumProgress,
  volumeFromRuntime,
} from '../calc/vacuum';
import { resolveMaxRpm } from '../speed-calibration';
import { tokens } from '../theme';
import { tileStyles } from './tile-styles';

const FETCH_INTERVAL = 60 * 60 * 1000;
const CONFIRM_DURATION = 10000;

/** Reads and resets HA's rpm-hours counter since the last vacuum. */
export class MpFilterVacuum extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) config!: FilterVacuumFeatureConfig;
  @property({ attribute: false }) rpmEntity?: string;
  @property({ attribute: false }) cardConfig?: MaterialPurifierCardConfig;

  @state() private _changes: { start: number; change: number }[] = [];
  @state() private _asking = false;
  @state() private _pending = false;
  @state() private _error = '';
  private _timer?: ReturnType<typeof setTimeout>;
  private _lastFetch = -Infinity;
  private _source = '';
  private _generation = 0;

  connectedCallback(): void {
    super.connectedCallback();
    this.requestUpdate();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._generation++;
    this._lastFetch = -Infinity;
    this._clearConfirmation();
  }

  protected updated(): void {
    if (!this.isConnected || !this.hass || !this.config) return;
    const entity = this.config.counter_entity;
    const source = entity ?? '';
    if (source !== this._source) {
      this._source = source;
      this._generation++;
      this._lastFetch = -Infinity;
      this._changes = [];
    }
    if (
      !entity ||
      runtimeRatePerHour([], Date.now(), this._numericState(entity), this._lastReset) !== null ||
      Date.now() - this._lastFetch <= FETCH_INTERVAL
    )
      return;
    this._lastFetch = Date.now();
    const generation = ++this._generation;
    void fetchHourlyChanges(this.hass, entity).then((changes) => {
      if (this.isConnected && generation === this._generation) this._changes = changes;
    });
  }

  private get _level(): DustLevel {
    if (this.config.dust_level) return resolveDustLevel(this.config.dust_level);
    const entity = this.config.dust_level_entity;
    return resolveDustLevel(entity ? this.hass?.states[entity]?.state : undefined, 'medium');
  }

  private get _lastReset(): number | null {
    const entity = this.config.counter_entity;
    const reset = entity ? this.hass?.states[entity]?.attributes.last_reset : undefined;
    if (typeof reset !== 'string') return null;
    const timestamp = Date.parse(reset);
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  private _numericState(entity?: string): number | null {
    const state = entity ? this.hass?.states[entity]?.state : undefined;
    if (!state?.trim()) return null;
    const value = Number(state);
    return Number.isFinite(value) ? value : null;
  }

  private _moreInfo = (): void => {
    if (this._asking || !this.config.counter_entity) return;
    this.dispatchEvent(
      new CustomEvent('hass-more-info', {
        detail: { entityId: this.config.counter_entity },
        bubbles: true,
        composed: true,
      })
    );
  };

  private _clearConfirmation(): void {
    if (this._timer !== undefined) clearTimeout(this._timer);
    this._timer = undefined;
    this._asking = false;
  }

  private async _focusControl(selector: string): Promise<void> {
    await this.updateComplete;
    if (this.isConnected) this.shadowRoot?.querySelector<HTMLButtonElement>(selector)?.focus();
  }

  private _restartTimer = (): void => {
    if (!this._asking) return;
    if (this._timer !== undefined) clearTimeout(this._timer);
    this._timer = setTimeout(this._cancel, CONFIRM_DURATION);
  };

  private _ask = (event: Event): void => {
    event.stopPropagation();
    if (
      !this.config.counter_entity ||
      !this.hass ||
      this._pending ||
      this._numericState(this.config.counter_entity) === null
    )
      return;
    this._asking = true;
    this._restartTimer();
    void this._focusControl('.confirm');
  };

  private _cancel = (event?: Event): void => {
    event?.stopPropagation();
    this._clearConfirmation();
    void this._focusControl('.reset');
  };

  private _keydown = (event: KeyboardEvent): void => {
    if (!this._asking) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this._cancel(event);
    } else {
      this._restartTimer();
    }
  };

  private _markVacuumed = async (event: Event): Promise<void> => {
    event.stopPropagation();
    const entity = this.config.counter_entity;
    const counter = this._numericState(entity);
    if (!entity || counter === null || !this.hass || this._pending || !this._asking) return;
    this._clearConfirmation();
    await this._service('utility_meter', 'reset', { entity_id: entity });
    void this._focusControl('.reset');
  };

  private async _service(
    domain: string,
    service: string,
    data: Record<string, unknown>
  ): Promise<void> {
    this._pending = true;
    this._error = '';
    try {
      await this.hass.callService(domain, service, data);
    } catch {
      this._error = 'Unable to update. Try again.';
    } finally {
      this._pending = false;
    }
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.config) return nothing;
    const counter = this._numericState(this.config.counter_entity);
    const cadr = this.cardConfig?.cadr ?? null;
    const maxRpm = this.cardConfig ? resolveMaxRpm(this.cardConfig) : null;
    const volume = volumeFromRuntime(counter, cadr, maxRpm);
    const known = volume !== null;
    const threshold = thresholdFor(this._level, this.config.thresholds);
    const progress = vacuumProgress(volume ?? 0, threshold);
    const due = known && progress.due;
    const rate = runtimeRatePerHour(this._changes, Date.now(), counter, this._lastReset);
    const daily = volumeFromRuntime(rate === null ? null : rate * 24, cadr, maxRpm);
    const eta = !this.config.counter_entity
      ? 'Set up tracking in the editor'
      : cadr === null || !Number.isFinite(cadr) || cadr <= 0
        ? 'Add CADR in card settings'
        : maxRpm === null
          ? 'Calibrate fan speed in card settings'
          : known
            ? due
              ? 'Due now'
              : formatEta(etaDays(progress.remainingM3, daily))
            : 'Tracking unavailable';
    const label = this.config.label ?? 'Vacuum filter';
    const confirm = this._asking;
    const accent = due ? 'var(--mp-error)' : (this.config.color ?? 'var(--mp-primary)');

    return html`
      <div
        class="tile ${due ? 'on due' : ''} ${confirm ? 'asking' : ''}"
        style=${`--mp-tile-accent: ${accent}`}
        @keydown=${this._keydown}
      >
        <button
          class="more-info"
          aria-label=${`${label}: ${eta}. Show counter details`}
          ?disabled=${confirm || !this.config.counter_entity}
          @click=${this._moreInfo}
        ></button>
        <div class="top">
          <div class="ic ring">
            ${svg`
              <svg viewBox="0 0 44 44" aria-hidden="true">
                <circle class="track" cx="22" cy="22" r="20" fill="none" stroke-width="4" />
                <circle class="arc" cx="22" cy="22" r="20" fill="none" stroke-width="4"
                  pathLength="1" stroke-dasharray="${progress.fraction} 1"
                  stroke-linecap="round" opacity="${known && progress.fraction > 0 ? 1 : 0}"
                  transform="rotate(-90 22 22)" />
              </svg>
            `}
            <ha-icon icon=${this.config.icon ?? 'mdi:vacuum'}></ha-icon>
            ${due ? html`<span class="dot badge" aria-hidden="true"></span>` : nothing}
          </div>
          ${
            this.config.counter_entity && !confirm
              ? html`
                  <button
                    class="reset"
                    aria-label="Mark filter as vacuumed"
                    title="Mark vacuumed"
                    ?disabled=${this._pending || counter === null}
                    @click=${this._ask}
                  >
                    <ha-icon icon="mdi:check"></ha-icon>
                  </button>
                `
              : nothing
          }
        </div>
        <div class="text">
          <div class="title" id="vacuum-title">
            ${confirm ? 'Did you vacuum the filter?' : label}
          </div>
          ${
            confirm
              ? html`
                  <div
                    class="actions"
                    role="group"
                    aria-labelledby="vacuum-title"
                    @focusin=${this._restartTimer}
                    @pointerdown=${this._restartTimer}
                  >
                    <button
                      class="segment confirm"
                      aria-label="Yes, I vacuumed the filter"
                      ?disabled=${this._pending || counter === null}
                      @click=${this._markVacuumed}
                    >
                      <ha-icon icon="mdi:check"></ha-icon>
                    </button>
                    <button class="segment cancel" aria-label="Cancel" @click=${this._cancel}>
                      <ha-icon icon="mdi:close"></ha-icon>
                    </button>
                  </div>
                `
              : html` <div class="value">${eta}</div> `
          }
        </div>
        ${this._error ? html`<div class="error" role="alert">${this._error}</div>` : nothing}
      </div>
    `;
  }

  static styles = [
    tokens,
    tileStyles,
    css`
      :host {
        --mp-vacuum-connected-gap: 2px;
        --mp-vacuum-connected-radius: var(--md-sys-shape-corner-extra-small, 4px);
        --mp-vacuum-action-height: 40px;
        --mp-vacuum-action-min-width: 48px;
        --mp-vacuum-question-gap: 8px;
        display: block;
        min-width: 0;
        height: 100%;
        container-type: inline-size;
        container-name: filter-vacuum;
      }
      .tile {
        position: relative;
        min-height: 136px;
        height: 100%;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: 44px auto;
        gap: 0;
        align-items: start;
      }
      .more-info {
        position: absolute;
        inset: 0;
        border: 0;
        background: transparent;
        border-radius: inherit;
        cursor: pointer;
      }
      .top {
        position: relative;
        min-width: 0;
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr);
        align-items: start;
      }
      .tile .text {
        align-self: end;
        container-type: inline-size;
        pointer-events: none;
      }
      .tile .ring {
        position: relative;
        width: 44px;
        height: 44px;
        pointer-events: none;
        background: transparent;
        color: var(--mp-tile-accent);
      }
      .tile .ring ha-icon {
        --mdc-icon-size: 20px;
      }
      .ring svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }
      .track {
        stroke: var(--mp-surface-container-highest);
      }
      .arc {
        stroke: var(--mp-tile-accent);
      }
      .badge {
        position: absolute;
        right: 0;
        top: 0;
        background: var(--mp-error);
      }
      .tile .value {
        font-size: clamp(14px, 13cqi, var(--md-sys-typescale-title-medium-size, 16px));
        white-space: normal;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }
      .due .value,
      .error {
        color: var(--mp-error);
      }
      .reset {
        position: relative;
        border: 0;
        border-radius: var(--mp-shape-full);
        font: inherit;
      }
      .reset {
        position: absolute;
        top: 0;
        right: 0;
        width: 40px;
        height: 40px;
        display: grid;
        place-items: center;
        background: var(--mp-secondary-container);
        color: var(--mp-on-secondary-container);
        cursor: pointer;
      }
      .reset::after {
        content: '';
        position: absolute;
        inset: -2px;
      }
      .reset ha-icon {
        --mdc-icon-size: 22px;
      }
      .asking .title {
        font-size: var(--md-sys-typescale-label-large-size, 14px);
        line-height: var(--md-sys-typescale-label-large-line-height, 20px);
        font-weight: var(--md-sys-typescale-label-large-weight, 500);
        white-space: normal;
        overflow: visible;
        text-overflow: clip;
      }
      .tile.asking {
        grid-template-rows: minmax(0, 1fr);
        overflow: hidden;
      }
      .asking .top {
        display: none;
      }
      .tile.asking .text {
        align-self: stretch;
        min-height: 0;
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto;
        gap: var(--mp-vacuum-question-gap);
      }
      .asking .title {
        align-self: start;
      }
      .asking .actions {
        margin-top: 0;
      }
      .actions {
        position: relative;
        display: grid;
        grid-template-columns: repeat(2, minmax(var(--mp-vacuum-action-min-width), 1fr));
        gap: var(--mp-vacuum-connected-gap);
        margin-top: var(--mp-vacuum-question-gap);
        pointer-events: auto;
      }
      .segment {
        height: var(--mp-vacuum-action-height);
        border: 0;
        padding: 0;
        display: grid;
        place-items: center;
        cursor: pointer;
        background: var(--mp-surface-container-highest);
        color: var(--mp-on-surface);
        border-radius: var(--mp-vacuum-connected-radius) var(--mp-shape-full) var(--mp-shape-full)
          var(--mp-vacuum-connected-radius);
      }
      .segment.confirm {
        background: var(--mp-primary);
        color: var(--mp-on-primary);
        border-radius: var(--mp-shape-full) var(--mp-vacuum-connected-radius)
          var(--mp-vacuum-connected-radius) var(--mp-shape-full);
      }
      .segment ha-icon {
        --mdc-icon-size: 22px;
      }
      button:focus-visible {
        outline: 2px solid var(--mp-primary);
        outline-offset: 2px;
      }
      .reset:hover,
      .segment:hover {
        filter: brightness(0.95);
      }
      .reset:active,
      .segment:active {
        filter: brightness(0.9);
      }
      button:disabled {
        opacity: 0.5;
        cursor: wait;
      }
      .error {
        pointer-events: none;
        position: relative;
        font-size: var(--md-sys-typescale-label-medium-size, 13px);
        overflow-wrap: anywhere;
      }
      @media (prefers-reduced-motion: reduce) {
        .tile,
        .tile .ic {
          transition: none;
        }
      }
    `,
  ];
}

if (!customElements.get('mp-filter-vacuum'))
  customElements.define('mp-filter-vacuum', MpFilterVacuum);

declare global {
  interface HTMLElementTagNameMap {
    'mp-filter-vacuum': MpFilterVacuum;
  }
}
