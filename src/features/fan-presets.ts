import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { FanPresetsFeatureConfig, OptionOverride, SelectorItem } from '../types';
import { orderValues, prettyLabel, presetIcon, presetColor } from '../theme';
import './selector-row';

/** Selector bound to the purifier fan's preset modes, with optional power-off control. */
export class MpFanPresets extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property() entity!: string;
  @property({ attribute: false }) config: FanPresetsFeatureConfig = { type: 'fan-presets' };

  private get _stateObj() {
    return this.hass?.states?.[this.entity];
  }

  /** Build items from available presets and per-option configuration. */
  private _build(): SelectorItem[] {
    const state = this._stateObj;
    if (!state) return [];
    const overrides = new Map<string, OptionOverride>();
    (this.config.options ?? []).forEach((option) => overrides.set(option.value, option));
    const presets: string[] = state.attributes.preset_modes ?? [];
    const values = this.config.show_off ? ['off', ...presets] : presets;
    return orderValues(values, this.config.order)
      .filter((value) => !overrides.get(value)?.hide)
      .map((value) => ({
        value,
        label: overrides.get(value)?.label ?? prettyLabel(value),
        icon: overrides.get(value)?.icon ?? presetIcon(value),
        color: overrides.get(value)?.color ?? presetColor(value),
        active:
          value === 'off'
            ? state.state === 'off'
            : state.state === 'on' && state.attributes.preset_mode === value,
        disabled: state.state === 'unavailable',
      }));
  }

  /** Select an enabled, inactive option using the corresponding fan service. */
  private _onSelect(e: CustomEvent<{ value: string }>): void {
    const item = this._build().find((option) => option.value === e.detail.value);
    if (!item || item.active || item.disabled) return;
    if (item.value === 'off') {
      this.hass.callService('fan', 'turn_off', { entity_id: this.entity });
    } else {
      this.hass.callService('fan', 'set_preset_mode', {
        entity_id: this.entity,
        preset_mode: item.value,
      });
    }
  }

  protected render(): TemplateResult | typeof nothing {
    const items = this._build();
    if (!items.length) return nothing;
    return html`<mp-selector-row
      .items=${items}
      display=${this.config.display ?? 'icons'}
      .label=${this.config.label}
      @item-selected=${this._onSelect}
    ></mp-selector-row>`;
  }
}

if (!customElements.get('mp-fan-presets')) customElements.define('mp-fan-presets', MpFanPresets);

declare global {
  interface HTMLElementTagNameMap {
    'mp-fan-presets': MpFanPresets;
  }
}
