import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { FeatureConfig, MaterialPurifierCardConfig } from '../types';
import { MAX_WIDTH_PCT, TILE_DEFAULT_PCT, pctToSpan } from '../grid';
import './fan-presets';
import './speed-wheel-tile';
import './filter-vacuum';
import './input-select';
import './switch-group';
import './switch-list';
import './button-list';
import './entity-tile';
import './sensor-list';
import './percentage-tile';

/** Dispatches a purifier feature and sizes its host within the card's grid. */
export class MpFeatureRow extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property() entity!: string;
  @property({ attribute: false }) feature!: FeatureConfig;
  @property({ attribute: false }) cardConfig!: MaterialPurifierCardConfig;
  @property() rpmEntity?: string;
  @property({ type: Boolean }) parentOff = false;

  /**
   * Apply the configured percentage width as a grid column span.
   * @param changed changed properties
   */
  protected willUpdate(changed: PropertyValues): void {
    if (!changed.has('feature') || !this.feature) return;
    const tile = ['percentage-tile', 'entity-tile', 'speed-wheel', 'filter-vacuum'].includes(
      this.feature.type
    );
    const width = this.feature.width ?? (tile ? TILE_DEFAULT_PCT : MAX_WIDTH_PCT);
    this.style.gridColumn = `span ${pctToSpan(width)}`;
  }

  protected render(): TemplateResult | typeof nothing {
    const feature = this.feature;
    if (!feature) return nothing;
    switch (feature.type) {
      case 'percentage-tile':
        return html`<mp-percentage-tile
          .hass=${this.hass}
          .config=${feature}
          .forceOff=${this.parentOff}
        ></mp-percentage-tile>`;
      case 'fan-presets':
        return html`<mp-fan-presets
          .hass=${this.hass}
          .entity=${this.entity}
          .config=${feature}
        ></mp-fan-presets>`;
      case 'speed-wheel':
        return html`<mp-speed-wheel-tile
          .hass=${this.hass}
          .entity=${this.entity}
          .config=${feature}
          .cardConfig=${this.cardConfig}
          .rpmEntity=${this.rpmEntity}
        ></mp-speed-wheel-tile>`;
      case 'filter-vacuum':
        return html`<mp-filter-vacuum
          .hass=${this.hass}
          .config=${feature}
          .rpmEntity=${this.rpmEntity}
          .cardConfig=${this.cardConfig}
        ></mp-filter-vacuum>`;
      case 'input-select':
        return html`<mp-input-select
          .hass=${this.hass}
          .entity=${feature.entity}
          .display=${feature.display ?? 'icons'}
          .label=${feature.label}
          .options=${feature.options}
          .order=${feature.order}
        ></mp-input-select>`;
      case 'switch-group':
        return html`<mp-switch-group
          .hass=${this.hass}
          .entities=${feature.entities}
          .display=${feature.display ?? 'icons'}
          .label=${feature.label}
        ></mp-switch-group>`;
      case 'switch-list':
        return html`<mp-switch-list
          .hass=${this.hass}
          .entities=${feature.entities}
          .label=${feature.label}
        ></mp-switch-list>`;
      case 'button-list':
        return html`<mp-button-list
          .hass=${this.hass}
          .items=${feature.items}
          .label=${feature.label}
        ></mp-button-list>`;
      case 'entity-tile':
        return html`<mp-entity-tile
          .hass=${this.hass}
          .config=${feature}
          .forceOff=${this.parentOff}
        ></mp-entity-tile>`;
      case 'sensor-list':
        return html`<mp-sensor-list
          .hass=${this.hass}
          .items=${feature.items}
          .label=${feature.label}
        ></mp-sensor-list>`;
      default:
        return html`<div class="error">
          Unknown feature: ${(feature as { type: string }).type}
        </div>`;
    }
  }

  static styles = css`
    :host {
      display: block;
      min-width: 0;
    }
    .error {
      color: var(--mp-error);
      font-size: var(--md-sys-typescale-body-small-size, small);
      font-weight: var(--md-sys-typescale-body-small-weight, normal);
      line-height: var(--md-sys-typescale-body-small-line-height, normal);
      overflow-wrap: anywhere;
    }
  `;
}

if (!customElements.get('mp-feature-row')) customElements.define('mp-feature-row', MpFeatureRow);

declare global {
  interface HTMLElementTagNameMap {
    'mp-feature-row': MpFeatureRow;
  }
}
