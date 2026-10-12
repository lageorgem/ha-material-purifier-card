import { fixture, html, expect } from '@open-wc/testing';
import { makeHass, entityState, captureEvents } from '../helpers';
import '../../src/editors/entity-list-editor';
import type { MpEntityListEditor } from '../../src/editors/entity-list-editor';

function emitValueChanged(node: Element, value: unknown): void {
  node.dispatchEvent(
    new CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true })
  );
}

describe('mp-entity-list-editor', () => {
  /** Mount the entity-list editor. */
  async function mount(opts: {
    feature: any;
    itemsKey?: 'entities' | 'items';
    showDisplay?: boolean;
  }): Promise<MpEntityListEditor> {
    const hass = makeHass({});
    const { feature, itemsKey = 'entities', showDisplay = false } = opts;
    return fixture<MpEntityListEditor>(
      html`<mp-entity-list-editor
        .hass=${hass}
        .feature=${feature}
        itemsKey=${itemsKey}
        .showDisplay=${showDisplay}
        .includeDomains=${['switch']}
      ></mp-entity-list-editor>`
    );
  }

  it('_items reads from itemsKey "entities"', async () => {
    const el = await mount({
      feature: { type: 'switch-group', entities: [{ entity: 'switch.a' }] },
      itemsKey: 'entities',
    });
    expect((el as any)._items).to.deep.equal([{ entity: 'switch.a' }]);
  });

  it('_items reads from itemsKey "items"', async () => {
    const el = await mount({
      feature: { type: 'button-list', items: [{ entity: 'button.b' }] },
      itemsKey: 'items',
    });
    expect((el as any)._items).to.deep.equal([{ entity: 'button.b' }]);
  });

  it('_items defaults to [] when missing', async () => {
    const el = await mount({ feature: { type: 'switch-list' }, itemsKey: 'entities' });
    expect((el as any)._items).to.deep.equal([]);
  });

  it('item entity picker value falls back to "" when item.entity is undefined', async () => {
    const el = await mount({
      feature: { type: 'switch-group', entities: [{}] },
    });
    const picker = el.shadowRoot!.querySelector('.item mp-entity-picker') as any;
    expect(picker.value).to.equal('');
  });

  it('showDisplay true shows the display toggle', async () => {
    const el = await mount({
      feature: { type: 'switch-group', entities: [] },
      showDisplay: true,
    });
    expect(el.shadowRoot!.querySelector('mp-display-toggle')).to.not.equal(null);
  });

  it('showDisplay false hides the display toggle', async () => {
    const el = await mount({ feature: { type: 'switch-list', entities: [] }, showDisplay: false });
    expect(el.shadowRoot!.querySelector('mp-display-toggle')).to.equal(null);
  });

  it('display toggle change -> feature-changed {display}', async () => {
    const el = await mount({
      feature: { type: 'switch-group', entities: [], display: 'icons' },
      showDisplay: true,
    });
    const cap = captureEvents('feature-changed');
    emitValueChanged(el.shadowRoot!.querySelector('mp-display-toggle')!, 'dropdown');
    cap.stop();
    expect((cap.events[0].detail as any).feature.display).to.equal('dropdown');
  });

  it('label input -> {label} (empty -> undefined)', async () => {
    const el = await mount({ feature: { type: 'switch-group', entities: [] } });
    const cap = captureEvents('feature-changed');
    const tf = el.shadowRoot!.querySelector('mp-text-field') as Element; // row label
    emitValueChanged(tf, 'Lights');
    expect((cap.events[0].detail as any).feature.label).to.equal('Lights');
    emitValueChanged(tf, '');
    cap.stop();
    expect((cap.events[1].detail as any).feature.label).to.equal(undefined);
  });

  it('width change -> {width}', async () => {
    const el = await mount({ feature: { type: 'switch-group', entities: [] } });
    const cap = captureEvents('feature-changed');
    el.shadowRoot!.querySelector('mp-width-field')!.dispatchEvent(
      new CustomEvent('width-changed', { detail: { value: 8 }, bubbles: true, composed: true })
    );
    cap.stop();
    expect((cap.events[0].detail as any).feature.width).to.equal(8);
  });

  it('_addItem appends {entity:""} using the right itemsKey', async () => {
    const el = await mount({
      feature: { type: 'button-list', items: [{ entity: 'button.a' }] },
      itemsKey: 'items',
    });
    const cap = captureEvents('feature-changed');
    (el as any)._addItem();
    cap.stop();
    expect((cap.events[0].detail as any).feature.items).to.deep.equal([
      { entity: 'button.a' },
      { entity: '' },
    ]);
  });

  it('Add entity button triggers _addItem', async () => {
    const el = await mount({ feature: { type: 'switch-group', entities: [] } });
    const cap = captureEvents('feature-changed');
    (el.shadowRoot!.querySelector('ha-button') as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true })
    );
    cap.stop();
    expect((cap.events[0].detail as any).feature.entities).to.deep.equal([{ entity: '' }]);
  });

  it('_updateItem sets entity', async () => {
    const el = await mount({
      feature: { type: 'switch-group', entities: [{ entity: '' }] },
    });
    const cap = captureEvents('feature-changed');
    (el as any)._updateItem(0, { entity: 'switch.x' });
    cap.stop();
    expect((cap.events[0].detail as any).feature.entities[0].entity).to.equal('switch.x');
  });

  it('_updateItem prunes an empty label but keeps icon="" as "no icon"', async () => {
    const el = await mount({
      feature: { type: 'switch-group', entities: [{ entity: 'switch.x', label: 'L', icon: 'i' }] },
    });
    const cap = captureEvents('feature-changed');
    (el as any)._updateItem(0, { label: '', icon: '' });
    cap.stop();
    expect((cap.events[0].detail as any).feature.entities[0]).to.deep.equal({
      entity: 'switch.x',
      icon: '',
    });
  });

  it('_updateItem with icon=undefined reverts to the default (prunes the key)', async () => {
    const el = await mount({
      feature: { type: 'switch-group', entities: [{ entity: 'switch.x', icon: '' }] },
    });
    const cap = captureEvents('feature-changed');
    (el as any)._updateItem(0, { icon: undefined });
    cap.stop();
    expect((cap.events[0].detail as any).feature.entities[0]).to.deep.equal({ entity: 'switch.x' });
  });

  it('item pickers/inputs drive _updateItem', async () => {
    const el = await mount({
      feature: { type: 'switch-group', entities: [{ entity: 'switch.x' }] },
    });
    const picker = el.shadowRoot!.querySelector('.item mp-entity-picker') as Element;
    const cap1 = captureEvents('feature-changed');
    emitValueChanged(picker, 'switch.y');
    cap1.stop();
    expect((cap1.events[0].detail as any).feature.entities[0].entity).to.equal('switch.y');

    const labelTf = el.shadowRoot!.querySelector('.item mp-text-field') as Element;
    const cap2 = captureEvents('feature-changed');
    emitValueChanged(labelTf, 'Lamp');
    cap2.stop();
    expect((cap2.events[0].detail as any).feature.entities[0].label).to.equal('Lamp');

    const iconPicker = el.shadowRoot!.querySelector('.item mp-icon-field') as Element;
    const cap3 = captureEvents('feature-changed');
    emitValueChanged(iconPicker, 'mdi:lamp');
    cap3.stop();
    expect((cap3.events[0].detail as any).feature.entities[0].icon).to.equal('mdi:lamp');

    const cap4 = captureEvents('feature-changed');
    emitValueChanged(iconPicker, undefined); // undefined -> revert to default (pruned)
    cap4.stop();
    expect((cap4.events[0].detail as any).feature.entities[0].icon).to.equal(undefined);
  });

  it("previews the entity's own icon as the icon pill default", async () => {
    const hass = makeHass({ 'switch.x': entityState('switch.x', 'on', { icon: 'mdi:lamp' }) });
    const el = await fixture<MpEntityListEditor>(
      html`<mp-entity-list-editor
        .hass=${hass}
        .feature=${{ type: 'switch-group', entities: [{ entity: 'switch.x' }] }}
        itemsKey="entities"
        .includeDomains=${['switch']}
      ></mp-entity-list-editor>`
    );
    const field = el.shadowRoot!.querySelector('.item mp-icon-field') as any;
    expect(field.defaultIcon).to.equal('mdi:lamp');
  });

  it('_moveItem reorders the list (0 → 2 gives [b, c, a])', async () => {
    const el = await mount({
      feature: {
        type: 'switch-group',
        entities: [{ entity: 'switch.a' }, { entity: 'switch.b' }, { entity: 'switch.c' }],
      },
      itemsKey: 'entities',
    });
    const cap = captureEvents('feature-changed');
    (el as any)._moveItem(new CustomEvent('item-moved', { detail: { oldIndex: 0, newIndex: 2 } }));
    cap.stop();
    expect((cap.events[0].detail as any).feature.entities).to.deep.equal([
      { entity: 'switch.b' },
      { entity: 'switch.c' },
      { entity: 'switch.a' },
    ]);
  });

  it('_moveItem stops the event so it cannot reach the outer features sortable', async () => {
    const el = await mount({
      feature: { type: 'switch-group', entities: [{ entity: 'switch.a' }, { entity: 'switch.b' }] },
      itemsKey: 'entities',
    });
    const ev = new CustomEvent('item-moved', { detail: { oldIndex: 0, newIndex: 1 } });
    let stopped = false;
    ev.stopPropagation = () => {
      stopped = true;
    };
    (el as any)._moveItem(ev);
    expect(stopped).to.be.true;
  });

  it('_removeItem removes by index', async () => {
    const el = await mount({
      feature: { type: 'switch-group', entities: [{ entity: 'a' }, { entity: 'b' }] },
    });
    const cap = captureEvents('feature-changed');
    (el as any)._removeItem(0);
    cap.stop();
    expect((cap.events[0].detail as any).feature.entities).to.deep.equal([{ entity: 'b' }]);
  });

  it('delete button triggers _removeItem', async () => {
    const el = await mount({
      feature: { type: 'switch-group', entities: [{ entity: 'a' }] },
    });
    const cap = captureEvents('feature-changed');
    (el.shadowRoot!.querySelector('.item .del') as HTMLButtonElement).click();
    cap.stop();
    expect((cap.events[0].detail as any).feature.entities).to.deep.equal([]);
  });

  describe('color picker (switch group in tile display only)', () => {
    it('hides the color field when not a tile switch group', async () => {
      // switch-list (no display toggle) never shows the color field
      const list = await mount({
        feature: { type: 'switch-list', entities: [{ entity: 'switch.a' }] },
      });
      expect(list.shadowRoot!.querySelector('.item mp-color-field')).to.equal(null);
      // switch-group in icon display: still no color field
      const iconGroup = await mount({
        feature: { type: 'switch-group', entities: [{ entity: 'switch.a' }], display: 'icons' },
        showDisplay: true,
      });
      expect(iconGroup.shadowRoot!.querySelector('.item mp-color-field')).to.equal(null);
    });

    it('shows the color field for a tile switch group and its value drives _updateItem', async () => {
      const el = await mount({
        feature: { type: 'switch-group', entities: [{ entity: 'switch.a' }], display: 'tile' },
        showDisplay: true,
      });
      const cf = el.shadowRoot!.querySelector('.item mp-color-field') as Element;
      expect(cf).to.not.equal(null);
      const cap = captureEvents('feature-changed');
      emitValueChanged(cf, '#334455');
      cap.stop();
      expect((cap.events[0].detail as any).feature.entities[0]).to.deep.include({
        color: '#334455',
      });
    });

    it('_updateItem keeps a color and prunes it when reset', async () => {
      const el = await mount({
        feature: {
          type: 'switch-group',
          entities: [{ entity: 'switch.a', color: '#334455' }],
          display: 'tile',
        },
        showDisplay: true,
      });
      const cap = captureEvents('feature-changed');
      (el as any)._updateItem(0, { color: undefined });
      cap.stop();
      expect((cap.events[0].detail as any).feature.entities[0]).to.deep.equal({
        entity: 'switch.a',
      });
    });
  });
});
