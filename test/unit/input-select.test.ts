import { fixture, html, expect } from '@open-wc/testing';
import { makeHass, entityState } from '../helpers';
import '../../src/features/input-select';
import type { MpInputSelect } from '../../src/features/input-select';

describe('mp-input-select', () => {
  for (const domain of ['input_select', 'select']) {
    it(`calls ${domain}.select_option for ${domain} entities`, async () => {
      const entity = `${domain}.mode`;
      const hass = makeHass({
        [entity]: entityState(entity, 'day', { options: ['day', 'night'] }),
      });
      const el = await fixture<MpInputSelect>(
        html`<mp-input-select .hass=${hass} .entity=${entity}></mp-input-select>`
      );
      const row = el.shadowRoot!.querySelector('mp-selector-row')!;
      expect(row.items.map((item) => item.value)).to.deep.equal(['day', 'night']);
      row.dispatchEvent(new CustomEvent('item-selected', { detail: { value: 'night' } }));
      expect(hass.__calls).to.have.lengthOf(1);
      expect(hass.__calls[0]).to.deep.include({ domain, service: 'select_option' });
      expect(hass.__calls[0].data).to.deep.equal({ entity_id: entity, option: 'night' });
    });
  }

  it('does not call a service for unsupported entity domains', async () => {
    const hass = makeHass({
      'sensor.mode': entityState('sensor.mode', 'day', { options: ['day', 'night'] }),
    });
    const el = await fixture<MpInputSelect>(
      html`<mp-input-select .hass=${hass} entity="sensor.mode"></mp-input-select>`
    );
    const row = el.shadowRoot!.querySelector('mp-selector-row')!;
    row.dispatchEvent(new CustomEvent('item-selected', { detail: { value: 'night' } }));
    expect(hass.__calls).to.have.lengthOf(0);
  });

  it('renders nothing when state or options are missing', async () => {
    for (const states of [{}, { 'input_select.mode': entityState('input_select.mode', 'x') }]) {
      const el = await fixture<MpInputSelect>(
        html`<mp-input-select
          .hass=${makeHass(states)}
          entity="input_select.mode"
        ></mp-input-select>`
      );
      expect(el.shadowRoot!.querySelector('mp-selector-row')).to.equal(null);
    }
  });

  it('builds pretty labels and active state, applies overrides, hides and orders options', async () => {
    const hass = makeHass({
      'input_select.mode': entityState('input_select.mode', 'day', {
        options: ['morning', 'day', 'night', 'hidden'],
      }),
    });
    const el = await fixture<MpInputSelect>(
      html`<mp-input-select
        .hass=${hass}
        entity="input_select.mode"
        display="dropdown"
        label="Scene"
        .order=${['night', 'morning']}
        .options=${[
          { value: 'morning', label: 'AM' },
          { value: 'day', icon: 'mdi:weather-sunny', color: '#123456' },
          { value: 'hidden', hide: true },
        ]}
      ></mp-input-select>`
    );
    const row = el.shadowRoot!.querySelector('mp-selector-row')!;
    expect(row.items.map((i) => i.value)).to.deep.equal(['night', 'morning', 'day']);
    expect(row.items[0].label).to.equal('Night');
    expect(row.items[0].icon).to.equal(undefined);
    expect(row.items[0].active).to.be.false;
    expect(row.items[1].label).to.equal('AM');
    expect(row.items[2].active).to.be.true;
    expect(row.items[2].icon).to.equal('mdi:weather-sunny');
    expect(row.items[2].color).to.equal('#123456');
    expect(row.label).to.equal('Scene');
    expect(row.display).to.equal('dropdown');
    row.dispatchEvent(new CustomEvent('item-selected', { detail: { value: 'night' } }));
    expect(hass.__calls).to.have.lengthOf(1);
    expect(hass.__calls[0]).to.deep.include({ domain: 'input_select', service: 'select_option' });
    expect(hass.__calls[0].data).to.deep.equal({ entity_id: 'input_select.mode', option: 'night' });
  });

  it('keeps natural ordering without overrides and ignores selection after state disappears', async () => {
    const hass = makeHass({
      'input_select.mode': entityState('input_select.mode', 'day', {
        options: ['morning', 'day', 'night'],
      }),
    });
    const el = await fixture<MpInputSelect>(
      html`<mp-input-select .hass=${hass} entity="input_select.mode"></mp-input-select>`
    );
    const row = el.shadowRoot!.querySelector('mp-selector-row')!;
    expect(row.items.map((i) => i.value)).to.deep.equal(['morning', 'day', 'night']);
    const missingHass = makeHass({});
    el.hass = missingHass;
    await el.updateComplete;
    row.dispatchEvent(new CustomEvent('item-selected', { detail: { value: 'day' } }));
    expect(missingHass.__calls).to.have.lengthOf(0);
  });
});
