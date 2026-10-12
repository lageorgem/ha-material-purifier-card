import { LitElement, html, css, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';

/**
 * A tiny text input styled as a **pill** to match {@link MpIconField} — same
 * height, fully-rounded shape, surface fill and outline. It exists because a
 * bare `<ha-textfield>` placed directly in a custom-card editor often never
 * upgrades (HA only preloads the picker/form stack, not the standalone
 * textfield), leaving the field invisible. A native input always renders and
 * lets the editor's title/label fields sit seamlessly next to the icon pill.
 *
 * Emits `value-changed` (`{ value }`, bubbles+composed) on every input.
 */
export class MpTextField extends LitElement {
  @property() value = '';
  /** Placeholder + accessible name. */
  @property() label = '';
  @property() type: 'text' | 'number' = 'text';
  @property() placeholder?: string;
  @property() min?: string | number;
  @property() max?: string | number;
  @property() step?: string | number;
  /** Flatten the left corners so a control (e.g. the color pill) attaches seamlessly. */
  @property({ type: Boolean }) flatLeft = false;

  /**
   * Emit the current input value to the parent editor.
   * @param e the input event
   */
  private _onInput(e: Event): void {
    const value = (e.target as HTMLInputElement).value;
    this.dispatchEvent(
      new CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true })
    );
  }

  protected render(): TemplateResult {
    return html`<input
      type=${this.type}
      class=${classMap({ 'flat-left': this.flatLeft })}
      .value=${this.value ?? ''}
      placeholder=${this.placeholder ?? this.label}
      min=${ifDefined(this.type === 'number' ? this.min : undefined)}
      max=${ifDefined(this.type === 'number' ? this.max : undefined)}
      step=${ifDefined(this.type === 'number' ? this.step : undefined)}
      aria-label=${this.label}
      @input=${this._onInput}
    />`;
  }

  static styles = css`
    :host {
      display: block;
      min-width: 0;
    }
    input {
      width: 100%;
      box-sizing: border-box;
      height: 40px;
      padding: 0 14px;
      border-radius: var(--md-sys-shape-corner-full, 9999px);
      border: 1px solid var(--md-sys-color-outline-variant, var(--divider-color));
      background: var(--md-sys-color-surface-container-high, var(--secondary-background-color));
      color: var(--md-sys-color-on-surface, var(--primary-text-color));
      font: inherit;
      font-size: 14px;
      outline: none;
      transition: border-color 150ms cubic-bezier(0.2, 0, 0, 1);
    }
    input::placeholder {
      color: var(--md-sys-color-on-surface-variant, var(--secondary-text-color));
    }
    input[type='number'] {
      appearance: textfield;
      -moz-appearance: textfield;
    }
    input[type='number']::-webkit-inner-spin-button,
    input[type='number']::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    input:focus {
      border-color: var(--md-sys-color-primary, var(--primary-color));
    }
    /* Attach seamlessly to a control on the left (e.g. the color pill). */
    input.flat-left {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      border-left: none;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-text-field': MpTextField;
  }
}

if (!customElements.get('mp-text-field')) customElements.define('mp-text-field', MpTextField);
