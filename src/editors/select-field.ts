import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokens } from '../theme';

/** Rounded editor select. Keeps keyboard focus on its combobox using active descendants. */
export class MpSelectField extends LitElement {
  @property() label = '';
  @property() value: string | undefined;
  @property({ attribute: false }) options: { value: string; label: string }[] = [];
  @property() placeholder?: string;
  @property({ type: Boolean }) disabled = false;
  @property() helper?: string;

  @state() private _open = false;
  @state() private _active = -1;

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this._outsideClick);
  }

  disconnectedCallback(): void {
    document.removeEventListener('click', this._outsideClick);
    this._open = false;
    super.disconnectedCallback();
  }

  protected willUpdate(changed: PropertyValues<this>): void {
    if (this.disabled) this._open = false;
    if (changed.has('options') || changed.has('value')) {
      this._active = this.options.findIndex((option) => option.value === this.value);
      if (this._active < 0 && this.options.length) this._active = 0;
    }
  }

  protected updated(): void {
    if (this._open && this._active >= 0) {
      this.shadowRoot
        ?.getElementById(`option-${this._active}`)
        ?.scrollIntoView({ block: 'nearest' });
    }
  }

  private _focus(): void {
    this.shadowRoot?.querySelector<HTMLButtonElement>('.trigger')?.focus();
  }

  private _close(): void {
    this._open = false;
    this._focus();
  }

  private _outsideClick = (event: MouseEvent): void => {
    if (this._open && !event.composedPath().includes(this)) this._close();
  };

  private _show(): void {
    if (this.disabled) return;
    const selected = this.options.findIndex((option) => option.value === this.value);
    this._active = selected >= 0 ? selected : this.options.length ? 0 : -1;
    this._open = true;
    this._focus();
  }

  private _toggle(): void {
    if (this.disabled) return;
    if (this._open) this._close();
    else this._show();
  }

  private _select(index: number): void {
    const option = this.options[index];
    if (this.disabled || !option) return;
    this.value = option.value;
    this._close();
    this.dispatchEvent(
      new CustomEvent('value-changed', {
        detail: { value: option.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _keydown(event: KeyboardEvent): void {
    if (this.disabled) return;
    const key = event.key;
    if (key === 'Tab') {
      this._open = false;
      return;
    }
    if (!['Enter', ' ', 'ArrowDown', 'ArrowUp', 'Escape', 'Home', 'End'].includes(key)) return;
    if (!this._open) {
      if (['Enter', ' ', 'ArrowDown'].includes(key)) {
        event.preventDefault();
        this._show();
      }
      return;
    }
    event.preventDefault();
    if (key === 'Escape') this._close();
    else if (key === 'Enter' || key === ' ') this._select(this._active);
    else if (this.options.length) {
      if (key === 'Home') this._active = 0;
      else if (key === 'End') this._active = this.options.length - 1;
      else
        this._active =
          (this._active + (key === 'ArrowDown' ? 1 : -1) + this.options.length) %
          this.options.length;
    }
  }

  protected render(): TemplateResult {
    const selected = this.options.find((option) => option.value === this.value);
    return html`
      <div class="field">
        <button
          id="field"
          type="button"
          class=${classMap({ trigger: true, open: this._open })}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded=${String(this._open)}
          aria-controls="menu"
          aria-label=${this.label}
          aria-describedby=${this.helper ? 'helper' : nothing}
          aria-activedescendant=${this._open && this._active >= 0 ? `option-${this._active}` : nothing}
          ?disabled=${this.disabled}
          @click=${this._toggle}
          @keydown=${this._keydown}
        >
          <span class=${classMap({ text: true, muted: !selected })}
            >${selected?.label ?? this.placeholder ?? this.label}</span
          >
          <ha-icon class="chev" icon="mdi:chevron-down" aria-hidden="true"></ha-icon>
        </button>
        ${
          this._open
            ? html`<div id="menu" class="menu" role="listbox" aria-label=${this.label}>
                ${this.options.map(
                  (option, index) =>
                    html`<button
                      type="button"
                      tabindex="-1"
                      id=${`option-${index}`}
                      role="option"
                      aria-selected=${String(option.value === this.value)}
                      class=${classMap({ opt: true, selected: option.value === this.value, active: index === this._active })}
                      @mousedown=${(event: MouseEvent) => event.preventDefault()}
                      @click=${() => this._select(index)}
                      @keydown=${this._keydown}
                    >
                      <span class="text">${option.label}</span>
                      ${option.value === this.value ? html`<ha-icon class="check" icon="mdi:check" aria-hidden="true"></ha-icon>` : nothing}
                    </button>`
                )}
                ${!this.options.length ? html`<div class="empty" role="status">No options available</div>` : nothing}
              </div>`
            : nothing
        }
      </div>
      ${this.helper ? html`<div id="helper" class="helper">${this.helper}</div>` : nothing}
    `;
  }

  static styles = [
    tokens,
    css`
      :host {
        display: block;
        width: 100%;
        min-width: 0;
      }
      .field {
        position: relative;
      }
      .trigger {
        width: 100%;
        box-sizing: border-box;
        height: 40px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 10px 0 14px;
        border-radius: var(--md-sys-shape-corner-full, 9999px);
        border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
        background: var(--md-sys-color-surface-container-high, var(--secondary-background-color));
        color: var(--md-sys-color-on-surface, var(--primary-text-color));
        cursor: pointer;
        font: inherit;
        font-size: 14px;
        -webkit-tap-highlight-color: transparent;
      }
      .trigger:focus {
        outline: none;
        border-color: var(--md-sys-color-primary, var(--primary-color));
      }
      .trigger:focus-visible {
        outline: 2px solid var(--mp-primary);
        outline-offset: 2px;
      }
      .trigger:hover:not(:disabled) {
        border-color: var(--mp-primary);
      }
      .trigger:active:not(:disabled) {
        border-color: var(--mp-primary);
      }
      .trigger:disabled {
        cursor: not-allowed;
        opacity: 0.38;
      }
      .text {
        flex: 1;
        min-width: 0;
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .muted,
      .chev {
        color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
      }
      .chev {
        flex: 0 0 auto;
        --mdc-icon-size: 20px;
        transition: transform 150ms cubic-bezier(0.2, 0, 0, 1);
      }
      .open .chev {
        transform: rotate(180deg);
      }
      .menu {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        right: 0;
        z-index: 30;
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 6px;
        box-sizing: border-box;
        max-height: 280px;
        overflow-y: auto;
        background: var(--mp-surface-container-high);
        border-radius: var(--mp-shape-chip-square);
        box-shadow:
          0 4px 12px rgba(0, 0, 0, 0.3),
          0 1px 3px rgba(0, 0, 0, 0.2);
      }
      .opt {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        min-height: 44px;
        padding: 10px 12px;
        box-sizing: border-box;
        border: none;
        background: transparent;
        color: var(--mp-on-surface);
        border-radius: var(--mp-shape-full);
        cursor: pointer;
        font: inherit;
        text-align: left;
      }
      .opt:hover,
      .opt.active {
        background: color-mix(in srgb, var(--mp-on-surface) 8%, transparent);
      }
      .opt.selected {
        background: var(--mp-secondary-container);
        color: var(--mp-on-secondary-container);
      }
      .opt.active {
        outline: 2px solid var(--mp-primary);
        outline-offset: -2px;
      }
      .check {
        --mdc-icon-size: 20px;
        flex: 0 0 auto;
        color: var(--mp-on-secondary-container);
      }
      .helper,
      .empty {
        padding: 6px 14px;
        color: var(--mp-on-surface-variant);
        font-size: var(--md-sys-typescale-body-small-size, 12px);
        overflow-wrap: anywhere;
      }
      @media (prefers-reduced-motion: reduce) {
        .chev {
          transition: none;
        }
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-select-field': MpSelectField;
  }
}

if (!customElements.get('mp-select-field')) customElements.define('mp-select-field', MpSelectField);
