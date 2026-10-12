import { fixture, html, expect } from '@open-wc/testing';
import sinon from 'sinon';
import { fanState, makeHass } from '../helpers';
import { presetColor, presetIcon } from '../../src/theme';
import type { FanPresetsFeatureConfig } from '../../src/types';
import type { MpFanPresets } from '../../src/features/fan-presets';
import '../../src/features/fan-presets';

describe('mp-fan-presets', () => {
  async function setup(
    state = fanState(),
    config: FanPresetsFeatureConfig = { type: 'fan-presets' }
  ) {
    const hass = makeHass({ 'fan.test': state });
    const el = await fixture<MpFanPresets>(
      html`<mp-fan-presets .hass=${hass} entity="fan.test" .config=${config}></mp-fan-presets>`
    );
    const row = el.shadowRoot!.querySelector('mp-selector-row');
    return { el, hass, row };
  }

  function select(row: EventTarget, value: string): void {
    row.dispatchEvent(new CustomEvent('item-selected', { detail: { value } }));
  }

  it('builds natural preset items with default labels, icons, colors and active state', async () => {
    const { row } = await setup(
      fanState('fan.test', 'on', {
        preset_modes: ['auto', 'silent', 'favorite', 'fan_only'],
        preset_mode: 'silent',
      })
    );
    expect(row!.display).to.equal('icons');
    expect(row!.label).to.equal(undefined);
    expect(row!.items).to.deep.equal(
      ['auto', 'silent', 'favorite', 'fan_only'].map((value, index) => ({
        value,
        label: ['Auto', 'Silent', 'Favorite', 'Fan Only'][index],
        icon: presetIcon(value),
        color: presetColor(value),
        active: value === 'silent',
        disabled: false,
      }))
    );
  });

  it('renders nothing for missing state, missing modes, empty modes or all hidden items', async () => {
    const missing = await fixture<MpFanPresets>(
      html`<mp-fan-presets .hass=${makeHass()} entity="fan.test"></mp-fan-presets>`
    );
    expect(missing.shadowRoot!.querySelector('mp-selector-row')).to.equal(null);
    for (const preset_modes of [undefined, []]) {
      const { row } = await setup(fanState('fan.test', 'on', { preset_modes }));
      expect(row).to.equal(null);
    }
    const { row } = await setup(fanState(), {
      type: 'fan-presets',
      show_off: true,
      options: ['off', 'Auto', 'Silent', 'Favorite'].map((value) => ({ value, hide: true })),
    });
    expect(row).to.equal(null);
  });

  it('prepends Off and applies overrides, hiding and explicit ordering to all options', async () => {
    const { row } = await setup(fanState(), {
      type: 'fan-presets',
      show_off: true,
      order: ['Favorite', 'missing', 'off'],
      options: [
        { value: 'Favorite', label: 'Manual', icon: 'mdi:fan', color: '#123456' },
        { value: 'Silent', hide: true },
        { value: 'off', label: 'Power Off', icon: 'mdi:power-off', color: '#654321' },
      ],
    });
    expect(row!.items.map((item) => item.value)).to.deep.equal(['Favorite', 'off', 'Auto']);
    expect(row!.items[0]).to.deep.include({
      label: 'Manual',
      icon: 'mdi:fan',
      color: '#123456',
      active: false,
    });
    expect(row!.items[1]).to.deep.include({
      label: 'Power Off',
      icon: 'mdi:power-off',
      color: '#654321',
      active: false,
    });
    expect(row!.items[2].active).to.be.true;
  });

  it('marks only Off active when off, even when the fan retains its preset', async () => {
    const { row } = await setup(fanState('fan.test', 'off'), {
      type: 'fan-presets',
      show_off: true,
    });
    expect(row!.items[0]).to.deep.equal({
      value: 'off',
      label: 'Off',
      icon: presetIcon('off'),
      color: presetColor('off'),
      active: true,
      disabled: false,
    });
    expect(row!.items.slice(1).every((item) => !item.active)).to.be.true;
    const withoutOff = await setup(fanState('fan.test', 'off'));
    expect(withoutOff.row!.items.every((item) => !item.active)).to.be.true;
  });

  it('can show Off without any preset modes', async () => {
    const { row } = await setup(fanState('fan.test', 'on', { preset_modes: undefined }), {
      type: 'fan-presets',
      show_off: true,
    });
    expect(row!.items.map((item) => item.value)).to.deep.equal(['off']);
  });

  for (const display of ['icons', 'dropdown', 'tile'] as const) {
    it(`forwards ${display} display and label`, async () => {
      const { row } = await setup(fanState(), { type: 'fan-presets', display, label: 'Mode' });
      expect(row!.display).to.equal(display);
      expect(row!.label).to.equal('Mode');
    });
  }

  it('calls exact fan services and ignores already-active selections', async () => {
    const { el, hass, row } = await setup(fanState(), {
      type: 'fan-presets',
      show_off: true,
    });
    const service = sinon.spy(hass, 'callService');
    select(row!, 'Auto');
    expect(service.called).to.be.false;
    select(row!, 'Silent');
    expect(
      service.calledOnceWithExactly('fan', 'set_preset_mode', {
        entity_id: 'fan.test',
        preset_mode: 'Silent',
      })
    ).to.be.true;
    select(row!, 'off');
    expect(service.secondCall.args).to.deep.equal(['fan', 'turn_off', { entity_id: 'fan.test' }]);
    el.hass = makeHass({ 'fan.test': fanState('fan.test', 'off') });
    await el.updateComplete;
    select(row!, 'off');
    expect(service.callCount).to.equal(2);
    const offHass = el.hass as typeof hass;
    expect(offHass.__calls).to.have.lengthOf(0);
    select(row!, 'Auto');
    expect(offHass.__calls[0]).to.deep.include({
      domain: 'fan',
      service: 'set_preset_mode',
      data: { entity_id: 'fan.test', preset_mode: 'Auto' },
    });
  });

  it('disables all items when unavailable and ignores unavailable selections', async () => {
    const { hass, row } = await setup(fanState('fan.test', 'unavailable'), {
      type: 'fan-presets',
      show_off: true,
    });
    expect(row!.items.every((item) => item.disabled && !item.active)).to.be.true;
    select(row!, 'Silent');
    select(row!, 'off');
    expect(hass.__calls).to.have.lengthOf(0);
  });

  it('updates items with config/state changes and ignores stale or hidden selections', async () => {
    const { el, row } = await setup();
    el.config = {
      type: 'fan-presets',
      display: 'tile',
      options: [{ value: 'Silent', hide: true }],
    };
    await el.updateComplete;
    expect(row!.display).to.equal('tile');
    expect(row!.items.map((item) => item.value)).to.deep.equal(['Auto', 'Favorite']);
    const hass = el.hass as ReturnType<typeof makeHass>;
    select(row!, 'Silent');
    select(row!, 'off');
    select(row!, 'missing');
    expect(hass.__calls).to.have.lengthOf(0);
    el.hass = makeHass();
    await el.updateComplete;
    select(row!, 'Favorite');
    expect((el.hass as typeof hass).__calls).to.have.lengthOf(0);
    expect(el.shadowRoot!.querySelector('mp-selector-row')).to.equal(null);
  });
});
