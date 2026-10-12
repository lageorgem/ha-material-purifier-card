import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { EntityItem, FeatureDisplay, SelectorItem } from '../types';
import './selector-row';

/** Mutually-exclusive switches: turn others off before turning the selected one on. */
export class MpSwitchGroup extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) entities: EntityItem[] = [];
  @property() display: FeatureDisplay = 'icons';
  @property() label?: string;

  /** Build selector items from the configured switch entities. */
  private _build(): SelectorItem[] {
    return (this.entities ?? [])
      .filter((e) => e.entity)
      .map((e) => {
        const state = this.hass?.states?.[e.entity];
        return {
          value: e.entity,
          label: e.label ?? state?.attributes.friendly_name ?? e.entity,
          icon: e.icon ?? state?.attributes.icon,
          active: state?.state === 'on',
          disabled: !state || state.state === 'unavailable',
          color: e.color,
        };
      });
  }

  /**
   * Turn off every other on switch, then turn on the selected one.
   * @param e selector-row's item-selected event
   */
  private async _onSelect(e: CustomEvent): Promise<void> {
    const value = e.detail.value;
    const others = (this.entities ?? [])
      .map((en) => en.entity)
      .filter((id) => id && id !== value && this.hass.states[id]?.state === 'on');
    if (others.length) {
      await this.hass.callService('homeassistant', 'turn_off', { entity_id: others });
    }
    await this.hass.callService('homeassistant', 'turn_on', { entity_id: value });
  }

  protected render(): TemplateResult | typeof nothing {
    const items = this._build();
    if (!items.length) return nothing;
    return html`<mp-selector-row
      .items=${items}
      display=${this.display}
      .label=${this.label}
      @item-selected=${this._onSelect}
    ></mp-selector-row>`;
  }
}

if (!customElements.get('mp-switch-group')) customElements.define('mp-switch-group', MpSwitchGroup);

declare global {
  interface HTMLElementTagNameMap {
    'mp-switch-group': MpSwitchGroup;
  }
}
