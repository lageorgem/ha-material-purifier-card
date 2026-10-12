import { fixture, html, expect } from '@open-wc/testing';
import { makeHass, entityState } from '../helpers';
import '../../src/features/switch-group';
import type { MpSwitchGroup } from '../../src/features/switch-group';

describe('mp-switch-group', () => {
  for (const entities of [[], undefined]) {
    it(`renders nothing for ${entities === undefined ? 'undefined' : 'empty'} entities`, async () => {
      const el = await fixture<MpSwitchGroup>(
        html`<mp-switch-group .hass=${makeHass({})} .entities=${entities}></mp-switch-group>`
      );
      expect(el.shadowRoot!.querySelector('mp-selector-row')).to.equal(null);
    });
  }

  it('filters empty IDs and forwards state, overrides, fallbacks, color, display and label', async () => {
    const hass = makeHass({
      'switch.named': entityState('switch.named', 'on', {
        friendly_name: 'Pretty Name',
        icon: 'mdi:attr-icon',
      }),
      'switch.bare': entityState('switch.bare', 'off'),
      'switch.un': entityState('switch.un', 'unavailable'),
    });
    const el = await fixture<MpSwitchGroup>(
      html`<mp-switch-group
        .hass=${hass}
        display="dropdown"
        label="Zone"
        .entities=${[
          { entity: '' },
          { entity: 'switch.named', label: 'Config', icon: 'mdi:cfg', color: '#00ff00' },
          { entity: 'switch.named' },
          { entity: 'switch.bare' },
          { entity: 'switch.un' },
          { entity: 'switch.gone' },
        ]}
      ></mp-switch-group>`
    );
    const row = el.shadowRoot!.querySelector('mp-selector-row')!;
    expect(row.items).to.have.lengthOf(5);
    expect(row.items[0]).to.deep.include({
      label: 'Config',
      icon: 'mdi:cfg',
      color: '#00ff00',
      active: true,
      disabled: false,
    });
    expect(row.items[1]).to.deep.include({ label: 'Pretty Name', icon: 'mdi:attr-icon' });
    expect(row.items[2]).to.deep.include({ label: 'switch.bare', active: false, disabled: false });
    expect(row.items[2].icon).to.equal(undefined);
    expect(row.items[2].color).to.equal(undefined);
    expect(row.items[3].disabled).to.be.true;
    expect(row.items[4]).to.deep.include({ label: 'switch.gone', active: false, disabled: true });
    expect(row.label).to.equal('Zone');
    expect(row.display).to.equal('dropdown');
  });

  it('turns off other on-switches before turning on the selected switch', async () => {
    const hass = makeHass({
      'switch.a': entityState('switch.a', 'on'),
      'switch.b': entityState('switch.b', 'on'),
      'switch.c': entityState('switch.c', 'off'),
    });
    const el = await fixture<MpSwitchGroup>(
      html`<mp-switch-group
        .hass=${hass}
        .entities=${[{ entity: 'switch.a' }, { entity: 'switch.b' }, { entity: 'switch.c' }]}
      ></mp-switch-group>`
    );
    el.shadowRoot!.querySelector('mp-selector-row')!.dispatchEvent(
      new CustomEvent('item-selected', { detail: { value: 'switch.c' } })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(hass.__calls).to.have.lengthOf(2);
    expect(hass.__calls[0]).to.deep.include({ domain: 'homeassistant', service: 'turn_off' });
    expect(hass.__calls[0].data).to.deep.equal({ entity_id: ['switch.a', 'switch.b'] });
    expect(hass.__calls[1]).to.deep.include({ domain: 'homeassistant', service: 'turn_on' });
    expect(hass.__calls[1].data).to.deep.equal({ entity_id: 'switch.c' });
  });

  for (const state of ['on', 'off']) {
    it(`only turns on selected when no other switch is on (selected ${state})`, async () => {
      const hass = makeHass({
        'switch.a': entityState('switch.a', state),
        'switch.b': entityState('switch.b', 'off'),
      });
      const el = await fixture<MpSwitchGroup>(
        html`<mp-switch-group
          .hass=${hass}
          .entities=${[{ entity: 'switch.a' }, { entity: 'switch.b' }]}
        ></mp-switch-group>`
      );
      const row = el.shadowRoot!.querySelector('mp-selector-row')!;
      row.dispatchEvent(new CustomEvent('item-selected', { detail: { value: 'switch.a' } }));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(hass.__calls).to.have.lengthOf(1);
      expect(hass.__calls[0]).to.deep.include({ domain: 'homeassistant', service: 'turn_on' });
      expect(hass.__calls[0].data).to.deep.equal({ entity_id: 'switch.a' });
      el.entities = undefined as unknown as [];
      row.dispatchEvent(new CustomEvent('item-selected', { detail: { value: 'switch.a' } }));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(hass.__calls).to.have.lengthOf(2);
      expect(hass.__calls[1].service).to.equal('turn_on');
    });
  }
});
