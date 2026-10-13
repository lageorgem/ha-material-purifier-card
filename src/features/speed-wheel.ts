import { LitElement, css, html, svg, type PropertyValues, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { tokens } from '../theme';
import { WheelPhysics } from './wheel-physics';

const PX_PER_DETENT = 22;
const WHEEL_SETTLE_MS = 300;
const POP_LINGER_MS = 400;
const RIDGE_THICKNESS = 3;
const RIDGE_MIN_THICKNESS = 0.6;
const NOTCH_RADIUS = 2;
const NOTCH_GAP = 3;
const NOTCH_EDGE_CLEARANCE = 3;
const RIDGE_INSET = NOTCH_EDGE_CLEARANCE + NOTCH_RADIUS * 2 + NOTCH_GAP + RIDGE_THICKNESS / 2;
const RIDGE_BOW = 0.35;
const VISIBLE_ANGLE = (85 * Math.PI) / 180;
const KEYS = new Set([
  'ArrowUp',
  'ArrowRight',
  'ArrowDown',
  'ArrowLeft',
  'PageUp',
  'PageDown',
  'Home',
  'End',
]);

/** Generic controlled detent drum. Public value is input; events carry user changes. */
export class MpSpeedWheel extends LitElement {
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 100;
  @property({ type: Number }) step = 1;
  @property({ type: Number }) value: number | null = null;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: String }) label = 'Fan speed';
  @property({ type: String, attribute: 'value-text' }) valueText = '';

  private readonly _physics = new WheelPhysics({ count: 101, pxPerDetent: PX_PER_DETENT });
  private _pointer: number | null = null;
  private _startY = 0;
  private _startDetent = 0;
  private _lastDetent = 0;
  private _dirty = false;
  private _frame: number | null = null;
  private _wheelTimer: ReturnType<typeof setTimeout> | null = null;
  private _popTimer: ReturnType<typeof setTimeout> | null = null;
  private _hovered = false;
  private _popActive = false;
  private _observer: ResizeObserver | null = null;
  private _ridges: SVGPathElement[] = [];
  private _radius = 60;
  private _ridgeWidth = 40;

  private get _count(): number {
    if (
      !Number.isFinite(this.min) ||
      !Number.isFinite(this.max) ||
      !Number.isFinite(this.step) ||
      this.step <= 0 ||
      this.max < this.min
    ) {
      return 1;
    }
    const intervals = (this.max - this.min) / this.step;
    const fullIntervals = Math.floor(intervals + 1e-9);
    return fullIntervals + 1 + (intervals - fullIntervals > 1e-9 ? 1 : 0);
  }

  private get _interacting(): boolean {
    return this._pointer !== null || this._physics.phase !== 'idle' || this._wheelTimer !== null;
  }

  private _precision(value: number): number {
    const [coefficient, exponent = '0'] = value.toString().toLowerCase().split('e');
    return Math.max(0, (coefficient.split('.')[1]?.length ?? 0) - Number(exponent));
  }

  private get _currentValue(): number {
    if (this._count > 1 && this._physics.detent === this._count - 1) return this.max;
    const precision = Math.min(
      100,
      Math.max(this._precision(this.step), this._precision(this.min))
    );
    return Math.min(
      this.max,
      Number((this.min + this._physics.detent * this.step).toFixed(precision))
    );
  }

  private _syncValue(): void {
    const value = this.value ?? this.min;
    let index = 0;
    if (Number.isFinite(value) && this.step > 0 && this._count > 1) {
      const regular = Math.max(
        0,
        Math.min(this._count - 2, Math.round((value - this.min) / this.step))
      );
      const regularValue = this.min + regular * this.step;
      index =
        Math.abs(value - this.max) <= Math.abs(value - regularValue) ? this._count - 1 : regular;
    }
    if (this._physics.detent !== index) this._physics.setDetent(index);
    this._lastDetent = this._physics.detent;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this._onKeyDown);
    this.addEventListener('wheel', this._onWheel, { passive: false });
    this.addEventListener('pointerdown', this._onPointerDown);
    this.addEventListener('pointermove', this._onPointerMove);
    this.addEventListener('pointerup', this._onPointerEnd);
    this.addEventListener('pointercancel', this._onPointerEnd);
    this.addEventListener('lostpointercapture', this._onPointerEnd);
    this.addEventListener('pointerenter', this._onPointerEnter);
    this.addEventListener('pointerleave', this._onPointerLeave);
    this.addEventListener('focus', this._syncPopped);
    this.addEventListener('blur', this._syncPopped);
    this.updateComplete.then(() => {
      if (!this.isConnected || this._observer) return;
      this._observer = new ResizeObserver(this._layoutRidges);
      this._observer.observe(this);
      this._layoutRidges();
    });
  }

  disconnectedCallback(): void {
    this._hovered = false;
    this._cancelInteraction();
    this.removeAttribute('popped');
    this._observer?.disconnect();
    this._observer = null;
    this.removeEventListener('keydown', this._onKeyDown);
    this.removeEventListener('wheel', this._onWheel);
    this.removeEventListener('pointerdown', this._onPointerDown);
    this.removeEventListener('pointermove', this._onPointerMove);
    this.removeEventListener('pointerup', this._onPointerEnd);
    this.removeEventListener('pointercancel', this._onPointerEnd);
    this.removeEventListener('lostpointercapture', this._onPointerEnd);
    this.removeEventListener('pointerenter', this._onPointerEnter);
    this.removeEventListener('pointerleave', this._onPointerLeave);
    this.removeEventListener('focus', this._syncPopped);
    this.removeEventListener('blur', this._syncPopped);
    super.disconnectedCallback();
  }

  protected updated(changed: PropertyValues<this>): void {
    if (changed.has('disabled') && this.disabled) this._cancelInteraction();
    const rangeChanged = changed.has('min') || changed.has('max') || changed.has('step');
    if (rangeChanged) this._physics.setCount(this._count);
    if (!this._interacting && (changed.has('value') || rangeChanged)) {
      this._syncValue();
    }
    this._paint();
  }

  private _clearWheelTimer(): void {
    if (this._wheelTimer !== null) clearTimeout(this._wheelTimer);
    this._wheelTimer = null;
  }

  private _syncPopped = (): void => {
    const popped =
      !this.disabled &&
      (this._hovered ||
        this.matches(':focus-visible') ||
        this._popActive ||
        this._interacting ||
        this._popTimer !== null);
    if (this.hasAttribute('popped') !== popped) this.toggleAttribute('popped', popped);
  };

  private _onPointerEnter = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse' || !window.matchMedia('(hover: hover)').matches) return;
    this._hovered = true;
    this._syncPopped();
  };

  private _onPointerLeave = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') return;
    this._hovered = false;
    this._syncPopped();
  };

  private _clearPopTimer(): void {
    if (this._popTimer !== null) clearTimeout(this._popTimer);
    this._popTimer = null;
  }

  private _cancelInteraction(): void {
    this._popActive = false;
    this._clearPopTimer();
    this._clearWheelTimer();
    if (this._frame !== null) cancelAnimationFrame(this._frame);
    this._frame = null;
    const pointer = this._pointer;
    this._pointer = null;
    if (pointer !== null && this.hasPointerCapture(pointer)) this.releasePointerCapture(pointer);
    this._physics.setDetent(this._physics.detent);
    this._dirty = false;
    this._paint();
  }

  private _emit(type: 'value-changing' | 'value-changed'): void {
    this.dispatchEvent(
      new CustomEvent(type, {
        detail: { value: this._currentValue },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _trackDetent(): void {
    this._paint();
    if (this._lastDetent === this._physics.detent) return;
    this._lastDetent = this._physics.detent;
    this._dirty = true;
    this._emit('value-changing');
    window.dispatchEvent(new CustomEvent('haptic', { detail: 'selection' }));
  }

  private _settle(): void {
    this._paint();
    if (this._interacting) return;
    // Linger after settlement without keeping the controlled input busy.
    if (this._popActive) {
      this._popActive = false;
      this._clearPopTimer();
      this._popTimer = setTimeout(() => {
        this._popTimer = null;
        this._syncPopped();
      }, POP_LINGER_MS);
    }
    if (this._dirty) {
      this._dirty = false;
      this._emit('value-changed');
    }
    // Commit listeners may synchronously update the controlled value or start a gesture.
    if (!this._interacting) {
      this._syncValue();
      this._paint();
    }
  }

  private _onPointerDown = (event: PointerEvent): void => {
    if (this.disabled || event.button !== 0 || this._pointer !== null) return;
    // Synthetic PointerEvents have no active browser pointer; real pointers must be captured.
    try {
      this.setPointerCapture(event.pointerId);
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== 'NotFoundError') throw error;
    }
    event.preventDefault();
    this.focus({ preventScroll: true });
    this._clearWheelTimer();
    if (this._frame !== null) cancelAnimationFrame(this._frame);
    this._frame = null;
    this._pointer = event.pointerId;
    this._popActive = true;
    this._clearPopTimer();
    this._startY = event.clientY;
    this._physics.dragStart(performance.now());
    this._startDetent = this._physics.detent;
    this._paint();
  };

  private _onPointerMove = (event: PointerEvent): void => {
    if (this.disabled || this._pointer !== event.pointerId) return;
    this._physics.dragMove(event.clientY - this._startY, performance.now());
    this._trackDetent();
  };

  private _onPointerEnd = (event: PointerEvent): void => {
    if (this._pointer !== event.pointerId) return;
    if (event.type !== 'pointerup') {
      this._cancelInteraction();
      this._physics.setDetent(this._startDetent);
      this._trackDetent();
      this._dirty = false;
      return;
    }
    this._pointer = null;
    if (this.hasPointerCapture(event.pointerId)) this.releasePointerCapture(event.pointerId);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this._physics.setDetent(this._physics.detent);
    } else {
      this._physics.dragEnd(performance.now());
    }
    this._trackDetent();
    this._animate();
  };

  private _animate(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Advance each physics phase without rendering intermediate motion.
      let time = performance.now();
      for (let i = 0; i < 100 && this._physics.phase !== 'idle'; i++) {
        time += 100000;
        this._physics.tick(time);
        this._trackDetent();
      }
      this._settle();
      return;
    }
    if (this._physics.phase === 'idle') {
      this._settle();
    } else if (this._frame === null) {
      this._frame = requestAnimationFrame(this._tick);
    }
  }

  private _tick = (time: number): void => {
    this._frame = null;
    if (!this.isConnected || this.disabled) return;
    this._physics.tick(time);
    this._trackDetent();
    this._animate();
  };

  private _onWheel = (event: WheelEvent): void => {
    if (this.disabled) return;
    const interacting = this._interacting;
    const before = this._physics.detent;
    this._physics.wheel(event.deltaY, event.deltaMode as 0 | 1 | 2);
    const moved = before !== this._physics.detent;
    if (!moved && !interacting) return;
    event.preventDefault();
    this._clearWheelTimer();
    this._popActive = true;
    this._wheelTimer = setTimeout(() => {
      this._wheelTimer = null;
      if (this._pointer === null) this._animate();
      else this._paint();
    }, WHEEL_SETTLE_MS);
    this._clearPopTimer();
    this._trackDetent();
  };

  private _onKeyDown = (event: KeyboardEvent): void => {
    if (this.disabled || this._pointer !== null || !KEYS.has(event.key)) return;
    event.preventDefault();
    this._popActive = true;
    this._clearPopTimer();
    this._syncPopped();
    this._clearWheelTimer();
    if (this._frame !== null) cancelAnimationFrame(this._frame);
    this._frame = null;
    this._physics.setDetent(this._physics.detent);
    const page = Math.max(1, Math.round(this._count / 10));
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        this._physics.step(1);
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        this._physics.step(-1);
        break;
      case 'PageUp':
        this._physics.step(page);
        break;
      case 'PageDown':
        this._physics.step(-page);
        break;
      case 'Home':
        this._physics.setDetent(0);
        break;
      case 'End':
        this._physics.setDetent(this._count - 1);
        break;
    }
    this._trackDetent();
    this._settle();
  };

  private _layoutRidges = (): void => {
    const wheel = this.renderRoot.querySelector('.ridges');
    if (!wheel) return;
    const { width, height } = this.getBoundingClientRect();
    this._radius = Math.max(60, height / 2);
    this._ridgeWidth = Math.max(1, width - RIDGE_INSET * 2);
    wheel.setAttribute('viewBox', `${-width / 2} ${-this._radius} ${width} ${this._radius * 2}`);
    // Reserve space for the stationary dot, including the center ridge's round cap.
    const notch = wheel.querySelector('.notch');
    notch?.setAttribute('cx', String(width / 2 - NOTCH_EDGE_CLEARANCE - NOTCH_RADIUS));
    const count = Math.ceil((Math.PI * this._radius) / (PX_PER_DETENT / 2)) + 4;
    if (this._ridges.length !== count) {
      this._ridges = Array.from({ length: count }, () => {
        const ridge = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        ridge.setAttribute('class', 'ridge');
        ridge.setAttribute('stroke-width', String(RIDGE_THICKNESS));
        return ridge;
      });
      wheel.querySelector('.ridge-pool')!.replaceChildren(...this._ridges);
    }
    this._paint();
  };

  /** Fixed SVG pool: frame geometry uses only d/transform/opacity, never Lit rendering. */
  private _paint(): void {
    const attributes: Record<string, string> = {
      role: 'slider',
      tabindex: this.disabled ? '-1' : '0',
      'aria-label': this.label,
      'aria-orientation': 'vertical',
      'aria-disabled': String(this.disabled),
      'aria-valuemin': String(this.min),
      'aria-valuemax': String(this.max),
      'aria-valuenow': String(this._currentValue),
      'aria-valuetext': this.valueText || String(this._currentValue),
    };
    for (const [name, value] of Object.entries(attributes)) {
      if (this.getAttribute(name) !== value) this.setAttribute(name, value);
    }
    if (this.hasAttribute('interacting') !== this._interacting) {
      this.toggleAttribute('interacting', this._interacting);
    }
    this._syncPopped();
    const offset = (((-this._physics.position * 2) % 1) + 1) % 1;
    const center = Math.floor(this._ridges.length / 2);
    this._ridges.forEach((ridge, index) => {
      const angle = ((index - center + offset) * (PX_PER_DETENT / 2)) / this._radius;
      const cosine = Math.max(0, Math.cos(angle));
      const length = this._ridgeWidth * (0.55 + 0.45 * cosine);
      const scale = Math.max(RIDGE_MIN_THICKNESS / RIDGE_THICKNESS, cosine);
      const sagitta = RIDGE_BOW * Math.sin(angle) * (length / 2);
      const y = this._radius * Math.sin(angle);
      // Retire off-cylinder geometry as well as its paint: invisible pooled paths
      // must not extend beyond the capsule, even at fractional drag positions.
      const visible =
        Math.abs(angle) <= VISIBLE_ANGLE &&
        Math.abs(y + sagitta) + (RIDGE_THICKNESS * scale) / 2 <= this._radius;
      // A quadratic's midpoint sits halfway to its control point. Compensate for
      // scaleY so thickness foreshortens without flattening the projected bow.
      ridge.setAttribute(
        'd',
        visible
          ? `M ${-length / 2} 0 Q 0 ${(2 * sagitta) / scale} ${length / 2} 0`
          : 'M 0 0 Q 0 0 0 0'
      );
      ridge.setAttribute('transform', `translate(0 ${visible ? y : 0}) scale(1 ${scale})`);
      ridge.setAttribute('opacity', visible ? String(0.2 + 0.8 * cosine) : '0');
    });
  }

  protected render(): TemplateResult {
    return html`<div class="drum" aria-hidden="true">
      ${svg`<svg class="ridges" focusable="false" preserveAspectRatio="none">
        <g class="ridge-pool"></g>
        <circle class="notch" r="${NOTCH_RADIUS}" cy="0"></circle>
      </svg>`}
    </div>`;
  }

  static styles = [
    tokens,
    css`
      :host {
        --mp-wheel-width: 56px;
        --mp-wheel-min-height: 120px;
        --mp-wheel-radius: 28px;
        --mp-wheel-outline: 2px;
        --mp-wheel-pop-scale: 1.08;
        --mp-wheel-pop-enter: 220ms;
        --mp-wheel-pop-exit: 300ms;
        --mp-wheel-pop-easing: cubic-bezier(0.2, 0, 0, 1);
        --mp-wheel-pop-shadow: 0 4px 8px 3px rgb(0 0 0 / 15%), 0 1px 3px rgb(0 0 0 / 30%);
        display: block;
        width: var(--mp-wheel-width);
        height: 100%;
        min-height: var(--mp-wheel-min-height);
        touch-action: none;
        user-select: none;
        outline: none;
        cursor: grab;
        overflow: visible;
      }
      :host([disabled]) {
        opacity: 0.38;
        cursor: not-allowed;
      }
      .drum {
        /* Animate the resolved color, not an unregistered custom property, so
           the ends track the tile's background transition without observers. */
        color: var(
          --mp-wheel-fade,
          var(--mp-surface-container-high, var(--ha-card-background, #fff))
        );
        transition:
          color 200ms var(--mp-wheel-pop-easing),
          transform var(--mp-wheel-pop-exit) var(--mp-wheel-pop-easing),
          box-shadow var(--mp-wheel-pop-exit) var(--mp-wheel-pop-easing);
        transform-origin: center;
        position: relative;
        width: 100%;
        height: 100%;
        min-height: var(--mp-wheel-min-height);
        border-radius: var(--mp-wheel-radius);
        background: linear-gradient(
          to bottom,
          currentColor,
          var(--mp-surface-container-highest) 42%,
          color-mix(in srgb, var(--mp-surface-container-highest) 96%, white) 50%,
          var(--mp-surface-container-highest) 58%,
          currentColor
        );
        /* The gradient owns cylinder shading. Offset inset shadows paint a
           second capsule edge beside the outline; keep one fixed silhouette. */
        overflow: hidden;
        pointer-events: none;
      }
      :host([popped]) .drum {
        color: transparent;
        background-color: var(--mp-surface-container-highest);
        transform: scale(var(--mp-wheel-pop-scale));
        box-shadow: var(--mp-wheel-pop-shadow);
        transition-duration: var(--mp-wheel-pop-enter);
      }
      :host([popped]) .ridge-pool {
        mask-image: none;
      }
      :host([popped]) .ridge:not([opacity='0']) {
        opacity: 1;
      }
      @media (prefers-reduced-motion: reduce) {
        .drum,
        :host([popped]) .drum {
          transition: none;
          transform: none;
        }
      }
      :host([interacting]) .drum {
        outline: var(--mp-wheel-outline) solid var(--mp-primary);
      }
      :host(:focus-visible) .drum {
        outline: var(--mp-wheel-outline) solid var(--mp-primary);
      }
      .ridges {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      .ridge-pool {
        mask-image: linear-gradient(transparent, black 18%, black 82%, transparent);
      }
      .ridge {
        fill: none;
        stroke: var(--mp-on-surface-variant);
        stroke-linecap: round;
      }
      .drum::after {
        content: '';
        position: absolute;
        top: 43%;
        left: 12px;
        right: 12px;
        height: 1px;
        border-radius: var(--mp-wheel-radius);
        background: rgb(255 255 255 / 10%);
      }
      .notch {
        fill: var(--mp-primary);
      }
    `,
  ];
}

if (!customElements.get('mp-speed-wheel')) customElements.define('mp-speed-wheel', MpSpeedWheel);

declare global {
  interface HTMLElementTagNameMap {
    'mp-speed-wheel': MpSpeedWheel;
  }
}
