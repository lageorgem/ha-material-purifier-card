import { fixture, html, expect } from '@open-wc/testing';
import '../../src/editors/text-field';
import type { MpTextField } from '../../src/editors/text-field';

/**
 * Mount mp-text-field.
 * @param value initial value
 * @param label placeholder/label
 */
async function mount(value = '', label = 'Title'): Promise<MpTextField> {
  const el = await fixture<MpTextField>(
    html`<mp-text-field .value=${value} label=${label}></mp-text-field>`
  );
  await el.updateComplete;
  return el;
}

/** The native input. */
function input(el: MpTextField): HTMLInputElement {
  return el.shadowRoot!.querySelector('input') as HTMLInputElement;
}

describe('mp-text-field', () => {
  it('renders a native input seeded with the value and label as placeholder', async () => {
    const el = await mount('Bedroom', 'Custom title');
    expect(input(el)).to.not.equal(null);
    expect(input(el).value).to.equal('Bedroom');
    expect(input(el).type).to.equal('text');
    expect(input(el).hasAttribute('min')).to.equal(false);
    expect(input(el).placeholder).to.equal('Custom title');
    expect(input(el).getAttribute('aria-label')).to.equal('Custom title');
  });

  it('forwards number constraints and an independent placeholder', async () => {
    const el = await fixture<MpTextField>(
      html`<mp-text-field
        type="number"
        label="From"
        placeholder="—"
        min="0"
        max="999"
        step="any"
      ></mp-text-field>`
    );
    expect(input(el).type).to.equal('number');
    expect(input(el).placeholder).to.equal('—');
    expect(input(el).getAttribute('aria-label')).to.equal('From');
    expect(input(el).min).to.equal('0');
    expect(input(el).max).to.equal('999');
    expect(input(el).step).to.equal('any');
    expect(input(el).value).to.equal('');
  });

  it('coerces a nullish value to an empty string', async () => {
    const el = await fixture<MpTextField>(
      html`<mp-text-field .value=${undefined as any}></mp-text-field>`
    );
    await el.updateComplete;
    expect(input(el).value).to.equal('');
  });

  it('emits value-changed (bubbles+composed) with the typed value on input', async () => {
    const el = await mount('');
    const p = new Promise<CustomEvent>((res) =>
      el.addEventListener('value-changed', (e) => res(e as CustomEvent), { once: true })
    );
    const i = input(el);
    i.value = 'Kitchen';
    i.dispatchEvent(new Event('input'));
    const ev = await p;
    expect(ev.detail.value).to.equal('Kitchen');
    expect(ev.bubbles).to.be.true;
    expect(ev.composed).to.be.true;
  });

  it('emits an empty string when cleared', async () => {
    const el = await mount('Kitchen');
    const p = new Promise<string>((res) =>
      el.addEventListener('value-changed', (e) => res((e as CustomEvent).detail.value), {
        once: true,
      })
    );
    const i = input(el);
    i.value = '';
    i.dispatchEvent(new Event('input'));
    expect(await p).to.equal('');
  });

  it('has no flat-left class by default and adds it when flatLeft is set', async () => {
    const plain = await mount();
    expect(input(plain).classList.contains('flat-left')).to.be.false;
    const flat = await fixture<MpTextField>(
      html`<mp-text-field .flatLeft=${true}></mp-text-field>`
    );
    await flat.updateComplete;
    expect(input(flat).classList.contains('flat-left')).to.be.true;
  });
});
