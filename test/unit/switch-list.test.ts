import { fixture, html, expect } from '@open-wc/testing';
import { makeHass, entityState } from '../helpers';
import '../../src/features/switch-list';
import type { MpSwitchList } from '../../src/features/switch-list';

describe('mp-switch-list', () => {
  for (const entities of [[], undefined]) {
    it(`renders nothing for ${entities === undefined ? 'undefined' : 'empty'} entities`, async () => {
      const el = await fixture<MpSwitchList>(
        html`<mp-switch-list .hass=${makeHass({})} .entities=${entities}></mp-switch-list>`
      );
      expect(el.shadowRoot!.querySelector('mp-selector-row')).to.equal(null);
    });
  }

  it('filters empty IDs, builds independent state and label/icon fallbacks', async () => {
    const hass = makeHass({
      'switch.named': entityState('switch.named', 'on', {
        friendly_name: 'Friendly',
        icon: 'mdi:attr-icon',
      }),
      'switch.bare': entityState('switch.bare', 'off'),
      'switch.un': entityState('switch.un', 'unavailable'),
    });
    const el = await fixture<MpSwitchList>(
      html`<mp-switch-list
        .hass=${hass}
        label="Lights"
        .entities=${[
          { entity: '' },
          { entity: 'switch.named', label: 'Cfg', icon: 'mdi:cfg' },
          { entity: 'switch.named' },
          { entity: 'switch.bare' },
          { entity: 'switch.un' },
          { entity: 'switch.gone' },
        ]}
      ></mp-switch-list>`
    );
    const row = el.shadowRoot!.querySelector('mp-selector-row')!;
    const items = row.items;
    expect(items).to.have.lengthOf(5);
    expect(items[0]).to.deep.include({ label: 'Cfg', icon: 'mdi:cfg', active: true });
    expect(items[1]).to.deep.include({ label: 'Friendly', icon: 'mdi:attr-icon', active: true });
    expect(items[2]).to.deep.include({
      label: 'switch.bare',
      icon: 'mdi:toggle-switch-variant',
      active: false,
      disabled: false,
    });
    expect(items[3].disabled).to.be.true;
    expect(items[4]).to.deep.include({
      label: 'switch.gone',
      icon: 'mdi:toggle-switch-variant',
      active: false,
      disabled: true,
    });
    expect(row.label).to.equal('Lights');
    expect(row.display).to.equal('icons');
    row.dispatchEvent(new CustomEvent('item-selected', { detail: { value: 'switch.bare' } }));
    expect(hass.__calls).to.have.lengthOf(1);
    expect(hass.__calls[0]).to.deep.include({ domain: 'homeassistant', service: 'toggle' });
    expect(hass.__calls[0].data).to.deep.equal({ entity_id: 'switch.bare' });
  });
});
