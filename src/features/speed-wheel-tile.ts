import { LitElement, css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { MaterialPurifierCardConfig, SpeedWheelFeatureConfig } from '../types';
import {
  detentCount,
  detentIndex,
  formatSpeed,
  coverageRange,
  formatCoverage,
  resolveSpeedTarget,
  setSpeed,
  speedPreset,
  speedSource,
  type SpeedSource,
  type SpeedTarget,
} from '../speed';
import { autoRpmEntity, readNumber } from '../entities';
import {
  getCalibration,
  detentFromRpm,
  calibrationFromConfig,
  rpmAtDetent,
  airflowAt,
  type RpmCalibration,
  type CalibrationSource,
} from '../speed-calibration';
import { prettyLabel, tokens } from '../theme';
import { tileStyles } from './tile-styles';
import './speed-wheel';

/** HA-bound speed control; the drum remains a generic controlled input. */
export class MpSpeedWheelTile extends LitElement {
  static calibrationProvider = getCalibration;

  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ type: String }) entity = '';
  @property({ attribute: false }) config!: SpeedWheelFeatureConfig;
  @property({ attribute: false }) cardConfig?: MaterialPurifierCardConfig;
  @property({ type: String }) rpmEntity?: string;
  @state() private _optimistic: number | null = null;
  @state() private _optimisticMode: { active: boolean; preset: string | null } | null = null;
  @state() private _calibration: RpmCalibration | null = null;
  private _calibrationIdentity: string | null = null;
  private _calibrationRequested = false;
  private _calibrationNullAt: number | null = null;
  private _calibrationRevision = 0;
  private _manualSince: number | null = null;

  private _speedSource(): SpeedSource {
    const card = this.cardConfig ?? { type: 'custom:material-purifier-card', entity: this.entity };
    const source = { ...speedSource(card) };
    for (const key of ['entity', 'preset', 'display', 'estimate_auto', 'show_coverage'] as const) {
      const value = this.config[key];
      if (value !== undefined) Object.assign(source, { [key]: value });
    }
    return source;
  }

  private _activeCalibration(target: SpeedTarget): RpmCalibration | null {
    return calibrationFromConfig(this.cardConfig?.calibration, target) ?? this._calibration;
  }

  private _canEstimate(target: SpeedTarget): boolean {
    return (
      this._speedSource().estimate_auto !== false &&
      !this._disabled(target) &&
      this.hass.states[this.entity]?.state === 'on' &&
      !this._reportedActive() &&
      this._optimistic === null &&
      this._optimisticMode === null &&
      this._pointerStart === null &&
      !this._inFlight &&
      this._pending === null &&
      this._debounce === null
    );
  }

  private _calibrationSource(target: SpeedTarget): CalibrationSource | null {
    if ((target.kind !== 'number' && target.kind !== 'input_number') || !target.entity) return null;
    const rpmEntity = this.rpmEntity ?? autoRpmEntity(this.hass, this.entity);
    const preset = speedPreset(this.hass.states[this.entity], this._speedSource());
    return rpmEntity && preset
      ? {
          fanEntity: this.entity,
          speedEntity: target.entity,
          rpmEntity,
          speedPreset: preset,
          target,
        }
      : null;
  }

  private _syncCalibration(target: SpeedTarget, hassUpdated: boolean): void {
    const source = this._calibrationSource(target);
    const identity = source
      ? JSON.stringify([
          source.fanEntity,
          source.speedEntity,
          source.rpmEntity,
          source.speedPreset,
          target.kind,
          target.min,
          target.max,
          target.step,
        ])
      : null;
    if (identity !== this._calibrationIdentity) {
      this._calibrationRevision++;
      this._calibrationIdentity = identity;
      this._calibrationRequested = false;
      this._calibrationNullAt = null;
      this._calibration = null;
      this._manualSince = null;
    }
    let force = false;
    if (hassUpdated) {
      if (this._reportedActive()) {
        this._manualSince ??= Date.now();
      } else if (this._manualSince !== null) {
        force = Date.now() - this._manualSince >= 30000;
        this._manualSince = null;
        // A reported exit from Manual supersedes the wheel's saved-level optimism.
        this._revision++;
        this._pending = null;
        this._clearDebounce();
        this._clearOptimistic();
        this._optimismExpired = false;
      }
    }
    if (
      hassUpdated &&
      this._calibrationNullAt !== null &&
      Date.now() - this._calibrationNullAt >= 30 * 60 * 1000
    ) {
      this._calibrationRequested = false;
      this._calibrationNullAt = null;
    }
    if (
      !source ||
      !this.isConnected ||
      calibrationFromConfig(this.cardConfig?.calibration, target) !== null ||
      this._speedSource().estimate_auto === false ||
      (!force && (!this._canEstimate(target) || this._calibrationRequested))
    )
      return;
    this._calibrationRequested = true;
    const revision = this._calibrationRevision;
    void MpSpeedWheelTile.calibrationProvider(this.hass, source, { force }).then((calibration) => {
      if (!this.isConnected || revision !== this._calibrationRevision) return;
      this._calibration = calibration;
      this._calibrationNullAt = calibration === null ? Date.now() : null;
    });
  }

  private _estimatedValue(target: SpeedTarget): number | null {
    if (!this._canEstimate(target)) return null;
    if (target.kind === 'fan_percentage') {
      const percentage = this.hass.states[this.entity]?.attributes.percentage;
      return typeof percentage === 'number' && Number.isFinite(percentage) ? percentage : null;
    }
    const source = this._calibrationSource(target);
    const rpm = source ? readNumber(this.hass, source.rpmEntity) : null;
    const calibration = this._activeCalibration(target);
    if (!calibration || rpm === null) return null;
    const maxDetent = detentCount(target.min, target.max, target.step) - 1;
    const position = detentFromRpm(calibration, rpm, maxDetent);
    if (position === null || !Number.isFinite(position)) return null;
    const index = Math.max(0, Math.min(maxDetent, Math.round(position)));
    return index === maxDetent
      ? target.max
      : Number((target.min + index * target.step).toPrecision(15));
  }

  private _debounce: ReturnType<typeof setTimeout> | null = null;
  private _expiry: ReturnType<typeof setTimeout> | null = null;
  private _revision = 0;
  private _inFlight = false;
  private _pending: { value: number; revision: number; identity: string } | null = null;
  private _toggles: Array<{ identity: string; run: () => Promise<unknown> }> = [];
  private _lastTogglePreset: string | null = null;
  private _resolvedIdentity: string | null = null;
  private _optimismExpired = false;
  private _modeExpiry: ReturnType<typeof setTimeout> | null = null;
  private _pointerStart: { x: number; y: number } | null = null;
  private _dragged = false;

  private _reportedActive(): boolean {
    const fan = this.hass.states[this.entity];
    const preset = speedPreset(fan, this._speedSource());
    return (
      fan?.state === 'on' &&
      (preset === null || fan.attributes.preset_mode?.toLowerCase() === preset.toLowerCase())
    );
  }

  private _clearModeOptimistic(): void {
    if (this._modeExpiry !== null) clearTimeout(this._modeExpiry);
    this._modeExpiry = null;
    this._optimisticMode = null;
  }

  private _onPointerDown = (event: PointerEvent): void => {
    this._pointerStart = { x: event.clientX, y: event.clientY };
    this._dragged = false;
  };

  private _onPointerMove = (event: PointerEvent): void => {
    if (
      this._pointerStart &&
      Math.hypot(event.clientX - this._pointerStart.x, event.clientY - this._pointerStart.y) > 5
    )
      this._dragged = true;
  };

  private _onPointerUp = (event: PointerEvent): void => {
    this._onPointerMove(event);
    this._pointerStart = null;
    this.requestUpdate();
  };

  private _onPointerCancel = (): void => {
    this._pointerStart = null;
    this._dragged = true;
    this.requestUpdate();
  };

  private _onToggle = (event: MouseEvent): void => {
    if (
      event
        .composedPath()
        .some((node) => node instanceof Element && node.localName === 'mp-speed-wheel')
    )
      return;
    const keyboardButton =
      event.detail === 0 && event.composedPath().some((node) => node instanceof HTMLButtonElement);
    if (this._dragged && !keyboardButton) return;
    if (!this.isConnected) return;
    const target = this._target();
    this._syncTarget(target);
    if (this._disabled(target)) return;
    const fan = this.hass.states[this.entity];
    const manual = speedPreset(fan, this._speedSource());
    const active = this._optimisticMode?.active ?? this._reportedActive();
    const modes: string[] = fan.attributes.preset_modes ?? [];
    const preset =
      manual === null
        ? null
        : !active
          ? manual
          : (modes.find(
              (mode) => /auto/i.test(mode) && mode.toLowerCase() !== manual.toLowerCase()
            ) ??
            modes.find((mode) => mode.toLowerCase() !== manual.toLowerCase()) ??
            null);
    if (manual !== null && preset === null) return;
    this._revision++;
    this._pending = null;
    this._clearDebounce();
    this._clearOptimistic();
    this._optimismExpired = false;
    this._clearModeOptimistic();
    const optimism = { active: !active, preset };
    this._optimisticMode = optimism;
    this._modeExpiry = setTimeout(() => this._clearModeOptimistic(), 5000);
    const identity = this._identity(target);
    const hass = this.hass;
    const entity = this.entity;
    this._toggles.push({
      identity,
      run: async () => {
        try {
          await hass.callService('fan', manual === null ? 'toggle' : 'set_preset_mode', {
            entity_id: entity,
            ...(preset === null ? {} : { preset_mode: preset }),
          });
          if (this.isConnected && identity === this._resolvedIdentity)
            this._lastTogglePreset = preset;
        } catch (error: unknown) {
          console.warn('mp-speed-wheel-tile: failed to toggle Manual mode', error);
          if (this._optimisticMode === optimism && identity === this._resolvedIdentity)
            this._clearModeOptimistic();
        }
      },
    });
    this._drain();
  };

  private _drain(): void {
    if (this._inFlight) return;
    // Toggles are barriers: only wheel work created after the latest toggle survives.
    const toggle = this._toggles.shift();
    if (toggle) {
      void this._commitToggle(toggle);
      return;
    }
    const pending = this._pending;
    this._pending = null;
    if (pending) void this._commit(pending.value, pending.revision, pending.identity);
    if (!this._inFlight && this._optimismExpired) this._clearOptimistic();
  }

  private async _commitToggle(toggle: {
    identity: string;
    run: () => Promise<unknown>;
  }): Promise<void> {
    if (!this.isConnected) return;
    const target = this._target();
    this._syncTarget(target);
    if (toggle.identity !== this._identity(target) || this._disabled(target)) {
      this._drain();
      return;
    }
    this._inFlight = true;
    try {
      await toggle.run();
    } finally {
      this._inFlight = false;
      this._drain();
      this.requestUpdate();
    }
  }

  private _target(): SpeedTarget {
    return resolveSpeedTarget(this.hass, this.entity, this._speedSource());
  }

  private _disabled(target: SpeedTarget): boolean {
    const fan = this.hass.states[this.entity];
    return (
      target.kind === 'none' ||
      !target.available ||
      !fan ||
      ['unavailable', 'unknown'].includes(fan.state)
    );
  }

  private _identity(target: SpeedTarget): string {
    return JSON.stringify([this.entity, target.kind, target.entity]);
  }

  private _clearExpiry(): void {
    if (this._expiry !== null) clearTimeout(this._expiry);
    this._expiry = null;
  }

  private _clearDebounce(): void {
    if (this._debounce !== null) clearTimeout(this._debounce);
    this._debounce = null;
  }

  private _clearOptimistic(): void {
    this._clearExpiry();
    this._optimistic = null;
  }

  protected willUpdate(changed: PropertyValues): void {
    if (!this.hass || !this.config) return;
    const target = this._target();
    this._syncTarget(target);
    this._syncCalibration(target, changed.has('hass'));
  }

  private _syncTarget(target: SpeedTarget): void {
    const identity = this._identity(target);
    if (identity !== this._resolvedIdentity || this._disabled(target)) {
      this._revision++;
      this._pending = null;
      this._toggles = [];
      this._lastTogglePreset = null;
      this._clearDebounce();
      this._clearOptimistic();
      this._clearModeOptimistic();
      this._optimismExpired = false;
    } else if (this._optimistic !== null && target.value === this._optimistic) {
      this._clearOptimistic();
    }
    this._resolvedIdentity = identity;
    const mode = this._optimisticMode;
    const fan = this.hass.states[this.entity];
    if (
      mode &&
      (mode.preset === null
        ? this._reportedActive() === mode.active
        : fan?.attributes.preset_mode?.toLowerCase() === mode.preset.toLowerCase() &&
          (!mode.active || fan.state === 'on'))
    )
      this._clearModeOptimistic();
  }

  private _onChanging = (event: CustomEvent<{ value: number }>): void => {
    if (!this.isConnected) return;
    const target = this._target();
    this._syncTarget(target);
    if (this._disabled(target)) return;
    if (!Number.isFinite(event.detail.value)) return;
    this._revision++;
    this._pending = null;
    this._clearExpiry();
    this._clearDebounce();
    this._optimistic = event.detail.value;
    this._dragged = true;
    this._optimismExpired = false;
    // Bound optimism from the last interaction, including cancelled gestures.
    this._expiry = setTimeout(() => {
      this._expiry = null;
      this._optimismExpired = true;
      if (!this._inFlight) this._clearOptimistic();
    }, 5000);
  };

  private _onChanged = (event: CustomEvent<{ value: number }>): void => {
    this._onChanging(event);
    if (!this.isConnected || this._disabled(this._target())) return;
    const value = event.detail.value;
    if (!Number.isFinite(value)) return;
    const revision = this._revision;
    const identity = this._identity(this._target());
    this._debounce = setTimeout(() => {
      this._debounce = null;
      void this._commit(value, revision, identity);
    }, 600);
  };

  private async _commit(value: number, revision: number, identity: string): Promise<void> {
    if (!this.isConnected) return;
    const target = this._target();
    this._syncTarget(target);
    if (revision !== this._revision || identity !== this._identity(target)) return;
    if (this._inFlight) {
      this._pending = { value, revision, identity };
      return;
    }
    if (this._disabled(target)) {
      this._clearOptimistic();
      return;
    }
    this._inFlight = true;
    try {
      const hass = this.hass;
      const entity = this.entity;
      const config = this._speedSource();
      const fan = hass.states[entity];
      const manual = speedPreset(fan, config);
      // HA may still report Manual after our serialized Auto request succeeds.
      // Restore Manual explicitly rather than letting that stale report skip it.
      if (
        manual &&
        this._lastTogglePreset !== null &&
        this._lastTogglePreset !== manual &&
        fan?.state === 'on' &&
        fan.attributes.preset_mode === manual
      ) {
        await hass.callService('fan', 'set_preset_mode', {
          entity_id: entity,
          preset_mode: manual,
        });
      }
      this._lastTogglePreset = null;
      await setSpeed(hass, entity, target, value, config);
      // An older request must not clear a newer interaction or recreate timers
      // after the tile has been removed.
      if (
        !this.isConnected ||
        revision !== this._revision ||
        identity !== this._identity(this._target())
      )
        return;
      if (this._target().value === value) this._clearOptimistic();
    } catch (error) {
      console.warn('mp-speed-wheel-tile: failed to set fan speed', error);
      if (this.isConnected && revision === this._revision) this._clearOptimistic();
    } finally {
      this._inFlight = false;
      this._drain();
      this.requestUpdate();
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.requestUpdate();
  }

  disconnectedCallback(): void {
    this._calibrationRevision++;
    this._calibrationIdentity = null;
    this._calibrationRequested = false;
    this._calibrationNullAt = null;
    this._calibration = null;
    this._manualSince = null;
    this._revision++;
    this._pending = null;
    this._toggles = [];
    this._lastTogglePreset = null;
    this._clearDebounce();
    this._clearOptimistic();
    this._clearModeOptimistic();
    this._pointerStart = null;
    this._dragged = false;
    super.disconnectedCallback();
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this.entity || !this.config) return nothing;
    const target = this._target();
    const estimated = this._estimatedValue(target);
    const displayed = target.available ? (this._optimistic ?? estimated ?? target.value) : null;
    const title = this.config.label ?? 'Fan speed';
    const fan = this.hass.states[this.entity];
    const off = fan?.state === 'off' && this._optimistic === null;
    const modeFallback =
      fan?.state === 'on' &&
      target.available &&
      !(this._optimisticMode?.active ?? this._reportedActive()) &&
      this._optimistic === null &&
      estimated === null;
    const preset = prettyLabel(this._optimisticMode?.preset ?? fan?.attributes.preset_mode ?? '');
    const valueText = off
      ? 'Off'
      : modeFallback
        ? preset
        : formatSpeed(target, displayed, this._speedSource().display ?? 'percent');
    const rpm = modeFallback
      ? readNumber(this.hass, this.rpmEntity ?? autoRpmEntity(this.hass, this.entity))
      : null;
    const calibration = this._activeCalibration(target);
    const detent = detentIndex(target, displayed);
    const airflow =
      displayed === null || !this.cardConfig
        ? null
        : target.kind === 'fan_percentage'
          ? this.cardConfig.cadr === undefined
            ? null
            : (this.cardConfig.cadr * displayed) / 100
          : calibration && detent !== null
            ? airflowAt(this.cardConfig, rpmAtDetent(calibration, detent))
            : null;
    const coverage =
      off || modeFallback || this._speedSource().show_coverage === false
        ? null
        : formatCoverage(coverageRange(airflow));
    const noControl = target.kind === 'none';
    return html`
      <div
        class=${classMap({ tile: true, on: this._optimisticMode?.active ?? this._reportedActive() })}
        style=${`--mp-tile-accent: ${this.config.color ?? 'var(--mp-primary)'}`}
        @click=${this._onToggle}
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._onPointerUp}
        @pointercancel=${this._onPointerCancel}
      >
        <button
          class="ic"
          type="button"
          aria-label="Manual mode"
          aria-pressed=${String(this._optimisticMode?.active ?? this._reportedActive())}
          ?disabled=${this._disabled(target)}
        >
          <ha-icon icon=${this.config.icon ?? 'mdi:fan'}></ha-icon>
        </button>
        <div class="text">
          <div class="title">${title}</div>
          <div
            class=${classMap({
              value: true,
              percent:
                !noControl && !off && !modeFallback && this._speedSource().display !== 'level',
            })}
          >
            ${noControl ? 'No speed control' : valueText}
          </div>
          ${coverage ? html`<div class="secondary coverage">${coverage}</div>` : nothing}
          ${
            rpm !== null && rpm > 0
              ? html`<div class="secondary">${Math.round(rpm).toLocaleString()} rpm</div>`
              : nothing
          }
          ${noControl ? html`<div class="secondary">Add a speed entity</div>` : nothing}
          ${
            !noControl && !target.available
              ? html`<div class="secondary">Speed control unavailable</div>`
              : nothing
          }
        </div>
        <mp-speed-wheel
          .min=${target.min}
          .max=${target.max}
          .step=${target.step}
          .value=${displayed}
          .disabled=${this._disabled(target)}
          .label=${title}
          .valueText=${
            modeFallback
              ? `${preset} mode`
              : `${estimated !== null ? 'Current speed ' : ''}${valueText}${coverage ? ', ' + coverage : ''}`
          }
          @value-changing=${this._onChanging}
          @value-changed=${this._onChanged}
        ></mp-speed-wheel>
      </div>
    `;
  }

  static styles = [
    tokens,
    tileStyles,
    css`
      :host {
        display: block;
        min-width: 0;
        height: 100%;
        container-type: inline-size;
        overflow: visible;
      }
      .tile {
        --mp-wheel-fade: var(--mp-surface-container);
        --mp-tile-radius: var(--mp-shape-chip-square);
        --mp-corner-base: 12px;
        --mp-edge-inline: 16px;
        --mp-corner-optical: 2px;
        --mp-gap-compact: 4px;
        --mp-edge-compact: 8px;
        --mp-wheel-block-inset: 4px;
        /* Equal clearance from the corner arc, not just the straight edges. */
        --mp-corner-inset: max(
          var(--mp-corner-base),
          calc(var(--mp-tile-radius) - (var(--mp-tile-radius) - var(--mp-corner-base)) * 0.7071)
        );
        --mp-corner-inline: max(
          var(--mp-edge-inline),
          calc(var(--mp-corner-inset) + var(--mp-corner-optical))
        );
        display: grid;
        grid-template-columns: minmax(0, 1fr) 56px;
        grid-template-rows: auto auto;
        gap: 8px 12px;
        align-items: start;
        min-height: 136px;
        height: 100%;
        padding: 0 var(--mp-edge-inline) 0 0;
        cursor: default;
        overflow: visible;
      }
      .tile.on {
        --mp-wheel-fade: color-mix(
          in srgb,
          var(--mp-tile-accent, var(--mp-primary)) 16%,
          var(--mp-surface-container)
        );
        --mp-tile-radius: var(--mp-shape-card);
      }
      .tile:hover {
        --mp-wheel-fade: color-mix(in srgb, var(--mp-on-surface) 6%, var(--mp-surface-container));
      }
      .tile:active {
        --mp-wheel-fade: color-mix(in srgb, var(--mp-on-surface) 12%, var(--mp-surface-container));
      }
      .tile.on:hover {
        --mp-wheel-fade: color-mix(
          in srgb,
          var(--mp-tile-accent, var(--mp-primary)) 22%,
          var(--mp-surface-container)
        );
      }
      @media (prefers-reduced-motion: reduce) {
        .tile {
          transition: none;
        }
      }
      .tile,
      .tile.on {
        border-radius: var(--mp-tile-radius);
      }
      .ic {
        border: none;
        padding: 0;
        font: inherit;
        cursor: pointer;
        grid-column: 1;
        grid-row: 1;
        margin-top: var(--mp-corner-inset);
        margin-left: var(--mp-corner-inline);
      }
      .ic:focus-visible {
        outline: 2px solid var(--mp-tile-accent, var(--mp-primary));
        outline-offset: 2px;
      }
      .ic:disabled {
        cursor: default;
      }
      .text {
        grid-column: 1;
        grid-row: 2;
        align-self: end;
        padding-left: var(--mp-corner-inline);
        padding-bottom: var(--mp-corner-inset);
        /* The explicit grid track supplies width despite inline-size containment. */
        container-type: inline-size;
      }
      .tile .title {
        font-size: var(--md-sys-typescale-label-medium-size, 12px);
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        white-space: normal;
        overflow-wrap: anywhere;
        text-overflow: clip;
      }
      .tile .value {
        font-size: clamp(
          var(--md-sys-typescale-body-large-size, 16px),
          22cqi,
          var(--md-sys-typescale-title-large-size, 22px)
        );
        /* Raw levels and setup guidance can wrap; percentages stay on one line. */
        white-space: normal;
        overflow-wrap: anywhere;
        text-overflow: clip;
      }
      @container (width < 160px) {
        .tile {
          column-gap: var(--mp-edge-compact);
        }
      }
      @container (width < 150px) {
        .tile {
          /* Recover track width without sacrificing corner clearance or the drum. */
          padding-right: var(--mp-edge-compact);
          column-gap: var(--mp-gap-compact);
        }
        .tile .title {
          display: none;
        }
      }
      .tile .value:not(:empty) {
        line-height: 1.2;
      }
      .coverage {
        white-space: nowrap;
      }
      .tile .value.percent {
        white-space: nowrap;
        overflow-wrap: normal;
      }
      .secondary {
        font-size: var(--md-sys-typescale-body-small-size, 12px);
        line-height: 1.2;
        color: var(--mp-on-surface-variant);
      }
      mp-speed-wheel {
        overflow: visible;
        grid-column: 2;
        grid-row: 1 / 3;
        width: 56px;
        height: calc(100% - 2 * var(--mp-wheel-block-inset));
        margin-block: var(--mp-wheel-block-inset);
        min-height: 112px;
        align-self: stretch;
      }
    `,
  ];
}

if (!customElements.get('mp-speed-wheel-tile')) {
  customElements.define('mp-speed-wheel-tile', MpSpeedWheelTile);
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-speed-wheel-tile': MpSpeedWheelTile;
  }
}
