import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import { MaterialPurifierCard } from '../../src/material-purifier-card';
import type { MpPurifierDial } from '../../src/dial/purifier-dial';
import type { MaterialPurifierCardConfig } from '../../src/types';
import { convertAqi } from '../../src/calc/aqi';
import { entityState, fanState, makeHass, type TestHass } from '../helpers';

const ENTITY = 'fan.test';
const PM25 = 'sensor.pm25';
const RPM = 'sensor.rpm';
const NativeResizeObserver = window.ResizeObserver;

function config(overrides: Partial<MaterialPurifierCardConfig> = {}): MaterialPurifierCardConfig {
  return {
    type: 'custom:material-purifier-card',
    entity: ENTITY,
    aqi: { entity: PM25, source: 'pm25' },
    ...overrides,
  };
}

function baseHass(): TestHass {
  return makeHass({
    [ENTITY]: fanState(ENTITY),
    [PM25]: entityState(PM25, '11', { unit_of_measurement: 'µg/m³' }),
    [RPM]: entityState(RPM, '1100'),
  });
}

async function mount(cfg = config(), hass = baseHass()): Promise<MaterialPurifierCard> {
  const card = await fixture<MaterialPurifierCard>(
    html`<material-purifier-card></material-purifier-card>`
  );
  card.setConfig(cfg);
  card.hass = hass;
  await card.updateComplete;
  return card;
}

function dial(card: MaterialPurifierCard): MpPurifierDial {
  return card.shadowRoot!.querySelector<MpPurifierDial>('mp-purifier-dial')!;
}

function emit(card: MaterialPurifierCard, type: string): void {
  dial(card).dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true }));
}

