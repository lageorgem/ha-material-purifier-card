import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { PercentageTileFeatureConfig, PercentRange } from '../types';
import { performTap } from '../actions';
import { tokens } from '../theme';
import { tileStyles } from './tile-styles';

/** Map the raw value to a clamped percentage of the configured interval. */
export function percentFill(value: number | null, min = 0, max = 100): number | null {
  if (value === null || Number.isNaN(value) || max <= min) return null;
  const fill = Math.min(1, Math.max(0, (value - min) / (max - min))) * 100;
  return Number.isNaN(fill) ? null : fill;
}

/** Ordered ranges use exclusive upper bounds, except for the final range. */
export function rangeColor(
  value: number | null,
  ranges: PercentRange[] | undefined,
  fallback: string
): string {
  if (value === null || Number.isNaN(value)) return fallback;
  return (
    ranges?.find(
      (range, index) =>
        value >= (range.from ?? -Infinity) &&
        (value < (range.to ?? Infinity) || (index === ranges.length - 1 && value === range.to))
    )?.color ?? fallback
  );
}

export class MpPercentageTile extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) config!: PercentageTileFeatureConfig;
  @property({ type: Boolean }) forceOff = false;

  private _tap = (): void => {
    performTap(
      this,
      this.hass,
      this.config.entity,
      this.config.tap_action ?? { action: 'more-info' }
    );
  };

  private _keydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (!event.repeat) this._tap();
  };

  protected render(): TemplateResult | typeof nothing {
    if (!this.config?.entity) return nothing;
    const state = this.hass?.states?.[this.config.entity];
    const raw = this.config.attribute
      ? (state?.attributes[this.config.attribute] ?? state?.state)
      : state?.state;
    const parsed = raw == null ? NaN : Number.parseFloat(String(raw));
    const value = Number.isFinite(parsed) ? parsed : null;
    const on = !this.forceOff && value !== null;
    const min = this.config.min ?? 0;
    const max = this.config.max ?? 100;
    const fill = percentFill(value, min, max);
    const color = on
      ? rangeColor(value, this.config.ranges, this.config.color ?? 'var(--mp-primary)')
      : undefined;
    const name = this.config.name ?? state?.attributes.friendly_name ?? this.config.entity;
    const icon = this.config.icon ?? state?.attributes.icon ?? 'mdi:gauge';
    const unit = state?.attributes.unit_of_measurement ?? '';
    let text = '—';
    if (value !== null && state) {
      // HA's formatter includes units; normalize that suffix before appending
      // it ourselves. A synthetic state keeps attribute values on the same
      // entity precision/locale path without mutating hass.states.
      const formatter = (
        this.hass as HomeAssistant & {
          formatEntityState?: (entity: typeof state) => string;
        }
      ).formatEntityState;
      let formatted = formatter
        ? formatter.call(this.hass, { ...state, state: String(raw) })
        : String(raw);
      if (unit && formatted.trimEnd().endsWith(unit)) {
        formatted = formatted.trimEnd().slice(0, -unit.length).trimEnd();
      }
      text = `${formatted}${unit ? ' ' + unit : ''}`;
    }
    const opacity = on && fill !== null && fill > 0 ? '1' : '0';
    return html`
      <div
        class=${classMap({ tile: true, on })}
        role="meter"
        tabindex="0"
        aria-label=${name}
        aria-valuemin=${min}
        aria-valuemax=${max}
        aria-valuenow=${
          value !== null && fill !== null ? Math.min(max, Math.max(min, value)) : nothing
        }
        aria-valuetext=${text}
        style=${styleMap({ '--mp-tile-accent': color })}
        @click=${this._tap}
        @keydown=${this._keydown}
      >
        <div
          class="fill"
          aria-hidden="true"
          style=${styleMap({ width: `${fill ?? 0}%`, opacity })}
        ></div>
        <div
          class="fade"
          aria-hidden="true"
          style=${styleMap({ left: `${fill ?? 0}%`, opacity })}
        ></div>
        <div class="ic"><ha-icon icon=${icon}></ha-icon></div>
        <div class="text">
          <div class="title">${name}</div>
          <div class="value">${text}</div>
        </div>
      </div>
    `;
  }

  static styles = [
    tokens,
    tileStyles,
    css`
      :host {
        display: block;
      }
      .tile {
        position: relative;
        isolation: isolate;
        overflow: hidden;
        --mp-percentage-fill: color-mix(
          in srgb,
          var(--mp-on-surface-variant) 16%,
          var(--mp-surface-container-high)
        );
      }
      .tile.on {
        --mp-percentage-fill: color-mix(
          in srgb,
          var(--mp-tile-accent) 38%,
          var(--mp-surface-container-high)
        );
      }
      .tile.on,
      .tile.on:hover,
      .tile.on:active {
        background: var(--mp-surface-container-high);
      }
      .tile:focus-visible {
        outline: 2px solid var(--mp-primary);
        outline-offset: 2px;
      }
      .fill,
      .fade {
        position: absolute;
        top: 0;
        bottom: 0;
        z-index: -1;
        pointer-events: none;
      }
      .fill {
        left: 0;
        background: var(--mp-percentage-fill);
        transition:
          width 450ms cubic-bezier(0.2, 0, 0, 1),
          opacity 450ms cubic-bezier(0.2, 0, 0, 1),
          background-color 200ms cubic-bezier(0.2, 0, 0, 1);
      }
      .fade {
        width: 10%;
        background: linear-gradient(to right, var(--mp-percentage-fill), transparent);
        transition:
          left 450ms cubic-bezier(0.2, 0, 0, 1),
          opacity 450ms cubic-bezier(0.2, 0, 0, 1);
      }
      @media (prefers-reduced-motion: reduce) {
        .tile,
        .tile .ic,
        .fill,
        .fade {
          transition: none;
        }
      }
    `,
  ];
}

if (!customElements.get('mp-percentage-tile')) {
  customElements.define('mp-percentage-tile', MpPercentageTile);
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-percentage-tile': MpPercentageTile;
  }
}
