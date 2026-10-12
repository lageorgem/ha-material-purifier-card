import { fixture, html, expect } from '@open-wc/testing';
import { makeHass, entityState, oncePromise } from '../helpers';
import '../../src/features/button-list';
import type { MpButtonList } from '../../src/features/button-list';

describe('mp-button-list', () => {
  for (const items of [[], undefined]) {
    it(`renders nothing for ${items === undefined ? 'undefined' : 'empty'} items`, async () => {
      const el = await fixture<MpButtonList>(
        html`<mp-button-list .hass=${makeHass({})} .items=${items}></mp-button-list>`
      );
      expect(el.shadowRoot!.querySelector('mp-selector-row')).to.equal(null);
    });
  }

  it('filters empty IDs, keeps buttons inactive and forwards fallbacks and disabled state', async () => {
    const hass = makeHass({
      'button.named': entityState('button.named', 'unknown', {
        friendly_name: 'Doorbell',
        icon: 'mdi:bell',
      }),
      'button.bare': entityState('button.bare', 'unknown'),
      'button.un': entityState('button.un', 'unavailable'),
    });
    const el = await fixture<MpButtonList>(
      html`<mp-button-list
        .hass=${hass}
        label="Actions"
        .items=${[
          { entity: '' },
          { entity: 'button.named', label: 'Cfg', icon: 'mdi:cfg' },
          { entity: 'button.named' },
          { entity: 'button.bare' },
          { entity: 'button.un' },
          { entity: 'button.gone' },
        ]}
      ></mp-button-list>`
    );
    const row = el.shadowRoot!.querySelector('mp-selector-row')!;
    expect(row.items).to.have.lengthOf(5);
    expect(row.items.every((i) => i.active === false)).to.be.true;
    expect(row.items[0]).to.deep.include({ label: 'Cfg', icon: 'mdi:cfg', disabled: false });
    expect(row.items[1]).to.deep.include({ label: 'Doorbell', icon: 'mdi:bell' });
    expect(row.items[2]).to.deep.include({
      label: 'button.bare',
      icon: 'mdi:gesture-tap-button',
      disabled: false,
    });
    expect(row.items[3].disabled).to.be.true;
    expect(row.items[4].disabled).to.be.true;
    expect(row.label).to.equal('Actions');
    expect(row.display).to.equal('icons');
  });

  for (const [entity, domain, service] of [
    ['button.a', 'button', 'press'],
    ['scene.b', 'scene', 'turn_on'],
  ]) {
    it(`dispatches ${domain}.${service}`, async () => {
      const hass = makeHass({ [entity]: entityState(entity, 'unknown') });
      const el = await fixture<MpButtonList>(
        html`<mp-button-list .hass=${hass} .items=${[{ entity }]}></mp-button-list>`
      );
      el.shadowRoot!.querySelector('mp-selector-row')!.dispatchEvent(
        new CustomEvent('item-selected', { detail: { value: entity } })
      );
      expect(hass.__calls).to.have.lengthOf(1);
      expect(hass.__calls[0]).to.deep.include({ domain, service });
      expect(hass.__calls[0].data).to.deep.equal({ entity_id: entity });
    });
  }

  it('opens more-info for an unknown domain without a service call', async () => {
    const hass = makeHass({ 'sensor.x': entityState('sensor.x', '42') });
    const el = await fixture<MpButtonList>(
      html`<mp-button-list .hass=${hass} .items=${[{ entity: 'sensor.x' }]}></mp-button-list>`
    );
    const event = oncePromise(document, 'hass-more-info');
    el.shadowRoot!.querySelector('mp-selector-row')!.dispatchEvent(
      new CustomEvent('item-selected', { detail: { value: 'sensor.x' } })
    );
    expect((await event).detail).to.deep.equal({ entityId: 'sensor.x' });
    expect(hass.__calls).to.have.lengthOf(0);
  });
});
