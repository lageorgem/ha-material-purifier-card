import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokens } from '../theme';
import type { FeatureDisplay, SelectorItem } from '../types';
import './dropdown';

/** Shared icon-chip/dropdown/tile selector. Emits bubbling, composed item-selected { value }. */
export class MpSelectorRow extends LitElement {
  @property({ attribute: false }) items: SelectorItem[] = [];
  @property() display: FeatureDisplay = 'icons';
  @property() label?: string;
  @property({ type: Boolean }) forceOff = false;

  /**
   * Dispatch the selection to the parent feature component.
   * @param value the selected item's value
   */
  private _select(value: string): void {
    this.dispatchEvent(
      new CustomEvent('item-selected', { detail: { value }, bubbles: true, composed: true })
    );
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.items.length) return nothing;
    // Tiles carry their own title; icons/dropdowns get an optional leading title.
    if (this.display === 'tile') return this._renderTile();
    const body = this.display === 'dropdown' ? this._renderDropdown() : this._renderIcons();
    return html`${this.label ? html`<div class="title">${this.label}</div>` : nothing}${body}`;
  }

  /** Render the items as a row of icon chips. */
  private _renderIcons(): TemplateResult {
    return html`
      <div class="chips" role="group" aria-label=${this.label ?? 'options'}>
        ${this.items.map(
          (item) => html`
            <button
              class=${classMap({ chip: true, active: !!item.active })}
              ?disabled=${item.disabled}
              title=${item.label}
              aria-label=${item.label}
              aria-pressed=${item.active ? 'true' : 'false'}
              @click=${() => this._select(item.value)}
            >
              ${
                item.icon
                  ? html`<ha-icon icon=${item.icon}></ha-icon>`
                  : html`<span class="chip-text">${item.label}</span>`
              }
            </button>
          `
        )}
      </div>
    `;
  }

  /** Render the items as a themed dropdown. */
  private _renderDropdown(): TemplateResult {
    return html`<mp-dropdown
      .items=${this.items}
      .placeholder=${this.label ?? ''}
      @item-selected=${(e: CustomEvent) => this._select(e.detail.value)}
    ></mp-dropdown>`;
  }

  /** Render a tile showing the current value, with its own title and option menu. */
  private _renderTile(): TemplateResult {
    return html`<mp-dropdown
      variant="tile"
      .items=${this.items}
      .label=${this.label ?? ''}
      .forceOff=${this.forceOff}
      @item-selected=${(e: CustomEvent) => this._select(e.detail.value)}
    ></mp-dropdown>`;
  }

  static styles = [
    tokens,
    css`
      :host {
        display: block;
        width: 100%;
        min-width: 0;
      }
      .title {
        color: var(--mp-on-surface-variant);
        font-size: var(--md-sys-typescale-label-large-size, 13px);
        font-weight: 500;
        padding: 0 4px 6px;
      }
      .chips {
        display: flex;
        align-items: center;
        justify-content: safe center;
        gap: 4px;
        padding: 4px 2px;
        background: var(--mp-surface-container);
        border-radius: var(--mp-shape-full);
        /* Shrink to the container and scroll rather than squish the chips. */
        min-width: 0;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
      }
      .chips::-webkit-scrollbar {
        display: none;
      }
      .chip {
        flex: 1 1 44px;
        height: 44px;
        min-width: 44px;
        max-width: 120px;
        display: grid;
        place-items: center;
        border: none;
        border-radius: var(--mp-shape-full);
        background: transparent;
        color: var(--mp-on-surface-variant);
        cursor: pointer;
        padding: 0 8px;
        transition:
          background-color 180ms cubic-bezier(0.2, 0, 0, 1),
          color 180ms cubic-bezier(0.2, 0, 0, 1);
        -webkit-tap-highlight-color: transparent;
      }
      .chip ha-icon {
        --mdc-icon-size: 24px;
      }
      .chip-text {
        font-size: var(--md-sys-typescale-label-large-size, 14px);
        font-weight: 500;
        white-space: nowrap;
      }
      .chip:hover:not(.active):not([disabled]) {
        background: color-mix(in srgb, var(--mp-on-surface) 8%, transparent);
      }
      .chip:active:not([disabled]) {
        background: color-mix(in srgb, var(--mp-on-surface) 12%, transparent);
      }
      .chip.active {
        background: var(--mp-selected-bg, var(--mp-primary));
        color: var(--mp-selected-fg, var(--mp-on-primary));
      }
      .chip[disabled] {
        opacity: 0.38;
        cursor: default;
      }
    `,
  ];
}

if (!customElements.get('mp-selector-row')) customElements.define('mp-selector-row', MpSelectorRow);

declare global {
  interface HTMLElementTagNameMap {
    'mp-selector-row': MpSelectorRow;
  }
}
