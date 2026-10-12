import { LitElement, css, html, svg, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { tokens } from '../theme';
import { ParticleField } from './particles';

try {
  CSS.registerProperty?.({
    name: '--mp-aqi-color',
    syntax: '<color>',
    inherits: true,
    initialValue: '#34a853',
  });
} catch {
  // Duplicate registration or unsupported browser: color changes still work without interpolation.
}

/** Controlled AQI readout. Particle animation never updates Lit state. */
export class MpPurifierDial extends LitElement {
  @property({ type: String }) value: string | null = null;
  @property({ type: String }) unit = 'AQI';
  @property({ type: String }) category = '';
  @property({ type: String }) color = '#34a853';
  @property({ type: Boolean }) running = false;
  @property({ type: Boolean }) available = true;
  @property({ type: Number }) speedFraction: number | null = null;
  @property({ type: Number }) density: number | null = null;
  @property({ type: String }) status = '';
  @property({ type: Boolean }) allowCycle = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) modeIcon = 'mdi:fan-auto';
  @property({ type: String }) modeLabel = 'Change mode';
  @property({ type: Boolean }) modeAvailable = false;

  private _field?: ParticleField;
  private _resizeObserver?: ResizeObserver;
  private _colorTimeout?: ReturnType<typeof setTimeout>;
  private _motionQuery?: MediaQueryList;
  private _removeMotionListener?: () => void;
  private _removeDprListener?: () => void;
  private _cssSize = 0;

  private get _active(): boolean {
    return this.running && this.available;
  }

  private readonly _reducedMotion = (): boolean => this._motionQuery?.matches ?? false;

  private readonly _motionChanged = (): void => {
    this._field?.refreshMotion();
  };

  private readonly _dprChanged = (): void => {
    this._field?.resize(this._cssSize);
    this._watchDpr();
  };

  private _watchDpr(): void {
    this._removeDprListener?.();
    this._removeDprListener = undefined;
    if (!this.isConnected || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    if (
      typeof query.addEventListener === 'function' &&
      typeof query.removeEventListener === 'function'
    ) {
      query.addEventListener('change', this._dprChanged);
      this._removeDprListener = () => query.removeEventListener('change', this._dprChanged);
    } else if (
      typeof query.addListener === 'function' &&
      typeof query.removeListener === 'function'
    ) {
      query.addListener(this._dprChanged);
      this._removeDprListener = () => query.removeListener(this._dprChanged);
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (typeof window.matchMedia === 'function') {
      const query = window.matchMedia('(prefers-reduced-motion: reduce)');
      this._motionQuery = query;
      if (
        typeof query.addEventListener === 'function' &&
        typeof query.removeEventListener === 'function'
      ) {
        query.addEventListener('change', this._motionChanged);
        this._removeMotionListener = () => query.removeEventListener('change', this._motionChanged);
      } else if (
        typeof query.addListener === 'function' &&
        typeof query.removeListener === 'function'
      ) {
        query.addListener(this._motionChanged);
        this._removeMotionListener = () => query.removeListener(this._motionChanged);
      }
    }
    if (this.hasUpdated) {
      void this.updateComplete.then(() => {
        if (this.isConnected) {
          this._createField();
        }
      });
    }
  }

  disconnectedCallback(): void {
    clearTimeout(this._colorTimeout);
    this._colorTimeout = undefined;
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
    this._field?.dispose();
    this._field = undefined;
    this._removeMotionListener?.();
    this._removeMotionListener = undefined;
    this._motionQuery = undefined;
    this._removeDprListener?.();
    this._removeDprListener = undefined;
    super.disconnectedCallback();
  }

  protected firstUpdated(): void {
    if (this.isConnected) this._createField();
  }

  protected updated(changed: PropertyValues<this>): void {
    if (!this.isConnected) return;
    if (changed.has('running') || changed.has('available') || changed.has('speedFraction')) {
      this._syncSpeed();
    }
    if (changed.has('density') || changed.has('available')) {
      this._field?.setDensity(this.available ? this.density : null);
    }
    if (changed.has('color') || changed.has('running') || changed.has('available')) {
      this._syncColor();
      this._scheduleColorSync();
    }
  }

  private _createField(): void {
    if (this._field) return;
    const canvas = this.renderRoot.querySelector('canvas');
    const dial = this.renderRoot.querySelector<HTMLElement>('.dial');
    if (!canvas || !dial) return;
    this._field = new ParticleField(canvas, { reducedMotion: this._reducedMotion });
    this._cssSize = dial.getBoundingClientRect().width;
    this._field.resize(this._cssSize);
    this._watchDpr();
    if (typeof ResizeObserver === 'function') {
      this._resizeObserver = new ResizeObserver((entries) => {
        const entry = entries.find((entry) => entry.target === dial);
        if (entry) {
          this._cssSize = entry.contentRect.width;
          this._field?.resize(this._cssSize);
        }
      });
      this._resizeObserver.observe(dial);
    }
    this._syncColor();
    this._scheduleColorSync();
    this._field.setDensity(this.available ? this.density : null);
    this._syncSpeed();
    this._field.observe(this);
  }

  private _syncSpeed(): void {
    this._field?.setSpeed(this._active ? (this.speedFraction ?? 0.35) : null);
  }

  private _syncColor(): void {
    const dial = this.renderRoot.querySelector<HTMLElement>('.dial');
    if (!dial || !this._field) return;
    const color = getComputedStyle(dial).getPropertyValue('--mp-aqi-color').trim();
    // Unregistered custom properties can remain unresolved on older browsers.
    if (color && !color.includes('var(')) {
      this._field.setColor(color);
    } else {
      const halo = this.renderRoot.querySelector<SVGElement>('.halo');
      if (halo) this._field.setColor(getComputedStyle(halo).color);
    }
  }

  private _scheduleColorSync(): void {
    clearTimeout(this._colorTimeout);
    this._colorTimeout = setTimeout(() => {
      this._colorTimeout = undefined;
      if (this.isConnected) this._syncColor();
    }, 600);
  }

  private _colorTransitionEnded(event: TransitionEvent): void {
    if (event.propertyName !== '--mp-aqi-color' || event.target !== event.currentTarget) return;
    clearTimeout(this._colorTimeout);
    this._colorTimeout = undefined;
    this._syncColor();
  }

  private _cycle(): void {
    if (this.allowCycle) {
      this.dispatchEvent(
        new CustomEvent('metric-cycle', { bubbles: true, composed: true, detail: {} })
      );
    }
  }

  private _chipKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      // Prevent the native synthetic click so each physical activation emits exactly once.
      event.preventDefault();
      if (!event.repeat) this._cycle();
    }
  }

  private _toggle(): void {
    if (!this.disabled) {
      this.dispatchEvent(
        new CustomEvent('power-toggle', { bubbles: true, composed: true, detail: {} })
      );
    }
  }

  private _cycleMode(): void {
    if (this.modeAvailable && this.available && !this.disabled) {
      this.dispatchEvent(
        new CustomEvent('mode-cycle', { bubbles: true, composed: true, detail: {} })
      );
    }
  }

  protected render() {
    return html`
      <div
        class="dial ${this._active ? 'active' : 'neutral'}"
        style=${styleMap({ '--mp-aqi-color': this._active ? this.color : 'var(--mp-outline)' })}
        @transitionend=${this._colorTransitionEnded}
      >
        ${svg`
          <svg viewBox="0 0 320 320" aria-hidden="true" focusable="false">
            <defs>
              <radialGradient id="aqi-halo">
                <stop offset="0%" stop-opacity=".30"></stop>
                <stop offset="35%" stop-opacity=".24"></stop>
                <stop offset="55%" stop-opacity=".15"></stop>
                <stop offset="75%" stop-opacity=".06"></stop>
                <stop offset="90%" stop-opacity=".015"></stop>
                <stop offset="100%" stop-opacity="0"></stop>
              </radialGradient>
            </defs>
            <circle class="halo" cx="160" cy="160" r="134" fill="url(#aqi-halo)"></circle>
          </svg>
        `}
        <canvas aria-hidden="true"></canvas>
        <div class="overlay">
          <div class="category" title=${this.category}>${this.category}</div>
          <div class="value" title=${this.value ?? '—'}>${this.value ?? '—'}</div>
          ${
            this.allowCycle
              ? html`<button
                    class="unit"
                    type="button"
                    aria-describedby="metric-cycle-description"
                    @click=${this._cycle}
                    @keydown=${this._chipKeydown}
                  >
                    ${this.unit}
                  </button>
                  <span id="metric-cycle-description" class="visually-hidden"
                    >Tap to change air quality metric</span
                  >`
              : html`<span class="unit">${this.unit}</span>`
          }
          <div class="status" title=${this.available ? this.status : 'Unavailable'}>
            ${this.available ? this.status : 'Unavailable'}
          </div>
        </div>
        <button
          class="power ${this._active ? 'filled' : ''}"
          type="button"
          aria-label=${this.running ? 'Turn off' : 'Turn on'}
          aria-pressed=${String(this.running)}
          ?disabled=${this.disabled}
          @click=${this._toggle}
        >
          <ha-icon icon="mdi:power" aria-hidden="true"></ha-icon>
        </button>
        ${
          this.modeAvailable
            ? html`<button
                class="mode"
                type="button"
                aria-label=${this.modeLabel}
                ?disabled=${!this.available || this.disabled}
                @click=${this._cycleMode}
              >
                <ha-icon icon=${this.modeIcon} aria-hidden="true"></ha-icon>
              </button>`
            : ''
        }
      </div>
    `;
  }

  static styles = [
    tokens,
    css`
      :host {
        display: block;
        width: 100%;
        --mp-dial-max-size: 320px;
        --mp-dial-chip-height: 32px;
        --mp-dial-power-size: clamp(40px, 15cqi, 48px);
        --mp-dial-control-inset: 0;
        --mp-dial-stack-gap: clamp(4px, 2.5cqi, 8px);
        --mp-dial-value-half-height: 11cqi;
        --mp-dial-focus-width: 2px;
        --mp-dial-color-duration: 600ms;
        --mp-dial-color-ease: cubic-bezier(0.2, 0, 0, 1);
        --mp-dial-press-duration: 200ms;
        --mp-dial-press-ease: cubic-bezier(0.2, 0.8, 0.2, 1.2);
        font-family: var(--md-sys-typescale-body-medium-font, inherit);
      }
      .dial {
        position: relative;
        width: 100%;
        max-width: var(--mp-dial-max-size);
        aspect-ratio: 1;
        margin: auto;
        container-type: inline-size;
        transition: --mp-aqi-color var(--mp-dial-color-duration) var(--mp-dial-color-ease);
      }
      svg,
      canvas {
        position: absolute;
        inset: 0;
        display: block;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
      stop {
        stop-color: var(--mp-aqi-color);
      }
      .halo {
        color: var(--mp-aqi-color);
      }
      .overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        color: var(--mp-on-surface-variant);
      }
      .category,
      .status,
      .value,
      .unit {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        max-width: 72%;
        box-sizing: border-box;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        text-align: center;
        flex-shrink: 0;
      }
      .category {
        bottom: calc(50% + var(--mp-dial-value-half-height) + var(--mp-dial-stack-gap));
        font-size: clamp(11px, 4.375cqi, var(--md-sys-typescale-label-large-size, 14px));
        font-weight: var(--md-sys-typescale-label-large-weight, 500);
        line-height: 1.2;
      }
      .value {
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 22cqi;
        font-weight: 400;
        line-height: 1;
        font-variant-numeric: tabular-nums;
        color: var(--mp-on-surface);
      }
      .neutral .value {
        color: var(--mp-on-surface-variant);
      }
      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
      .status {
        top: calc(
          50% + var(--mp-dial-value-half-height) + var(--mp-dial-chip-height) + 2 *
            var(--mp-dial-stack-gap)
        );
        font-size: clamp(11px, 4.375cqi, var(--md-sys-typescale-body-medium-size, 14px));
        font-weight: var(--md-sys-typescale-body-medium-weight, 400);
        line-height: 1.2;
      }
      button {
        position: relative;
        border: none;
        font-family: inherit;
        cursor: pointer;
        pointer-events: auto;
        -webkit-tap-highlight-color: transparent;
      }
      .unit {
        top: calc(50% + var(--mp-dial-value-half-height) + var(--mp-dial-stack-gap));
        display: inline-block;
        height: var(--mp-dial-chip-height);
        line-height: var(--mp-dial-chip-height);
        padding: 0 var(--mp-shape-chip-square);
        border-radius: var(--mp-shape-full);
        background: color-mix(
          in srgb,
          var(--mp-aqi-color) 24%,
          var(--mp-surface-container-highest)
        );
        color: var(--mp-on-surface);
        font-size: clamp(11px, 3.75cqi, var(--md-sys-typescale-label-medium-size, 12px));
        font-weight: var(--md-sys-typescale-label-medium-weight, 500);
      }
      .power,
      .mode {
        position: absolute;
        bottom: var(--mp-dial-control-inset);
        display: grid;
        place-items: center;
        padding: 0;
        width: var(--mp-dial-power-size);
        height: var(--mp-dial-power-size);
        flex-shrink: 0;
        border-radius: 50%;
        background: var(--mp-surface-container-highest);
        color: var(--mp-on-surface-variant);
        transition: border-radius var(--mp-dial-press-duration) var(--mp-dial-press-ease);
      }
      .power {
        left: var(--mp-dial-control-inset);
      }
      .mode {
        right: var(--mp-dial-control-inset);
      }
      .power.filled {
        background: var(--mp-primary);
        color: var(--mp-on-primary);
      }
      .power:active:not(:disabled) {
        border-radius: var(--mp-shape-chip-square);
      }
      button::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: currentColor;
        opacity: 0;
        pointer-events: none;
      }
      button:hover:not(:disabled)::after {
        opacity: var(--mp-state-hover);
      }
      button:active:not(:disabled)::after {
        opacity: var(--mp-state-pressed);
      }
      button:focus-visible {
        outline: var(--mp-dial-focus-width) solid var(--mp-primary);
        outline-offset: var(--mp-dial-focus-width);
      }
      button:disabled {
        cursor: default;
        opacity: 0.5;
      }
      @media (prefers-reduced-motion: reduce) {
        .dial,
        .power,
        .mode {
          transition: none;
        }
      }
    `,
  ];
}

if (!customElements.get('mp-purifier-dial')) {
  customElements.define('mp-purifier-dial', MpPurifierDial);
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-purifier-dial': MpPurifierDial;
  }
}