describe('material-purifier-card', () => {
  let stored: Map<string, string>;
  let resize: ResizeObserverCallback;
  let observer: ResizeObserver;
  let observed: Element | undefined;
  let disconnects: number;

  beforeEach(() => {
    stored = new Map();
    sinon.stub(Storage.prototype, 'getItem').callsFake((key: string) => stored.get(key) ?? null);
    sinon.stub(Storage.prototype, 'setItem').callsFake((key: string, value: string) => {
      stored.set(key, value);
    });
    disconnects = 0;
    observed = undefined;
    sinon.stub(window, 'ResizeObserver').value(
      class implements ResizeObserver {
        private native: ResizeObserver;
        constructor(private callback: ResizeObserverCallback) {
          this.native = new NativeResizeObserver(callback);
        }
        observe(target: Element): void {
          if (target instanceof MaterialPurifierCard) {
            observed = target;
            resize = this.callback;
            observer = this;
          } else this.native.observe(target);
        }
        unobserve(): void {}
        disconnect(): void {
          this.native.disconnect();
          if (observer === this) disconnects++;
        }
      }
    );
  });

  afterEach(() => sinon.restore());

  it('shows the header by default and when explicitly enabled', async () => {
    for (const show_name of [undefined, true]) {
      const card = await mount(config({ name: 'Bedroom', show_name }));
      expect(card.shadowRoot!.querySelector('.header')).not.to.equal(null);
      expect(card.shadowRoot!.querySelector('.name')!.textContent).to.equal('Bedroom');
      expect(card.getCardSize()).to.equal(7);
    }
  });

  it('removes the header and its spacing in stacked and wide layouts', async () => {
    const card = await mount(
      config({
        name: 'Bedroom',
        show_name: false,
        features: [{ type: 'speed-wheel' }],
      })
    );
    const surface = card.shadowRoot!.querySelector('ha-card') as HTMLElement;
    // Stand in for Home Assistant's block-level ha-card component.
    surface.style.display = 'block';
    card.style.width = '800px';
    for (const [width, layout] of [
      [352, 'stacked'],
      [800, 'wide'],
    ] as const) {
      resize([{ contentRect: { width } } as ResizeObserverEntry], observer);
      await card.updateComplete;
      expect(card.shadowRoot!.querySelector('.header')).to.equal(null);
      expect(surface.getAttribute('aria-label')).to.equal('Bedroom');
      const body = card.shadowRoot!.querySelector('.body')!;
      expect(body.classList.contains(layout)).to.equal(true);
      expect(parseFloat(getComputedStyle(body).marginTop)).to.equal(0);
      const wrap = card.shadowRoot!.querySelector('.dial-wrap')!;
      expect(wrap.getBoundingClientRect().top - surface.getBoundingClientRect().top).to.be.closeTo(
        16,
        1
      );
    }
    expect(card.getCardSize()).to.equal(7);
    card.setConfig(config({ name: 'Bedroom' }));
    await card.updateComplete;
    expect(card.shadowRoot!.querySelector('.header')).not.to.equal(null);
    expect(surface.hasAttribute('aria-label')).to.equal(false);
    expect(
      parseFloat(getComputedStyle(card.shadowRoot!.querySelector('.body')!).marginTop)
    ).to.equal(8);
  });

  it('keeps the hidden title accessible with friendly-name and entity fallbacks', async () => {
    const card = await mount(config({ show_name: false }));
    const surface = card.shadowRoot!.querySelector('ha-card')!;
    expect(surface.getAttribute('aria-label')).to.equal('Test Purifier');
    expect(card.getCardSize()).to.equal(6);
    card.hass = makeHass({});
    await card.updateComplete;
    expect(surface.getAttribute('aria-label')).to.equal(ENTITY);
  });

  it('rejects missing and non-fan entities with the specified error', () => {
    const card = new MaterialPurifierCard();
    for (const entity of ['', 'light.test', 'sensor.fan']) {
      expect(() => card.setConfig(config({ entity }))).to.throw('Specify a fan entity');
    }
  });

  for (const [metric, value, unit] of [
    ['us_aqi', '55', 'AQI'],
    ['cn_aqi', '16', 'AQI'],
    ['pm25', '11', 'µg/m³'],
  ] as const) {
    it(`converts 11 µg/m³ to ${metric}`, async () => {
      const card = await mount(config({ aqi: { entity: PM25, source: 'pm25', metric } }));
      expect(dial(card).value).to.equal(value);
      expect(dial(card).unit).to.equal(unit);
    });
  }

  it('cycles metrics and restores the per-fan persisted preference', async () => {
    const cfg = config({ aqi: { entity: PM25, source: 'pm25', allow_cycle: true } });
    const card = await mount(cfg);
    expect(dial(card).allowCycle).to.equal(true);
    for (const unit of ['µg/m³', 'AQI']) {
      emit(card, 'metric-cycle');
      await card.updateComplete;
      expect(dial(card).unit).to.equal(unit);
    }
    emit(card, 'metric-cycle');
    await card.updateComplete;
    expect([...stored.values()]).to.include('pm25');
    const restored = await mount(cfg);
    expect(dial(restored).unit).to.equal('µg/m³');
  });

  it('uses CN scale and cycles only between CN AQI and concentration', async () => {
    const card = await mount(
      config({
        aqi: { entity: PM25, metric: 'aqi', scale: 'cn', allow_cycle: true },
      })
    );
    for (const [value, unit] of [
      ['16', 'AQI'],
      ['11', 'µg/m³'],
      ['16', 'AQI'],
    ] as const) {
      expect(dial(card).value).to.equal(value);
      expect(dial(card).unit).to.equal(unit);
      emit(card, 'metric-cycle');
      await card.updateComplete;
    }
  });

  it('normalizes stale stored AQI scale to the configured pair', async () => {
    stored.set(`material-purifier-card:metric:${ENTITY}`, 'cn_aqi');
    const card = await mount(
      config({
        aqi: { entity: PM25, metric: 'pm25', scale: 'us', allow_cycle: true },
      })
    );
    expect(dial(card).unit).to.equal('AQI');
    expect(dial(card).value).to.equal('55');
  });

  it('colors CN AQI by PM2.5 while retaining the CN category across metric cycling', async () => {
    const hass = baseHass();
    hass.states[PM25] = entityState(PM25, '40');
    const card = await mount(
      config({ aqi: { entity: PM25, source: 'pm25', scale: 'cn', allow_cycle: true } }),
      hass
    );
    expect(dial(card).category).to.equal('Good');
    expect(dial(card).color).to.equal('#FF7E00');
    expect(dial(card).density).to.equal(40);
    emit(card, 'metric-cycle');
    await card.updateComplete;
    expect(dial(card).unit).to.equal('µg/m³');
    expect(dial(card).color).to.equal('#FF7E00');
  });

  it('converts a US AQI source to PM2.5 for AirNow color', async () => {
    const hass = baseHass();
    hass.states[PM25] = entityState(PM25, '60', { unit_of_measurement: 'AQI' });
    const card = await mount(
      config({ aqi: { entity: PM25, source: 'us_aqi', scale: 'cn' } }),
      hass
    );
    expect(dial(card).density).to.be.closeTo(convertAqi(60, 'us_aqi', 'pm25'), 0.000001);
    expect(dial(card).category).to.equal('Excellent');
    expect(dial(card).color).to.equal('#FFFF00');
  });

  it('cycles Auto → Sleep → Manual → Auto with mode labels and icons', async () => {
    const modes = ['Auto', 'Sleep', 'Manual'];
    const hass = baseHass();
    hass.states[ENTITY] = fanState(ENTITY, 'on', { preset_modes: modes, preset_mode: 'Auto' });
    const card = await mount(config(), hass);
    expect(dial(card)).to.have.property('modeAvailable', true);
    expect(dial(card)).to.have.property('modeLabel', 'Mode: Auto. Change mode');
    expect(dial(card)).to.have.property('modeIcon', 'mdi:fan-auto');
    for (const next of ['Sleep', 'Manual', 'Auto']) {
      const currentHass = card.hass as TestHass;
      emit(card, 'mode-cycle');
      expect(currentHass.__calls).to.deep.equal([
        {
          domain: 'fan',
          service: 'set_preset_mode',
          data: { entity_id: ENTITY, preset_mode: next },
          target: undefined,
        },
      ]);
      card.hass = makeHass({
        ...card.hass!.states,
        [ENTITY]: fanState(ENTITY, 'on', { preset_modes: modes, preset_mode: next }),
      });
      await card.updateComplete;
      expect(dial(card)).to.have.property('modeLabel', `Mode: ${next}. Change mode`);
    }
  });

  for (const preset of [undefined, 'missing'] as const) {
    it(`selects the first mode when off with current preset ${preset}`, async () => {
      const hass = baseHass();
      hass.states[ENTITY] = fanState(ENTITY, 'off', {
        preset_modes: ['Auto', 'Sleep'],
        preset_mode: preset,
      });
      const card = await mount(config(), hass);
      expect(dial(card)).to.have.property('modeAvailable', true);
      if (preset === undefined) {
        expect(dial(card)).to.have.property('modeIcon', 'mdi:fan-auto');
        expect(dial(card)).to.have.property('modeLabel', 'Mode: None. Change mode');
      }
      emit(card, 'mode-cycle');
      expect(hass.__calls).to.deep.equal([
        {
          domain: 'fan',
          service: 'set_preset_mode',
          data: { entity_id: ENTITY, preset_mode: 'Auto' },
          target: undefined,
        },
      ]);
    });
  }

  for (const [state, modes] of [
    ['on', []],
    ['on', ['Auto']],
    ['unavailable', ['Auto', 'Sleep']],
  ] as const) {
    it(`disables mode cycling for ${state} with ${modes.length} presets`, async () => {
      const hass = baseHass();
      hass.states[ENTITY] = fanState(ENTITY, state, { preset_modes: [...modes] });
      const card = await mount(config(), hass);
      expect(dial(card)).to.have.property('modeAvailable', false);
      emit(card, 'mode-cycle');
      expect(hass.__calls).to.deep.equal([]);
    });
  }

  for (const [source, value] of [
    ['pm25', 11],
    ['us_aqi', 55],
  ] as const) {
    it(`forwards PM2.5 density from ${source} independently of the display metric`, async () => {
      const hass = baseHass();
      hass.states[PM25] = entityState(PM25, String(value));
      const card = await mount(
        config({ aqi: { entity: PM25, source, metric: 'cn_aqi', allow_cycle: true } }),
        hass
      );
      const expected = convertAqi(value, source, 'pm25');
      expect(dial(card)).to.have.property('density').closeTo(expected, 0.000001);
      emit(card, 'metric-cycle');
      await card.updateComplete;
      expect(dial(card)).to.have.property('density').closeTo(expected, 0.000001);
    });
  }

  it('disables cycling by default and ignores metric-cycle events', async () => {
    const card = await mount();
    expect(dial(card).allowCycle).to.equal(false);
    emit(card, 'metric-cycle');
    await card.updateComplete;
    expect(dial(card).unit).to.equal('AQI');
    expect(stored.size).to.equal(0);
  });

  it('ignores stale persisted metrics when cycling is unset or disabled', async () => {
    const card = await mount(config({ aqi: { entity: PM25, allow_cycle: true } }));
    emit(card, 'metric-cycle');
    await card.updateComplete;
    expect([...stored.values()]).to.include('pm25');
    for (const allow_cycle of [undefined, false] as const) {
      card.setConfig(config({ aqi: { entity: PM25, allow_cycle } }));
      await card.updateComplete;
      expect(dial(card).unit).to.equal('AQI');
      card.setConfig(config({ aqi: { entity: PM25, metric: 'pm25', allow_cycle } }));
      await card.updateComplete;
      expect(dial(card).unit).to.equal('µg/m³');
    }
    expect([...stored.values()]).to.include('pm25');
  });

  it('ignores metric-cycle when cycling is disabled', async () => {
    const card = await mount(config({ aqi: { entity: PM25, allow_cycle: false } }));
    emit(card, 'metric-cycle');
    await card.updateComplete;
    expect(dial(card).unit).to.equal('AQI');
    expect(dial(card).allowCycle).to.equal(false);
    expect(stored.size).to.equal(0);
  });

  for (const [state, service] of [
    ['off', 'turn_on'],
    ['on', 'turn_off'],
  ] as const) {
    it(`calls fan.${service} when ${state}`, async () => {
      const hass = baseHass();
      hass.states[ENTITY] = fanState(ENTITY, state);
      const card = await mount(config(), hass);
      emit(card, 'power-toggle');
      expect(hass.__calls).to.deep.equal([
        { domain: 'fan', service, data: { entity_id: ENTITY }, target: undefined },
      ]);
    });
  }

  for (const [state, status] of [
    ['off', 'Off'],
    ['unavailable', 'Unavailable'],
  ] as const) {
    it(`shows ${status} status`, async () => {
      const hass = baseHass();
      hass.states[ENTITY] = fanState(ENTITY, state);
      const card = await mount(config({ motor_speed_entity: RPM }), hass);
      expect(dial(card).status).to.equal(status);
      expect(dial(card).available).to.equal(state !== 'unavailable');
      expect(dial(card).running).to.equal(false);
    });
  }

  it('combines preset, speed and rpm status; uses motor rpm for animation', async () => {
    const hass = baseHass();
    hass.states[ENTITY] = fanState(ENTITY, 'on', {
      preset_mode: 'auto',
      supported_features: 1,
      percentage: 25,
    });
    const card = await mount(config({ motor_speed_entity: RPM, max_rpm: 2200 }), hass);
    expect(dial(card).status).to.equal(`Auto · 25% · ${Math.round(1100).toLocaleString()} rpm`);
    expect(dial(card).speedFraction).to.equal(0.5);
  });

  it('uses the highest calibrated rpm for animation', async () => {
    const hass = baseHass();
    hass.states[RPM] = entityState(RPM, '1000');
    const card = await mount(
      config({
        motor_speed_entity: RPM,
        calibration: [
          { value: 0, rpm: 400 },
          { value: 14, rpm: 2000 },
        ],
      }),
      hass
    );
    expect(dial(card).speedFraction).to.equal(0.5);
    card.setConfig(
      config({
        motor_speed_entity: RPM,
        calibration: [
          { value: 0, rpm: 400 },
          { value: 14, rpm: 2000 },
        ],
        max_rpm: 4000,
      })
    );
    await card.updateComplete;
    expect(dial(card).speedFraction).to.equal(0.25);
  });

  it('uses the feature speed fraction without calibration or a max rpm, even with live rpm', async () => {
    const hass = baseHass();
    hass.states[RPM] = entityState(RPM, '1000');
    hass.states['number.speed'] = entityState('number.speed', '7', { min: 0, max: 14, step: 1 });
    hass.states['number.legacy'] = entityState('number.legacy', '14', { min: 0, max: 14, step: 1 });
    const card = await mount(
      config({
        motor_speed_entity: RPM,
        speed: { entity: 'number.legacy' },
        features: [{ type: 'speed-wheel', entity: 'number.speed' }],
      }),
      hass
    );
    expect(dial(card).speedFraction).to.equal(0.5);
  });

  it('shows On when no status parts exist', async () => {
    const hass = baseHass();
    hass.states[ENTITY] = fanState(ENTITY, 'on', { preset_mode: undefined, supported_features: 0 });
    const card = await mount(config(), hass);
    expect(dial(card).status).to.equal('On');
  });

  for (const [preset, value, status] of [
    ['Auto', '14', 'Auto · 428 rpm'],
    ['Sleep', '14', 'Sleep · 428 rpm'],
    ['Manual', '7', 'Manual · 53% · 428 rpm'],
    ['manual', '7', 'Manual · 53% · 428 rpm'],
  ] as const) {
    it(`shows only the effective speed in ${preset} mode`, async () => {
      const hass = baseHass();
      hass.states[ENTITY] = fanState(ENTITY, 'on', {
        preset_modes: ['Auto', 'Sleep', 'Manual'],
        preset_mode: preset,
      });
      hass.states['number.speed'] = entityState('number.speed', value, {
        min: 0,
        max: 14,
        step: 1,
      });
      hass.states[RPM] = entityState(RPM, '428');
      const card = await mount(
        config({
          motor_speed_entity: RPM,
          features: [{ type: 'speed-wheel', entity: 'number.speed' }],
        }),
        hass
      );
      expect(dial(card).status).to.equal(status);
    });
  }

  it('uses level display in the status when configured', async () => {
    const hass = baseHass();
    hass.states[ENTITY] = fanState(ENTITY, 'on', {
      preset_modes: ['Auto', 'Sleep', 'Manual'],
      preset_mode: 'Manual',
    });
    hass.states['number.speed'] = entityState('number.speed', '7', { min: 0, max: 14, step: 1 });
    hass.states[RPM] = entityState(RPM, '428');
    const card = await mount(
      config({
        motor_speed_entity: RPM,
        speed: { entity: 'number.legacy', display: 'percent', preset: 'Auto' },
        features: [
          { type: 'speed-wheel', entity: 'number.speed', display: 'level', preset: 'Manual' },
        ],
      }),
      hass
    );
    expect(dial(card).status).to.equal('Manual · Level 7 · 428 rpm');
  });

  for (const preset of [false, undefined] as const) {
    it(`shows number speed when no speed preset applies (${preset})`, async () => {
      const hass = baseHass();
      hass.states[ENTITY] = fanState(ENTITY, 'on', { preset_modes: ['Auto', 'Sleep'] });
      hass.states['number.speed'] = entityState('number.speed', '7');
      const card = await mount(
        config({ speed: { entity: 'number.speed', preset, display: 'level' } }),
        hass
      );
      expect(dial(card).status).to.equal('Auto · Level 7');
    });
  }

  it('uses the speed target fraction when no rpm reading exists', async () => {
    const hass = baseHass();
    hass.states['number.speed'] = entityState('number.speed', '50', { min: 0, max: 100 });
    const card = await mount(config({ speed: { entity: 'number.speed' } }), hass);
    expect(dial(card).speedFraction).to.equal(0.5);
    expect(dial(card).status).to.equal('Auto');
  });

  it('falls back to the fan percentage then to null', async () => {
    const hass = baseHass();
    hass.states[ENTITY] = fanState(ENTITY, 'on', { percentage: 25, supported_features: 0 });
    const card = await mount(config(), hass);
    expect(dial(card).speedFraction).to.equal(0.25);
    card.hass = makeHass({ [ENTITY]: fanState(ENTITY, 'on', { supported_features: 0 }) });
    await card.updateComplete;
    expect(dial(card).speedFraction).to.equal(null);
  });

  it('handles a missing fan and missing or unavailable AQI readings', async () => {
    const card = await mount(config(), makeHass({}));
    expect(dial(card).status).to.equal('Unavailable');
    expect(dial(card).disabled).to.equal(true);
    expect(dial(card).value).to.equal(null);
    expect(dial(card)).to.have.property('density', null);
    expect(dial(card).color).to.equal('var(--mp-outline)');
    const hass = baseHass();
    hass.states[PM25] = entityState(PM25, 'unavailable');
    card.hass = hass;
    await card.updateComplete;
    expect(dial(card).category).to.equal('No reading');
    expect(dial(card)).to.have.property('density', null);
    card.setConfig(config({ aqi: undefined }));
    card.hass = makeHass({ [ENTITY]: fanState(ENTITY) });
    await card.updateComplete;
    expect(dial(card).category).to.equal('No air quality sensor');
  });

  it('renders one feature row per config and forwards card context', async () => {
    const features: MaterialPurifierCardConfig['features'] = [
      { type: 'fan-presets', display: 'tile' },
      { type: 'speed-wheel' },
    ];
    const hass = baseHass();
    hass.states[ENTITY] = fanState(ENTITY, 'off');
    const card = await mount(config({ features, motor_speed_entity: RPM, name: 'Bedroom' }), hass);
    const rows = card.shadowRoot!.querySelectorAll('mp-feature-row');
    expect(rows.length).to.equal(2);
    rows.forEach((row, index) => {
      expect(row).to.have.property('feature', features[index]);
      expect(row).to.have.property('hass', hass);
      expect(row).to.have.property('entity', ENTITY);
      expect(row).to.have.property('rpmEntity', RPM);
      expect(row).to.have.property('parentOff', true);
    });
    expect(card.shadowRoot!.querySelector('.name')?.textContent).to.equal('Bedroom');
    expect(card.getCardSize()).to.equal(9);
  });

  it('updates for AQI changes but skips unrelated entity changes', async () => {
    const hass = baseHass();
    const card = await mount(config(), hass);
    const updated = sinon.spy();
    card.addController({ hostUpdated: updated });
    card.hass = makeHass({ ...hass.states, 'light.other': entityState('light.other') });
    await card.updateComplete;
    expect(updated.callCount).to.equal(0);
    card.hass = makeHass({ ...hass.states, [PM25]: entityState(PM25, '20') });
    await card.updateComplete;
    expect(updated.callCount).to.equal(1);
    expect(dial(card).value).not.to.equal('56');
  });

  it('discovers AQI when the registry arrives without changing state references', async () => {
    const hass = baseHass();
    delete (hass as Partial<TestHass>).entities;
    const card = await mount(config({ aqi: { metric: 'pm25' } }), hass);
    expect(dial(card).category).to.equal('No air quality sensor');
    expect(dial(card).value).to.equal(null);

    card.hass = makeHass(hass.states, {
      entities: {
        [ENTITY]: { entity_id: ENTITY, device_id: 'purifier' },
        [PM25]: { entity_id: PM25, device_id: 'purifier' },
      },
    });
    await card.updateComplete;
    expect(dial(card).value).to.equal('11');
    expect(dial(card).category).not.to.equal('No air quality sensor');
  });

  it('updates feature speed and calibration when config changes without changing hass', async () => {
    const hass = baseHass();
    hass.states[ENTITY].attributes.preset_mode = 'Manual';
    hass.states[ENTITY].attributes.preset_modes = ['Auto', 'Manual'];
    delete (hass as Partial<TestHass>).entities;
    hass.states['number.speed'] = entityState('number.speed', '7', { min: 0, max: 14, step: 1 });
    const card = await mount(
      config({
        motor_speed_entity: RPM,
        speed: { entity: 'number.speed' },
        features: [{ type: 'speed-wheel' }],
      }),
      hass
    );
    expect(dial(card).status).to.equal(`Manual · 53% · ${Math.round(1100).toLocaleString()} rpm`);
    expect(dial(card).speedFraction).to.equal(0.5);
    const updated = sinon.spy();
    card.addController({ hostUpdated: updated });

    card.setConfig(
      config({
        motor_speed_entity: RPM,
        calibration: [
          { value: 0, rpm: 400 },
          { value: 14, rpm: 2000 },
        ],
        features: [{ type: 'speed-wheel', entity: 'number.speed', display: 'level' }],
      })
    );
    await card.updateComplete;
    expect(updated.callCount).to.equal(1);
    expect(card.hass).to.equal(hass);
    expect(dial(card).status).to.equal(
      `Manual · Level 7 · ${Math.round(1100).toLocaleString()} rpm`
    );
    expect(dial(card).speedFraction).to.equal(0.55);
  });

  it('does not update for device model metadata alone', async () => {
    const hass = baseHass();
    const card = await mount(config({ motor_speed_entity: RPM }), hass);
    const updated = sinon.spy();
    card.addController({ hostUpdated: updated });
    card.hass = Object.assign(makeHass(hass.states), {
      devices: { purifier: { model: 'different-model' } },
    });
    await card.updateComplete;
    expect(updated.callCount).to.equal(0);
  });

  it('updates discovered AQI and RPM when device assignments change', async () => {
    const states = {
      ...baseHass().states,
      [RPM]: entityState(RPM, '1100', { unit_of_measurement: 'rpm' }),
      'sensor.other_pm25': entityState('sensor.other_pm25', '20', {
        unit_of_measurement: 'µg/m³',
      }),
      'sensor.other_rpm': entityState('sensor.other_rpm', '550', {
        unit_of_measurement: 'rpm',
      }),
    };
    const entities = {
      [ENTITY]: { entity_id: ENTITY, device_id: 'first' },
      [PM25]: { entity_id: PM25, device_id: 'first' },
      [RPM]: { entity_id: RPM, device_id: 'first' },
      'sensor.other_pm25': { entity_id: 'sensor.other_pm25', device_id: 'second' },
      'sensor.other_rpm': { entity_id: 'sensor.other_rpm', device_id: 'second' },
    };
    const card = await mount(
      config({ aqi: { metric: 'pm25' }, max_rpm: 2200 }),
      makeHass(states, { entities })
    );
    expect(dial(card).value).to.equal('11');
    expect(dial(card).speedFraction).to.equal(0.5);

    card.hass = makeHass(states, {
      entities: { ...entities, [PM25]: { entity_id: PM25, device_id: 'second' } },
    });
    await card.updateComplete;
    expect(dial(card).value).to.equal(null);
    expect(dial(card).category).to.equal('No air quality sensor');

    card.hass = makeHass(states, {
      entities: { ...entities, [ENTITY]: { entity_id: ENTITY, device_id: 'second' } },
    });
    await card.updateComplete;
    expect(dial(card).value).to.equal('20');
    expect(dial(card).speedFraction).to.equal(0.25);

    card.hass = makeHass(states, {
      entities: {
        ...entities,
        [ENTITY]: { entity_id: ENTITY, device_id: 'second' },
        'sensor.other_rpm': { entity_id: 'sensor.other_rpm', device_id: 'first' },
      },
    });
    await card.updateComplete;
    expect(dial(card).value).to.equal('20');
    expect(dial(card).status).not.to.include('rpm');
    expect(dial(card).speedFraction).to.equal(null);
  });

  it('uses 50% for an unset-width percentage tile in the wide layout', async () => {
    const card = await mount(
      config({
        features: [{ type: 'percentage-tile', entity: PM25 }],
      })
    );
    resize([{ contentRect: { width: 800 } } as ResizeObserverEntry], observer);
    await card.updateComplete;

    expect(card.shadowRoot!.querySelector('.body')!.classList.contains('wide')).to.equal(true);
    const features = card.shadowRoot!.querySelector('.features') as HTMLElement;
    expect(features.style.flex).to.equal('0 0 50%');
    expect(features.style.gridTemplateColumns).to.match(/^repeat\(5, minmax\(0(px)?, 1fr\)\)$/);
  });

  it('exposes full-width, content-sized Sections defaults without limiting resizing', async () => {
    const card = await mount();
    expect(card.getGridOptions()).to.deep.equal({ columns: 12, rows: 'auto', min_columns: 6 });
    card.setConfig(
      config({ show_name: false, features: [{ type: 'speed-wheel' }, { type: 'filter-vacuum' }] })
    );
    await card.updateComplete;
    expect(card.getCardSize()).to.equal(8);
  });

  for (const width of [320, 480, 640, 800, 1000, 1400]) {
    for (const show_name of [true, false]) {
      it(`contains and centers the full-circle dial and natural-height tiles at ${width}px (name ${show_name})`, async () => {
        const card = await mount(
          config({
            show_name,
            name: 'An exceptionally long purifier name '.repeat(8),
            features: [{ type: 'speed-wheel' }, { type: 'filter-vacuum' }],
          })
        );
        card.style.width = `${width}px`;
        const surface = card.shadowRoot!.querySelector<HTMLElement>('ha-card')!;
        surface.style.display = 'block';
        resize([{ contentRect: { width } } as ResizeObserverEntry], observer);
        await card.updateComplete;
        const body = card.shadowRoot!.querySelector<HTMLElement>('.body')!;
        const wrap = card.shadowRoot!.querySelector<HTMLElement>('.dial-wrap')!;
        const features = card.shadowRoot!.querySelector<HTMLElement>('.features')!;
        const rows = [...features.querySelectorAll('mp-feature-row')];
        for (const row of rows) {
          await row.updateComplete;
          const child = row.shadowRoot!.firstElementChild!;
          if ('updateComplete' in child) await child.updateComplete;
        }
        await dial(card).updateComplete;
        // Dial/canvas observers remain real; wait for their layout delivery.
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        );
        const wide = width >= 592;
        expect(body.classList.contains('wide')).to.equal(wide);
        const dialRect = dial(card).getBoundingClientRect();
        const wrapRect = wrap.getBoundingClientRect();
        const featureRect = features.getBoundingClientRect();
        expect(dialRect.width).to.be.within(224, 320);
        expect(dialRect.height).to.be.closeTo(dialRect.width, 1);
        expect(dialRect.left + dialRect.width / 2).to.be.closeTo(
          wrapRect.left + wrapRect.width / 2,
          1
        );
        if (wide) {
          expect(featureRect.left - wrapRect.right).to.be.closeTo(16, 1);
          expect(featureRect.width).to.be.closeTo((width - 32) / 2, 1);
        } else {
          expect(featureRect.top - dialRect.bottom).to.be.closeTo(12, 1);
          expect(rows[0].getBoundingClientRect().top).to.be.closeTo(
            rows[1].getBoundingClientRect().top,
            1
          );
        }
        for (const element of [body, wrap, features, ...rows, surface]) {
          expect(element.scrollWidth, element.tagName).to.be.at.most(element.clientWidth + 1);
          expect(element.getBoundingClientRect().right).to.be.at.most(
            card.getBoundingClientRect().right + 1
          );
        }
        for (const row of rows) {
          const tile =
            row.shadowRoot!.firstElementChild!.shadowRoot!.querySelector<HTMLElement>('.tile')!;
          expect(row.getBoundingClientRect().width).to.be.closeTo(
            wide ? featureRect.width : (featureRect.width - 12) / 2,
            1
          );
          expect(tile.getBoundingClientRect().height).to.be.lessThan(180);
          expect(tile.scrollWidth).to.be.at.most(tile.clientWidth + 1);
        }
        expect(card.shadowRoot!.querySelector('.header') === null).to.equal(!show_name);
      });
    }
  }

  it('uses the thermostat thresholds and recomputes spans with the widest feature', async () => {
    const card = await mount(
      config({
        features: [
          { type: 'entity-tile', entity: PM25, width: 30 },
          { type: 'entity-tile', entity: RPM, width: 60 },
        ],
      })
    );
    card.shadowRoot!.querySelector<HTMLElement>('ha-card')!.style.display = 'block';
    for (const [width, wide] of [
      [591, false],
      [592, false],
      [631, false],
      [632, true],
      [800, true],
    ] as const) {
      card.style.width = `${width}px`;
      resize([{ contentRect: { width } } as ResizeObserverEntry], observer);
      await card.updateComplete;
      expect(card.shadowRoot!.querySelector('.body')!.classList.contains('wide')).to.equal(wide);
      const features = card.shadowRoot!.querySelector<HTMLElement>('.features')!;
      const rows = [...features.querySelectorAll('mp-feature-row')];
      for (const row of rows) await row.updateComplete;
      expect(rows.map((row) => row.style.gridColumn)).to.deep.equal(['span 3', 'span 6']);
      expect(features.style.gridTemplateColumns).to.match(wide ? /^repeat\(6,/ : /^repeat\(10,/);
      if (wide) {
        const area = features.getBoundingClientRect().width;
        expect(area).to.be.closeTo((width - 32) * 0.6, 1);
        expect(rows[0].getBoundingClientRect().width).to.be.closeTo((area - 12) / 2, 1);
        expect(rows[1].getBoundingClientRect().width).to.be.closeTo(area, 1);
      }
    }
    card.setConfig(config({ features: [{ type: 'speed-wheel', width: 0 }] }));
    await card.updateComplete;
    const row = card.shadowRoot!.querySelector('mp-feature-row')!;
    await row.updateComplete;
    expect(row.style.gridColumn).to.equal('span 5');
    for (const [width, wide] of [
      [591, false],
      [592, true],
    ] as const) {
      resize([{ contentRect: { width } } as ResizeObserverEntry], observer);
      await card.updateComplete;
      expect(card.shadowRoot!.querySelector('.body')!.classList.contains('wide')).to.equal(wide);
    }
  });

  it('does not stretch a short tile to match a taller grid sibling', async () => {
    const card = await mount(
      config({ features: [{ type: 'entity-tile', entity: PM25 }, { type: 'filter-vacuum' }] })
    );
    card.style.width = '480px';
    card.shadowRoot!.querySelector<HTMLElement>('ha-card')!.style.display = 'block';
    resize([{ contentRect: { width: 480 } } as ResizeObserverEntry], observer);
    await card.updateComplete;
    const rows = [...card.shadowRoot!.querySelectorAll('mp-feature-row')];
    for (const row of rows) await row.updateComplete;
    rows[0].style.minHeight = '300px';
    expect(rows[1].getBoundingClientRect().height).to.be.lessThan(180);
  });

  it('keeps empty and full-width feature configurations stacked at every target width', async () => {
    const card = await mount();
    const configurations = [
      [],
      [{ type: 'fan-presets' }],
      [{ type: 'speed-wheel', width: 100 }],
    ] satisfies NonNullable<MaterialPurifierCardConfig['features']>[];
    for (const features of configurations) {
      card.setConfig(config({ features }));
      for (const width of [320, 480, 640, 800, 1000, 1400]) {
        resize([{ contentRect: { width } } as ResizeObserverEntry], observer);
        await card.updateComplete;
        expect(card.shadowRoot!.querySelector('.body')!.classList.contains('stacked')).to.equal(
          true
        );
        const area = card.shadowRoot!.querySelector<HTMLElement>('.features');
        if (features.length) expect(area!.style.gridTemplateColumns).to.match(/^repeat\(10,/);
        else expect(area).to.equal(null);
      }
    }
  });

  it('observes the host, switches layout on width changes, and reconnects cleanly', async () => {
    const card = await mount(config({ features: [{ type: 'speed-wheel' }] }));
    expect(observed).to.equal(card);
    const setWidth = async (width: number): Promise<void> => {
      resize([{ contentRect: { width } } as ResizeObserverEntry], observer);
      await card.updateComplete;
    };
    await setWidth(800);
    expect(card.shadowRoot!.querySelector('.body')!.classList.contains('wide')).to.equal(true);
    expect(
      parseFloat(getComputedStyle(card.shadowRoot!.querySelector('.dial-wrap')!).marginBottom)
    ).to.be.at.least(0);
    expect(parseFloat(getComputedStyle(card.shadowRoot!.querySelector('.body')!).gap)).to.be.within(
      12,
      16
    );
    expect(
      (card.shadowRoot!.querySelector('.features') as HTMLElement).style.gridTemplateColumns
    ).to.match(/^repeat\(5, minmax\(0(px)?, 1fr\)\)$/);
    await setWidth(352);
    expect(card.shadowRoot!.querySelector('.body')!.classList.contains('stacked')).to.equal(true);
    expect(
      parseFloat(getComputedStyle(card.shadowRoot!.querySelector('.dial-wrap')!).marginBottom)
    ).to.be.at.least(0);
    expect(parseFloat(getComputedStyle(card.shadowRoot!.querySelector('.body')!).gap)).to.be.within(
      12,
      16
    );
    const before = disconnects;
    card.remove();
    expect(disconnects).to.equal(before + 1);
    document.body.append(card);
    expect(observed).to.equal(card);
  });

  it('tracks motor, speed and every feature entity reference', async () => {
    const features: MaterialPurifierCardConfig['features'] = [
      { type: 'speed-wheel', entity: 'number.speed' },
      { type: 'entity-tile', entity: 'sensor.tile' },
      { type: 'switch-group', entities: [{ entity: 'switch.group' }] },
      { type: 'sensor-list', items: [{ entity: 'sensor.item' }] },
      {
        type: 'filter-vacuum',
        counter_entity: 'sensor.counter',
        dust_level_entity: 'select.dust',
      },
    ];
    const hass = baseHass();
    const card = await mount(
      config({ motor_speed_entity: RPM, speed: { entity: 'number.legacy' }, features }),
      hass
    );
    const updated = sinon.spy();
    card.addController({ hostUpdated: updated });
    for (const id of [
      ENTITY,
      RPM,
      'number.speed',
      'sensor.tile',
      'switch.group',
      'sensor.item',
      'sensor.counter',
      'select.dust',
    ]) {
      const before = updated.callCount;
      card.hass = makeHass({ ...card.hass!.states, [id]: entityState(id, '1') });
      await card.updateComplete;
      expect(updated.callCount, id).to.equal(before + 1);
    }
    const before = updated.callCount;
    card.hass = makeHass({
      ...card.hass!.states,
      'number.legacy': entityState('number.legacy', '1'),
    });
    await card.updateComplete;
    expect(updated.callCount).to.equal(before);
  });

  it('lazy-loads the visual editor from getConfigElement', async () => {
    const editor = await MaterialPurifierCard.getConfigElement();
    expect(editor.tagName).to.equal('MATERIAL-PURIFIER-CARD-EDITOR');
    expect(customElements.get('material-purifier-card-editor')).not.to.equal(undefined);
  });

  it('returns the first fan and starter features in getStubConfig', () => {
    const stub = MaterialPurifierCard.getStubConfig(
      makeHass({
        'light.test': entityState('light.test'),
        'fan.first': fanState('fan.first'),
        'fan.second': fanState('fan.second'),
      })
    );
    expect(stub.entity).to.equal('fan.first');
    expect(stub.features).to.deep.equal([
      { type: 'fan-presets', display: 'tile' },
      { type: 'speed-wheel' },
    ]);
    expect(MaterialPurifierCard.getStubConfig(makeHass()).entity).to.equal('');
  });
});
