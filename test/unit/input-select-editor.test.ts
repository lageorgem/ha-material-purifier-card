import { fixture, html, expect } from '@open-wc/testing';
import { makeHass, entityState, captureEvents } from '../helpers';
import '../../src/editors/input-select-editor';
import type { MpInputSelectEditor } from '../../src/editors/input-select-editor';
import type { InputSelectFeatureConfig } from '../../src/types';

function emitValueChanged(node: Element, value: unknown): void {
  node.dispatchEvent(
    new CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true })
  );
}

describe('mp-input-select-editor', () => {
  /** Mount the input-select editor. */
  async function mount(
    feature: InputSelectFeatureConfig,
    states: Record<string, any> = {}
  ): Promise<MpInputSelectEditor> {
    const hass = makeHass(states);
    return fixture<MpInputSelectEditor>(
      html`<mp-input-select-editor .hass=${hass} .feature=${feature}></mp-input-select-editor>`
    );
  }

  const withOptions = (entity = 'input_select.mode') =>
    mount(
      { type: 'input-select', entity },
      {
        [entity]: entityState(entity, 'home', { options: ['home', 'away', 'sleep'] }),
      }
    );

  it('_values() reads options from the bound entity', async () => {
    const el = await withOptions();
    expect((el as any)._values()).to.deep.equal(['home', 'away', 'sleep']);
  });

  it('_values() empty -> hint shown', async () => {
    const el = await mount({ type: 'input-select', entity: '' });
    expect((el as any)._values()).to.deep.equal([]);
    expect(el.shadowRoot!.querySelector('p.hint')).to.not.equal(null);
  });

  it('entity-picker value falls back to "" when feature.entity is undefined', async () => {
    const el = await mount({ type: 'input-select' } as InputSelectFeatureConfig);
    const picker = el.shadowRoot!.querySelector('mp-entity-picker') as any;
    expect(picker.value).to.equal('');
  });

  it('renders an option row per value', async () => {
    const el = await withOptions();
    expect(el.shadowRoot!.querySelectorAll('.opt').length).to.equal(3);
  });

  describe('reordering', () => {
    it('_orderedValues defaults to the natural option order', async () => {
      const el = await withOptions();
      expect((el as any)._orderedValues()).to.deep.equal(['home', 'away', 'sleep']);
    });

    it('_orderedValues reflects a preset feature.order', async () => {
      const el = await mount(
        { type: 'input-select', entity: 'input_select.mode', order: ['sleep', 'home'] },
        {
          'input_select.mode': entityState('input_select.mode', 'home', {
            options: ['home', 'away', 'sleep'],
          }),
        }
      );
      expect((el as any)._orderedValues()).to.deep.equal(['sleep', 'home', 'away']);
    });

    it('_moveOption (0 → 2) emits feature-changed with the reordered order list', async () => {
      const el = await withOptions();
      const cap = captureEvents('feature-changed');
      (el as any)._moveOption(
        new CustomEvent('item-moved', { detail: { oldIndex: 0, newIndex: 2 } })
      );
      cap.stop();
      expect((cap.events[0].detail as any).feature.order).to.deep.equal(['away', 'sleep', 'home']);
    });

    it('_moveOption stops the event so it cannot reach the outer features sortable', async () => {
      const el = await withOptions();
      const ev = new CustomEvent('item-moved', { detail: { oldIndex: 0, newIndex: 1 } });
      let stopped = false;
      ev.stopPropagation = () => {
        stopped = true;
      };
      (el as any)._moveOption(ev);
      expect(stopped).to.be.true;
    });
  });

  it('entity-picker change -> feature-changed {entity}', async () => {
    const el = await mount({ type: 'input-select', entity: '' });
    const cap = captureEvents('feature-changed');
    emitValueChanged(el.shadowRoot!.querySelector('mp-entity-picker')!, 'input_select.x');
    cap.stop();
    expect((cap.events[0].detail as any).feature.entity).to.equal('input_select.x');
  });

  it('label input non-empty -> feature-changed {label}', async () => {
    const el = await withOptions();
    const cap = captureEvents('feature-changed');
    const tf = el.shadowRoot!.querySelector('mp-text-field') as Element; // first = row label
    emitValueChanged(tf, 'Mode');
    cap.stop();
    expect((cap.events[0].detail as any).feature.label).to.equal('Mode');
  });

  it('label input empty -> {label: undefined}', async () => {
    const el = await withOptions();
    const cap = captureEvents('feature-changed');
    const tf = el.shadowRoot!.querySelector('mp-text-field') as Element;
    emitValueChanged(tf, '');
    cap.stop();
    expect((cap.events[0].detail as any).feature.label).to.equal(undefined);
  });

  it('display toggle change -> {display}', async () => {
    const el = await withOptions();
    const cap = captureEvents('feature-changed');
    emitValueChanged(el.shadowRoot!.querySelector('mp-display-toggle')!, 'dropdown');
    cap.stop();
    expect((cap.events[0].detail as any).feature.display).to.equal('dropdown');
  });

  it('width change -> {width}', async () => {
    const el = await withOptions();
    const cap = captureEvents('feature-changed');
    el.shadowRoot!.querySelector('mp-width-field')!.dispatchEvent(
      new CustomEvent('width-changed', { detail: { value: 4 }, bubbles: true, composed: true })
    );
    cap.stop();
    expect((cap.events[0].detail as any).feature.width).to.equal(4);
  });

  it('_override finds existing override', async () => {
    const el = await mount(
      {
        type: 'input-select',
        entity: 'input_select.mode',
        options: [{ value: 'home', label: 'H' }],
      },
      { 'input_select.mode': entityState('input_select.mode', 'home', { options: ['home'] }) }
    );
    expect((el as any)._override('home')).to.deep.equal({ value: 'home', label: 'H' });
  });

  describe('_setOverride', () => {
    it('adds a label override', async () => {
      const el = await withOptions();
      const cap = captureEvents('feature-changed');
      (el as any)._setOverride('home', { label: 'Home!' });
      cap.stop();
      expect((cap.events[0].detail as any).feature.options).to.deep.equal([
        { value: 'home', label: 'Home!' },
      ]);
    });

    it('label="" prunes new override', async () => {
      const el = await withOptions();
      const cap = captureEvents('feature-changed');
      (el as any)._setOverride('home', { label: '' });
      cap.stop();
      expect((cap.events[0].detail as any).feature.options).to.deep.equal([]);
    });

    it('updates an existing override and keeps it meaningful', async () => {
      const el = await mount(
        {
          type: 'input-select',
          entity: 'input_select.mode',
          options: [{ value: 'away', label: 'Away' }],
        },
        { 'input_select.mode': entityState('input_select.mode', 'home', { options: ['away'] }) }
      );
      const cap = captureEvents('feature-changed');
      (el as any)._setOverride('away', { icon: 'mdi:home' });
      cap.stop();
      expect((cap.events[0].detail as any).feature.options).to.deep.equal([
        { value: 'away', label: 'Away', icon: 'mdi:home' },
      ]);
    });

    it('keeps icon="" (no icon) but prunes on icon=undefined (revert to default)', async () => {
      const el = await mount(
        {
          type: 'input-select',
          entity: 'input_select.mode',
          options: [{ value: 'away', icon: 'mdi:home' }],
        },
        { 'input_select.mode': entityState('input_select.mode', 'home', { options: ['away'] }) }
      );
      const cap = captureEvents('feature-changed');
      (el as any)._setOverride('away', { icon: '' });
      expect((cap.events[0].detail as any).feature.options).to.deep.equal([
        { value: 'away', icon: '' },
      ]);
      (el as any)._setOverride('away', { icon: undefined });
      cap.stop();
      expect((cap.events[1].detail as any).feature.options).to.deep.equal([]);
    });

    it('hide toggle on/off', async () => {
      const el = await withOptions();
      const cap = captureEvents('feature-changed');
      (el as any)._setOverride('sleep', { hide: true });
      cap.stop();
      expect((cap.events[0].detail as any).feature.options).to.deep.equal([
        { value: 'sleep', hide: true },
      ]);
    });

    it('option label/icon/hide controls in a rendered row drive _setOverride', async () => {
      const el = await withOptions();
      // per-option label fields are within .opt; first .opt label field
      const optTf = el.shadowRoot!.querySelectorAll('.opt mp-text-field')[0] as Element;
      const cap1 = captureEvents('feature-changed');
      emitValueChanged(optTf, 'Casa');
      cap1.stop();
      expect((cap1.events[0].detail as any).feature.options[0].label).to.equal('Casa');

      const optIcon = el.shadowRoot!.querySelector('.opt mp-icon-field') as Element;
      const cap2 = captureEvents('feature-changed');
      emitValueChanged(optIcon, 'mdi:home');
      cap2.stop();
      expect((cap2.events[0].detail as any).feature.options[0].icon).to.equal('mdi:home');

      const optIcon2 = el.shadowRoot!.querySelector('.opt mp-icon-field') as Element;
      const cap3 = captureEvents('feature-changed');
      emitValueChanged(optIcon2, undefined);
      cap3.stop();
      expect((cap3.events[0].detail as any).feature.options).to.deep.equal([]);

      const hideBtn = el.shadowRoot!.querySelector('.opt .opt-hide') as HTMLButtonElement;
      const cap4 = captureEvents('feature-changed');
      hideBtn.click();
      cap4.stop();
      expect((cap4.events[0].detail as any).feature.options[0].hide).to.equal(true);
    });

    it('renders an already-hidden option', async () => {
      const el = await mount(
        {
          type: 'input-select',
          entity: 'input_select.mode',
          options: [{ value: 'home', hide: true }],
        },
        { 'input_select.mode': entityState('input_select.mode', 'home', { options: ['home'] }) }
      );
      expect(el.shadowRoot!.querySelector('.opt .opt-hide')!.classList.contains('on')).to.be.true;
    });

    it('keeps a color override and prunes it when reset', async () => {
      const el = await withOptions();
      const cap1 = captureEvents('feature-changed');
      (el as any)._setOverride('home', { color: '#111111' });
      cap1.stop();
      expect((cap1.events[0].detail as any).feature.options).to.deep.equal([
        { value: 'home', color: '#111111' },
      ]);
      const el2 = await mount(
        {
          type: 'input-select',
          entity: 'input_select.mode',
          options: [{ value: 'home', color: '#111111' }],
        },
        { 'input_select.mode': entityState('input_select.mode', 'home', { options: ['home'] }) }
      );
      const cap2 = captureEvents('feature-changed');
      (el2 as any)._setOverride('home', { color: undefined });
      cap2.stop();
      expect((cap2.events[0].detail as any).feature.options).to.deep.equal([]);
    });
  });

  describe('color picker (tile display only)', () => {
    it('hides the color field in icon/dropdown display', async () => {
      const el = await withOptions();
      expect(el.shadowRoot!.querySelector('.opt mp-color-field')).to.equal(null);
    });

    it('shows the color field in tile display and its value drives _setOverride', async () => {
      const el = await mount(
        { type: 'input-select', entity: 'input_select.mode', display: 'tile' },
        { 'input_select.mode': entityState('input_select.mode', 'home', { options: ['home'] }) }
      );
      const cf = el.shadowRoot!.querySelector('.opt mp-color-field') as Element;
      expect(cf).to.not.equal(null);
      const cap = captureEvents('feature-changed');
      emitValueChanged(cf, '#222222');
      cap.stop();
      expect((cap.events[0].detail as any).feature.options[0]).to.deep.include({
        color: '#222222',
      });
    });

    it('seeds the color field with an existing override color', async () => {
      const el = await mount(
        {
          type: 'input-select',
          entity: 'input_select.mode',
          display: 'tile',
          options: [{ value: 'home', color: '#654321' }],
        },
        { 'input_select.mode': entityState('input_select.mode', 'home', { options: ['home'] }) }
      );
      const cf = el.shadowRoot!.querySelector('.opt mp-color-field') as any;
      expect(cf.value).to.equal('#654321');
    });
  });
});
