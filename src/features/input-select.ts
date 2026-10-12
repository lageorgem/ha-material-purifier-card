import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { FeatureDisplay, OptionOverride, SelectorItem } from '../types';
import { prettyLabel, orderValues } from '../theme';
import './selector-row';

/** Selector bound to input_select or select, with per-option overrides and explicit ordering. */
export class MpInputSelect extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property() entity!: string;
  @property() display: FeatureDisplay = 'icons';
  @property() label?: string;
  @property({ attribute: false }) options?: OptionOverride[];
  @property({ attribute: false }) order?: string[];

  private get _stateObj() {
    return this.hass?.states?.[this.entity];
  }

  /** Lookup of per-option overrides keyed by value. */
  private _overrideMap(): Map<string, OptionOverride> {
    const map = new Map<string, OptionOverride>();
    (this.options ?? []).forEach((o) => map.set(o.value, o));
    return map;
  }

  /** Build selector items from the entity's options and overrides. */
  private _build(): SelectorItem[] {
    const state = this._stateObj;
    if (!state) return [];
    const overrides = this._overrideMap();
    const options: string[] = state.attributes.options ?? [];
    return orderValues(options, this.order)
      .filter((v) => !overrides.get(v)?.hide)
      .map((v) => ({
        value: v,
        label: overrides.get(v)?.label ?? prettyLabel(v),
        icon: overrides.get(v)?.icon,
        active: v === state.state,
        color: overrides.get(v)?.color,
      }));
  }

  /**
   * Select the chosen option.
   * @param e selector-row's item-selected event
   */
  private _onSelect(e: CustomEvent): void {
    if (!this._stateObj) return;
    const domain = this.entity.split('.')[0];
    if (domain !== 'input_select' && domain !== 'select') {
      console.warn(`mp-input-select: unsupported entity domain for ${this.entity}`);
      return;
    }
    this.hass.callService(domain, 'select_option', {
      entity_id: this.entity,
      option: e.detail.value,
    });
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

if (!customElements.get('mp-input-select')) customElements.define('mp-input-select', MpInputSelect);

declare global {
  interface HTMLElementTagNameMap {
    'mp-input-select': MpInputSelect;
  }
}
