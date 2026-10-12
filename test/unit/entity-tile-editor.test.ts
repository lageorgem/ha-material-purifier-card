import { fixture, html, expect } from '@open-wc/testing';
import { makeHass, entityState, captureEvents } from '../helpers';
import '../../src/editors/entity-tile-editor';
import type { MpEntityTileEditor } from '../../src/editors/entity-tile-editor';

function emitValueChanged(node: Element, value: unknown): void {
  node.dispatchEvent(
    new CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true })
  );
}

describe('mp-entity-tile-editor', () => {
  /** Mount the entity-tile editor. */
  async function mount(
    feature: any,
    states: Record<string, any> = {}
  ): Promise<MpEntityTileEditor> {
    const hass = makeHass(states);
    return fixture<MpEntityTileEditor>(
      html`<mp-entity-tile-editor .hass=${hass} .feature=${feature}></mp-entity-tile-editor>`
    );
  }

  describe('_display (layout resolution)', () => {
    it('defaults to tile when display is unset', async () => {
      const el = await mount({ type: 'entity-tile', entity: 'sensor.x' });
      expect((el as any)._display).to.equal('tile');
    });

    it('uses an explicit icon display', async () => {
      const el = await mount({ type: 'entity-tile', entity: 'sensor.x', display: 'icon' });
      expect((el as any)._display).to.equal('icon');
    });

    it('uses an explicit tile display', async () => {
      const el = await mount({
        type: 'entity-tile',
        entity: 'sensor.x',
        display: 'tile',
      });
      expect((el as any)._display).to.equal('tile');
    });
  });

  it('renders the Icon/Tile display toggle and a change emits {display}', async () => {
    const el = await mount({ type: 'entity-tile', entity: 'sensor.x', display: 'icon' });
    const toggle = el.shadowRoot!.querySelector('mp-display-toggle') as any;
    expect(toggle).to.not.equal(null);
    expect(toggle.value).to.equal('icon');
    expect(toggle.options.map((o: any) => o.value)).to.deep.equal(['icon', 'tile']);
    const cap = captureEvents('feature-changed');
    emitValueChanged(toggle, 'tile');
    cap.stop();
    const f = (cap.events[0].detail as any).feature;
    expect(f.display).to.equal('tile');
  });

  it('renders a width field with the tile default (50) and emits width changes', async () => {
    const el = await mount({ type: 'entity-tile', entity: 'sensor.x' });
    const wf = el.shadowRoot!.querySelector('mp-width-field') as any;
    expect(wf).to.not.equal(null);
    expect(wf.default).to.equal(50);
    const cap = captureEvents('feature-changed');
    wf.dispatchEvent(
      new CustomEvent('width-changed', { detail: { value: 30 }, bubbles: true, composed: true })
    );
    cap.stop();
    expect((cap.events[0].detail as any).feature.width).to.equal(30);
  });

  it('uses the styled entity picker; its value drives the entity (falls back to "")', async () => {
    const el = await mount({ type: 'entity-tile', entity: '' });
    const picker = el.shadowRoot!.querySelector('mp-entity-picker') as any;
    expect(picker).to.not.equal(null);
    expect(picker.value).to.equal('');
    const cap = captureEvents('feature-changed');
    emitValueChanged(picker, 'switch.y');
    cap.stop();
    expect((cap.events[0].detail as any).feature.entity).to.equal('switch.y');
  });

  it('entity picker value falls back to "" when the feature has no entity', async () => {
    const el = await mount({ type: 'entity-tile' });
    const picker = el.shadowRoot!.querySelector('mp-entity-picker') as any;
    expect(picker.value).to.equal('');
  });

  it('title field emits {name} and prunes an empty title', async () => {
    const el = await mount({ type: 'entity-tile', entity: 'sensor.x', width: 50 });
    const tf = el.shadowRoot!.querySelector('.title-group mp-text-field') as Element;
    const cap = captureEvents('feature-changed');
    emitValueChanged(tf, 'My tile');
    expect((cap.events[0].detail as any).feature.name).to.equal('My tile');
    emitValueChanged(tf, '');
    cap.stop();
    const f = (cap.events[1].detail as any).feature;
    expect('name' in f).to.be.false;
    expect(f.width).to.equal(50); // untouched
  });

  it('icon field previews the entity icon, keeps "no icon" ("") and prunes undefined', async () => {
    const el = await mount(
      { type: 'entity-tile', entity: 'switch.x' },
      { 'switch.x': entityState('switch.x', 'on', { icon: 'mdi:lamp' }) }
    );
    const field = el.shadowRoot!.querySelector('mp-icon-field') as any;
    expect(field.defaultIcon).to.equal('mdi:lamp');

    const cap1 = captureEvents('feature-changed');
    emitValueChanged(field, 'mdi:home');
    cap1.stop();
    expect((cap1.events[0].detail as any).feature.icon).to.equal('mdi:home');

    const cap2 = captureEvents('feature-changed');
    emitValueChanged(field, ''); // '' = explicit "no icon" (kept)
    cap2.stop();
    expect((cap2.events[0].detail as any).feature.icon).to.equal('');

    const cap3 = captureEvents('feature-changed');
    emitValueChanged(field, undefined); // undefined = revert to default (pruned)
    cap3.stop();
    expect('icon' in (cap3.events[0].detail as any).feature).to.be.false;
  });

  describe('color picker (tile display only)', () => {
    it('attaches the swatch to the title with matching height and aligned edges', async () => {
      const el = await mount({ type: 'entity-tile', entity: 'sensor.x', display: 'tile' });
      const group = el.shadowRoot!.querySelector('.title-group')!;
      const color = group.querySelector('mp-color-field')!;
      const text = group.querySelector('mp-text-field')!;
      await Promise.all([color.updateComplete, text.updateComplete]);
      expect(color.attached).to.equal(true);
      expect(text.flatLeft).to.equal(true);
      expect(getComputedStyle(group).alignItems).to.equal('stretch');
      const a = color.shadowRoot!.querySelector('button')!.getBoundingClientRect();
      const b = text.shadowRoot!.querySelector('input')!.getBoundingClientRect();
      for (const edge of ['height', 'top', 'bottom'] as const) {
        expect(a[edge]).to.be.closeTo(b[edge], 0.5);
      }
    });

    it('is shown in tile display and its value drives {color}', async () => {
      const el = await mount({ type: 'entity-tile', entity: 'sensor.x', display: 'tile' });
      const cf = el.shadowRoot!.querySelector('.title-group mp-color-field') as Element;
      expect(cf).to.not.equal(null);
      const cap = captureEvents('feature-changed');
      emitValueChanged(cf, '#ff0000');
      cap.stop();
      expect((cap.events[0].detail as any).feature.color).to.equal('#ff0000');
    });

    it('is hidden in icon display', async () => {
      const el = await mount({ type: 'entity-tile', entity: 'sensor.x', display: 'icon' });
      expect(el.shadowRoot!.querySelector('mp-color-field')).to.equal(null);
    });

    it('prunes the color when reset to default', async () => {
      const el = await mount({
        type: 'entity-tile',
        entity: 'sensor.x',
        display: 'tile',
        color: '#ff0000',
      });
      const cf = el.shadowRoot!.querySelector('.title-group mp-color-field') as any;
      expect(cf.value).to.equal('#ff0000');
      const cap = captureEvents('feature-changed');
      emitValueChanged(cf, undefined);
      cap.stop();
      expect('color' in (cap.events[0].detail as any).feature).to.be.false;
    });
  });

  it('_patch preserves an existing tap_action set in YAML', async () => {
    const el = await mount({
      type: 'entity-tile',
      entity: 'sensor.x',
      tap_action: { action: 'more-info' },
    });
    const cap = captureEvents('feature-changed');
    emitValueChanged(el.shadowRoot!.querySelector('mp-entity-picker')!, 'sensor.y');
    cap.stop();
    expect((cap.events[0].detail as any).feature.tap_action).to.deep.equal({ action: 'more-info' });
  });
});
