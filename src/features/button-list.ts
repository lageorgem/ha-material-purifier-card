import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { EntityItem, SelectorItem } from '../types';
import { pressOrToggle } from '../actions';
import './selector-row';

/** Independent button/input_button/scene/script chips, with no selected state. */
export class MpButtonList extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) items: EntityItem[] = [];
  @property() label?: string;

  /** Build a chip per button. */
  private _build(): SelectorItem[] {
    return (this.items ?? [])
      .filter((e) => e.entity)
      .map((e) => {
        const state = this.hass?.states?.[e.entity];
        return {
          value: e.entity,
          label: e.label ?? state?.attributes.friendly_name ?? e.entity,
          icon: e.icon ?? state?.attributes.icon ?? 'mdi:gesture-tap-button',
          active: false,
          disabled: !state || state.state === 'unavailable',
        };
      });
  }

  /**
   * Press the clicked button.
   * @param e selector-row's item-selected event
   */
  private _onSelect(e: CustomEvent): void {
    pressOrToggle(this, this.hass, e.detail.value);
  }

  protected render(): TemplateResult | typeof nothing {
    const items = this._build();
    if (!items.length) return nothing;
    return html`<mp-selector-row
      .items=${items}
      display="icons"
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mp-selector-row>`;
  }
}

if (!customElements.get('mp-button-list')) customElements.define('mp-button-list', MpButtonList);

declare global {
  interface HTMLElementTagNameMap {
    'mp-button-list': MpButtonList;
  }
}
