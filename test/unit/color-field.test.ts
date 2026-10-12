import { fixture, html, expect } from '@open-wc/testing';
import { oncePromise } from '../helpers';
import '../../src/editors/color-field';
import '../../src/editors/text-field';
import type { MpColorField } from '../../src/editors/color-field';

/** The swatch button. */
const swatch = (el: MpColorField) => el.shadowRoot!.querySelector('.swatch') as HTMLButtonElement;
/** The native color input inside the popover (null when closed). */
const colorInput = (el: MpColorField) =>
  el.shadowRoot!.querySelector('input[type="color"]') as HTMLInputElement | null;

describe('mp-color-field', () => {
  it('defaults to a full outlined pill matching the text field height', async () => {
    const group = await fixture<HTMLDivElement>(html`
      <div style="display: flex; align-items: stretch; --divider-color: #888">
        <mp-color-field .defaultColor=${'#ff8800'}></mp-color-field>
        <mp-text-field></mp-text-field>
      </div>
    `);
    const color = group.querySelector('mp-color-field')!;
    const button = swatch(color);
    const input = group.querySelector('mp-text-field')!.shadowRoot!.querySelector('input')!;
    const style = getComputedStyle(button);
    expect(color.attached).to.equal(false);
    for (const radius of [
      style.borderTopLeftRadius,
      style.borderTopRightRadius,
      style.borderBottomLeftRadius,
      style.borderBottomRightRadius,
    ]) {
      expect(parseFloat(radius)).to.be.at.least(20);
    }
    expect(button.getBoundingClientRect().height).to.equal(input.getBoundingClientRect().height);
    expect(button.getBoundingClientRect().height).to.equal(40);
    expect(button.getBoundingClientRect().width).to.equal(56);
    expect(style.borderRightWidth).to.equal('1px');
    expect(style.borderTopColor).to.equal(getComputedStyle(input).borderTopColor);
    const fill = getComputedStyle(button, '::before');
    expect(fill.top).to.equal('4px');
    expect(fill.right).to.equal('4px');
    expect(fill.bottom).to.equal('4px');
    expect(fill.left).to.equal('4px');
    expect(fill.backgroundColor).to.equal('rgb(255, 136, 0)');
  });

  it('attaches with flat right corners, aligned edges and exactly one seam', async () => {
    const group = await fixture<HTMLDivElement>(html`
      <div style="display: flex; align-items: stretch; --divider-color: #888">
        <mp-color-field .attached=${true}></mp-color-field>
        <mp-text-field .flatLeft=${true}></mp-text-field>
      </div>
    `);
    const color = group.querySelector('mp-color-field')!;
    const button = swatch(color);
    const input = group.querySelector('mp-text-field')!.shadowRoot!.querySelector('input')!;
    const style = getComputedStyle(button);
    expect(style.borderTopRightRadius).to.equal('0px');
    expect(style.borderBottomRightRadius).to.equal('0px');
    const a = button.getBoundingClientRect();
    const b = input.getBoundingClientRect();
    for (const edge of ['height', 'top', 'bottom'] as const) {
      expect(a[edge]).to.be.closeTo(b[edge], 0.5);
    }
    expect(a.right).to.be.closeTo(b.left, 0.5);
    expect(
      parseFloat(style.borderRightWidth) + parseFloat(getComputedStyle(input).borderLeftWidth)
    ).to.equal(1);
    expect(style.borderTopColor).to.equal(getComputedStyle(input).borderTopColor);
    color.attached = false;
    await color.updateComplete;
    expect(parseFloat(getComputedStyle(button).borderTopRightRadius)).to.be.at.least(20);
  });

  it('shows the default color on the swatch when no value is set', async () => {
    const el = await fixture<MpColorField>(
      html`<mp-color-field .defaultColor=${'#ff8800'}></mp-color-field>`
    );
    expect(swatch(el).getAttribute('style') ?? '').to.contain('#ff8800');
    // popover closed initially
    expect(colorInput(el)).to.equal(null);
  });

  it('shows the custom value on the swatch when set', async () => {
    const el = await fixture<MpColorField>(
      html`<mp-color-field .value=${'#123456'} .defaultColor=${'#ff8800'}></mp-color-field>`
    );
    expect(swatch(el).getAttribute('style') ?? '').to.contain('#123456');
  });

  describe('popover', () => {
    it('opens on swatch click and closes on a second click', async () => {
      const el = await fixture<MpColorField>(html`<mp-color-field></mp-color-field>`);
      swatch(el).click();
      await el.updateComplete;
      expect(colorInput(el)).to.not.equal(null);
      expect(swatch(el).getAttribute('aria-expanded')).to.equal('true');

      swatch(el).click();
      await el.updateComplete;
      expect(colorInput(el)).to.equal(null);
    });

    it('seeds the input with the custom value hex', async () => {
      const el = await fixture<MpColorField>(
        html`<mp-color-field .value=${'#abcdef'}></mp-color-field>`
      );
      swatch(el).click();
      await el.updateComplete;
      expect(colorInput(el)!.value).to.equal('#abcdef');
    });

    it('resolves the default color to a hex to seed the input when unset', async () => {
      const el = await fixture<MpColorField>(
        html`<mp-color-field .defaultColor=${'rgb(255, 136, 0)'}></mp-color-field>`
      );
      swatch(el).click();
      await el.updateComplete;
      // rgb(255,136,0) -> #ff8800
      expect(colorInput(el)!.value).to.equal('#ff8800');
    });

    it('renders a visibly wide color preview even on the default color (no reset button)', async () => {
      const el = await fixture<MpColorField>(
        html`<mp-color-field .defaultColor=${'#ff8800'}></mp-color-field>`
      );
      swatch(el).click();
      await el.updateComplete;
      // No custom value -> no reset button; the popover must still give the color
      // input a real width so the preview is visible (regression: it collapsed to
      // a sliver in a shrink-to-fit popover).
      expect(el.shadowRoot!.querySelector('.reset')).to.equal(null);
      expect(colorInput(el)!.offsetWidth).to.be.greaterThan(100);
    });

    it('resolves a var()-based default color via the browser', async () => {
      const el = await fixture<MpColorField>(
        html`<mp-color-field .defaultColor=${'var(--nope, #010203)'}></mp-color-field>`
      );
      swatch(el).click();
      await el.updateComplete;
      expect(colorInput(el)!.value).to.equal('#010203');
    });

    it('emits value-changed with the picked hex on input', async () => {
      const el = await fixture<MpColorField>(html`<mp-color-field></mp-color-field>`);
      swatch(el).click();
      await el.updateComplete;
      const input = colorInput(el)!;
      input.value = '#00ff00';
      const listener = oncePromise(el, 'value-changed');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const ev = await listener;
      expect((ev.detail as { value: string }).value).to.equal('#00ff00');
    });

    it('hides the reset button when no custom color is set', async () => {
      const el = await fixture<MpColorField>(html`<mp-color-field></mp-color-field>`);
      swatch(el).click();
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.reset')).to.equal(null);
    });

    it('shows the reset button when a color is set, and resetting emits undefined + closes', async () => {
      const el = await fixture<MpColorField>(
        html`<mp-color-field .value=${'#123456'}></mp-color-field>`
      );
      swatch(el).click();
      await el.updateComplete;
      const reset = el.shadowRoot!.querySelector('.reset') as HTMLButtonElement;
      expect(reset).to.not.equal(null);
      const listener = oncePromise(el, 'value-changed');
      reset.click();
      const ev = await listener;
      expect((ev.detail as { value: string | undefined }).value).to.equal(undefined);
      await el.updateComplete;
      expect(colorInput(el)).to.equal(null); // popover closed
    });
  });

  describe('_onDocClick (outside-click handler)', () => {
    it('closes on a real document click outside the element', async () => {
      const el = await fixture<MpColorField>(html`<mp-color-field></mp-color-field>`);
      swatch(el).click();
      await el.updateComplete;
      expect(colorInput(el)).to.not.equal(null);
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await el.updateComplete;
      expect(colorInput(el)).to.equal(null);
    });

    it('stays open when the document click is inside the element', async () => {
      const el = await fixture<MpColorField>(html`<mp-color-field></mp-color-field>`);
      swatch(el).click();
      await el.updateComplete;
      (el as unknown as { _onDocClick: (e: unknown) => void })._onDocClick({
        composedPath: () => [el],
      });
      await el.updateComplete;
      expect(colorInput(el)).to.not.equal(null);
    });

    it('does nothing when not open', async () => {
      const el = await fixture<MpColorField>(html`<mp-color-field></mp-color-field>`);
      (el as unknown as { _onDocClick: (e: unknown) => void })._onDocClick({
        composedPath: () => [document.body],
      });
      await el.updateComplete;
      expect(colorInput(el)).to.equal(null);
    });
  });
});
