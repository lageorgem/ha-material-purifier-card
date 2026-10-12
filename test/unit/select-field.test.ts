import { fixture, html, expect } from '@open-wc/testing';
import '../../src/editors/select-field';
import '../../src/editors/entity-picker';
import '../../src/editors/text-field';
import type { MpSelectField } from '../../src/editors/select-field';

const options = [
  { value: 'percent', label: 'Percent' },
  { value: 'level', label: 'Level' },
  { value: 'rpm', label: 'RPM' },
];
const trigger = (el: MpSelectField) => el.shadowRoot!.querySelector<HTMLButtonElement>('.trigger')!;
const menu = (el: MpSelectField) => el.shadowRoot!.querySelector('[role=listbox]');
const rows = (el: MpSelectField) => [
  ...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role=option]'),
];
async function mount(value: string | undefined = 'percent'): Promise<MpSelectField> {
  return fixture<MpSelectField>(
    html`<mp-select-field
      label="Display"
      .value=${value}
      .options=${options}
      placeholder="Choose display"
      helper="Display unit"
    ></mp-select-field>`
  );
}
async function key(el: MpSelectField, key: string): Promise<void> {
  trigger(el).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  await el.updateComplete;
}
async function open(el: MpSelectField): Promise<void> {
  trigger(el).click();
  await el.updateComplete;
}

describe('mp-select-field', () => {
  it('renders the accessible label, value label, helper and 40px shell', async () => {
    const el = await mount();
    expect(trigger(el).getAttribute('aria-label')).to.equal('Display');
    expect(el.shadowRoot!.querySelector('label')).to.equal(null);
    expect(trigger(el).textContent).to.contain('Percent');
    expect(trigger(el).getAttribute('aria-describedby')).to.equal('helper');
    expect(getComputedStyle(trigger(el)).height).to.equal('40px');
  });
  it('opens on click with linked listbox and selected check', async () => {
    const el = await mount();
    await open(el);
    expect(trigger(el).getAttribute('role')).to.equal('combobox');
    expect(trigger(el).getAttribute('aria-expanded')).to.equal('true');
    expect(trigger(el).getAttribute('aria-controls')).to.equal(menu(el)!.id);
    expect(rows(el).map((row) => row.textContent!.trim())).to.deep.equal([
      'Percent',
      'Level',
      'RPM',
    ]);
    expect(rows(el)[0].getAttribute('aria-selected')).to.equal('true');
    expect(rows(el)[0].querySelector('.check')).to.not.equal(null);
  });
  it('selects, emits a bubbling composed event and returns focus', async () => {
    const el = await mount();
    let event: CustomEvent<{ value: string }> | undefined;
    el.addEventListener('value-changed', (e) => {
      event = e as CustomEvent<{ value: string }>;
    });
    await open(el);
    rows(el)[1].click();
    await el.updateComplete;
    expect(event!.detail).to.deep.equal({ value: 'level' });
    expect(event!.bubbles).to.equal(true);
    expect(event!.composed).to.equal(true);
    expect(el.value).to.equal('level');
    expect(menu(el)).to.equal(null);
    expect(el.shadowRoot!.activeElement).to.equal(trigger(el));
  });
  for (const openingKey of ['Enter', ' ', 'ArrowDown']) {
    it(`opens with ${openingKey}, navigates with arrows and selects with Enter`, async () => {
      const el = await mount();
      await key(el, openingKey);
      expect(menu(el)).to.not.equal(null);
      await key(el, 'ArrowDown');
      expect(trigger(el).getAttribute('aria-activedescendant')).to.equal(rows(el)[1].id);
      await key(el, 'ArrowUp');
      await key(el, 'ArrowDown');
      await key(el, 'Enter');
      expect(el.value).to.equal('level');
      expect(menu(el)).to.equal(null);
    });
  }
  it('Escape closes without selection and returns focus', async () => {
    const el = await mount();
    await open(el);
    await key(el, 'ArrowDown');
    await key(el, 'Escape');
    expect(el.value).to.equal('percent');
    expect(menu(el)).to.equal(null);
    expect(el.shadowRoot!.activeElement).to.equal(trigger(el));
  });
  it('ignores click and keyboard while disabled, and closes when disabled', async () => {
    const el = await mount();
    await open(el);
    el.disabled = true;
    await el.updateComplete;
    await open(el);
    await key(el, 'ArrowDown');
    expect(trigger(el).disabled).to.equal(true);
    expect(menu(el)).to.equal(null);
  });
  it('closes on outside click and returns focus', async () => {
    const el = await mount();
    await open(el);
    document.body.click();
    await el.updateComplete;
    expect(menu(el)).to.equal(null);
    expect(el.shadowRoot!.activeElement).to.equal(trigger(el));
  });
  it('uses the placeholder for missing and unknown values', async () => {
    const el = await mount(undefined);
    el.value = undefined;
    await el.updateComplete;
    expect(trigger(el).textContent).to.contain('Choose display');
    el.value = 'unknown';
    await el.updateComplete;
    expect(trigger(el).textContent).to.contain('Choose display');
  });
  it('uses the label inline when no value or placeholder is supplied', async () => {
    const el = await fixture<MpSelectField>(
      html`<mp-select-field label="Display"></mp-select-field>`
    );
    expect(el.shadowRoot!.querySelector('.text')!.textContent).to.equal('Display');
    expect(el.shadowRoot!.querySelector('.text')!.classList.contains('muted')).to.equal(true);
    await open(el);
    expect(menu(el)!.getAttribute('aria-label')).to.equal('Display');
  });
  it('matches the text-field shell and inline label typography in the same page', async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div
        style="--md-sys-shape-corner-full: 28px; --md-sys-color-surface-container-high: rgb(30, 40, 50); --md-sys-color-outline-variant: rgb(60, 70, 80); --md-sys-typescale-body-medium-size: 18px"
      >
        <mp-select-field label="Display"></mp-select-field>
        <mp-text-field label="Display"></mp-text-field>
      </div>
    `);
    const select = wrapper.querySelector<MpSelectField>('mp-select-field')!;
    const input = wrapper.querySelector('mp-text-field')!.shadowRoot!.querySelector('input')!;
    const selectStyle = getComputedStyle(trigger(select));
    const inputStyle = getComputedStyle(input);
    for (const property of [
      'height',
      'borderRadius',
      'paddingLeft',
      'backgroundColor',
      'borderColor',
      'fontFamily',
      'fontSize',
      'paddingTop',
      'paddingBottom',
    ] as const) {
      expect(selectStyle[property], property).to.equal(inputStyle[property]);
    }
    expect(getComputedStyle(select.shadowRoot!.querySelector('.text')!).fontSize).to.equal(
      inputStyle.fontSize
    );
    const placeholderStyle = getComputedStyle(input, '::placeholder');
    expect(getComputedStyle(select.shadowRoot!.querySelector('.text')!).color).to.equal(
      placeholderStyle.color
    );
  });
  it('handles empty options without emitting a value', async () => {
    const el = await mount();
    el.options = [];
    await el.updateComplete;
    let changes = 0;
    el.addEventListener('value-changed', () => changes++);
    await key(el, 'ArrowDown');
    await key(el, 'Enter');
    expect(changes).to.equal(0);
    expect(el.shadowRoot!.querySelector('.empty')).to.not.equal(null);
  });
  it('matches entity-picker field radius in the same page, including theme overrides', async () => {
    const wrapper = await fixture<HTMLDivElement>(
      html`<div style="--md-sys-shape-corner-full: 28px">
        <mp-select-field></mp-select-field><mp-entity-picker></mp-entity-picker>
      </div>`
    );
    const select = wrapper.querySelector<MpSelectField>('mp-select-field')!;
    const picker = wrapper.querySelector('mp-entity-picker')!;
    expect(getComputedStyle(trigger(select)).borderRadius).to.equal(
      getComputedStyle(picker.shadowRoot!.querySelector('.trigger')!).borderRadius
    );
  });
});
