import { expect, fixture, html } from '@open-wc/testing';
import { MaterialPurifierCardEditor, calibrationRunner } from '../../src/editor';
import type { MaterialPurifierCardConfig, FeatureConfig } from '../../src/types';
import { makeHass, oncePromise, fanState, entityState } from '../helpers';

const base: MaterialPurifierCardConfig = {
  type: 'custom:material-purifier-card',
  entity: 'fan.test',
};
async function setup(config = base) {
  const el = await fixture<MaterialPurifierCardEditor>(
    html`<material-purifier-card-editor></material-purifier-card-editor>`
  );
  el.hass = makeHass();
  el.setConfig(config);
  await el.updateComplete;
  return el;
}
function field(el: MaterialPurifierCardEditor, key: string) {
  return el.shadowRoot!.querySelector(`[data-key="${key}"]`)!;
}
async function change(
  el: MaterialPurifierCardEditor,
  target: Element,
  value: unknown,
  type = 'value-changed'
) {
  const event = oncePromise<{ config: MaterialPurifierCardConfig }>(el, 'config-changed');
  target.dispatchEvent(new CustomEvent(type, { detail: { value }, bubbles: true, composed: true }));
  const config = (await event).detail.config;
  await el.updateComplete;
  return config;
}
async function click(el: MaterialPurifierCardEditor, selector: string) {
  (el.shadowRoot!.querySelector(selector) as HTMLButtonElement).click();
  await el.updateComplete;
}
describe('material-purifier-card-editor', () => {
  const runner = calibrationRunner.run;
  afterEach(() => {
    calibrationRunner.run = runner;
  });

  it('keeps base fields and prunes default Show name', async () => {
    const el = await setup({ ...base, name: 'Bedroom' });
    const form = el.shadowRoot!.querySelector('ha-form') as Element & {
      data: Record<string, unknown>;
    };
    expect(form.data.show_name).to.equal(true);
    const hidden = await change(el, form, { ...form.data, show_name: false });
    expect(hidden).to.include({ show_name: false, name: 'Bedroom' });
    const shown = await change(el, form, { ...form.data, show_name: true });
    expect(shown).not.to.have.property('show_name');
  });
  it('lays out rounded AQI controls full/half/third width and collapses below 360px', async () => {
    const el = await setup();
    el.style.width = '600px';
    el.shadowRoot!.querySelector('details')!.open = true;
    expect(field(el, 'aqi_entity').tagName).to.equal('MP-ENTITY-PICKER');
    expect(field(el, 'aqi_attribute').tagName).to.equal('MP-TEXT-FIELD');
    expect(field(el, 'aqi_source').tagName).to.equal('MP-SELECT-FIELD');
    const width = (key: string) => field(el, key).getBoundingClientRect().width;
    expect(width('aqi_entity')).to.equal(600);
    expect(width('aqi_attribute')).to.equal(294);
    expect(width('aqi_source')).to.equal(294);
    for (const key of ['aqi_scale', 'aqi_metric', 'aqi_us_breakpoints']) {
      expect(field(el, key).tagName).to.equal('MP-SELECT-FIELD');
      expect(width(key)).to.equal(192);
    }
    expect(el.shadowRoot!.textContent).not.to.include('Fan speed');
    el.style.width = '350px';
    expect(width('aqi_attribute')).to.equal(350);
    expect(width('aqi_scale')).to.equal(350);
  });
  it('labels every AQI and Motor field above its control with an accessible name', async () => {
    const el = await setup({
      ...base,
      aqi: { entity: 'sensor.pm', attribute: 'pm25' },
      motor_speed_entity: 'sensor.rpm',
      cadr: 360,
      max_rpm: 2104,
    });
    el.hass = makeHass({
      'sensor.pm': entityState('sensor.pm', '5'),
      'sensor.rpm': entityState('sensor.rpm', '1000'),
    });
    await el.updateComplete;
    for (const details of el.shadowRoot!.querySelectorAll('details')) details.open = true;
    for (const [key, text] of [
      ['aqi_entity', 'Air quality sensor'],
      ['aqi_attribute', 'Attribute (optional)'],
      ['aqi_source', 'Reported value'],
      ['aqi_scale', 'AQI scale'],
      ['aqi_metric', 'Shown value'],
      ['aqi_us_breakpoints', 'US breakpoints'],
      ['motor_speed_entity', 'Motor speed sensor'],
      ['cadr', 'CADR (m³/h)'],
      ['max_rpm', 'Max RPM (optional)'],
    ]) {
      const control = field(el, key) as HTMLElement & {
        updateComplete: Promise<boolean>;
        label: string;
      };
      const label = control.previousElementSibling;
      expect(label?.textContent?.trim(), key).to.equal(text);
      expect(label?.parentElement, key).to.equal(control.parentElement);
      expect(control.parentElement?.classList.contains('field-column'), key).to.equal(true);
      expect(control.label, key).to.equal(text);
      await control.updateComplete;
      const input = control.shadowRoot!.querySelector('input, button')!;
      expect(input.getAttribute('aria-label'), key).to.equal(text);
      expect(label!.getBoundingClientRect().bottom, key).to.be.at.most(
        control.getBoundingClientRect().top
      );
    }
    const preview = el.shadowRoot!.querySelector('.aqi-preview')!;
    expect(preview.previousElementSibling).to.equal(
      field(el, 'aqi_source').parentElement!.parentElement
    );
  });
  it('previews the live sensor with selected US breakpoints', async () => {
    const el = await setup({ ...base, aqi: { entity: 'sensor.pm', us_breakpoints: '2012' } });
    el.hass = makeHass({
      'sensor.pm': entityState('sensor.pm', '5', { unit_of_measurement: 'µg/m³' }),
    });
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.aqi-preview')!.textContent).to.include(
      'Sensor: 5 µg/m³ → Shown: 21 AQI (US)'
    );
    await change(el, field(el, 'aqi_us_breakpoints'), '2024');
    expect(el.shadowRoot!.querySelector('.aqi-preview')!.textContent).to.include('28 AQI (US)');
    el.hass = makeHass();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.aqi-preview')!.textContent).to.include(
      'No reading available'
    );
  });
  it('emits all AQI dropdown fields and prunes empty values immutably', async () => {
    const original = { ...base, aqi: { entity: 'sensor.pm' } };
    const el = await setup(original);
    expect((field(el, 'aqi_source') as Element & { options: unknown[] }).options).to.deep.equal([
      { value: '', label: 'Auto-detect' },
      { value: 'pm25', label: 'PM2.5 µg/m³' },
      { value: 'us_aqi', label: 'US AQI' },
      { value: 'cn_aqi', label: 'CN AQI' },
    ]);
    for (const [key, value] of [
      ['source', 'cn_aqi'],
      ['scale', 'cn'],
      ['metric', 'pm25'],
      ['us_breakpoints', '2012'],
    ]) {
      expect((await change(el, field(el, `aqi_${key}`), value)).aqi).to.have.property(key, value);
    }
    for (const key of ['entity', 'source', 'scale', 'metric', 'us_breakpoints']) {
      await change(el, field(el, `aqi_${key}`), '');
    }
    expect(original.aqi).to.deep.equal({ entity: 'sensor.pm' });
    expect((await change(el, field(el, 'aqi_attribute'), '')).aqi).to.equal(undefined);
    const form = el.shadowRoot!.querySelectorAll('ha-form')[1] as Element & {
      data: Record<string, unknown>;
    };
    expect(form.data.aqi_allow_cycle).to.equal(false);
    expect((await change(el, form, { aqi_allow_cycle: true })).aqi?.allow_cycle).to.equal(true);
  });
  for (const aqi of [
    { metric: 'cn_aqi', scale: 'us' },
    { metric: 'us_aqi', scale: 'cn' },
    { metric: 'cn_aqi' },
    { metric: 'us_aqi' },
  ] as const) {
    const scale = 'scale' in aqi ? aqi.scale : aqi.metric === 'cn_aqi' ? 'cn' : 'us';
    it(`preserves scale precedence for ${JSON.stringify(aqi)}`, async () => {
      const el = await setup({ ...base, aqi });
      expect((field(el, 'aqi_scale') as Element & { value: string }).value).to.equal(scale);
      const next = await change(el, field(el, 'aqi_metric'), 'pm25');
      expect(next.aqi).to.include({ scale, metric: 'pm25' });
      expect(aqi.metric).not.to.equal('pm25');
    });
  }
  it('renders numeric CADR/Max RPM, calibrated placeholder, and prunes empty numbers', async () => {
    const el = await setup({ ...base, calibration: [{ value: 1, rpm: 2104 }] });
    el.shadowRoot!.querySelectorAll('details')[1].open = true;
    for (const key of ['cadr', 'max_rpm']) {
      const control = field(el, key) as HTMLElement & { updateComplete: Promise<boolean> };
      await control.updateComplete;
      const input = control.shadowRoot!.querySelector('input')!;
      expect(input.type).to.equal('number');
      if (key === 'max_rpm') expect(input.placeholder).to.equal('Calibrated: 2104');
      expect(await change(el, control, '360')).to.have.property(key, 360);
      expect(await change(el, control, '')).not.to.have.property(key);
    }
    expect(field(el, 'motor_speed_entity').tagName).to.equal('MP-ENTITY-PICKER');
    expect(el.shadowRoot!.textContent).to.include(
      "From your purifier's datasheet; used for air volume and room coverage"
    );
    expect(el.shadowRoot!.textContent).to.include('Leave empty to use calibration');
  });
  it('migrates legacy speed on first edit without overriding feature values', async () => {
    const original: MaterialPurifierCardConfig = {
      ...base,
      speed: { entity: 'number.old', preset: 'Manual', display: 'level', estimate_auto: false },
      features: [
        { type: 'speed-wheel', entity: 'number.new', preset: false },
        { type: 'speed-wheel' },
      ],
    };
    const el = await setup(original);
    const next = await change(el, field(el, 'cadr'), '300');
    expect(next).not.to.have.property('speed');
    expect(next.features![0]).to.deep.equal({
      type: 'speed-wheel',
      entity: 'number.new',
      preset: false,
      display: 'level',
      estimate_auto: false,
    });
    expect(next.features![1]).to.deep.equal({ type: 'speed-wheel' });
    expect(original.speed).to.have.property('entity', 'number.old');
    expect(original.features![0]).not.to.have.property('display');
    const noWheel = await setup({ ...base, speed: original.speed });
    expect((await change(noWheel, field(noWheel, 'cadr'), '300')).speed).to.equal(original.speed);
  });
  async function calibrationEditor() {
    const el = await setup({
      ...base,
      motor_speed_entity: 'sensor.rpm',
      features: [{ type: 'speed-wheel' }],
    });
    el.hass = makeHass({
      'fan.test': fanState('fan.test', 'on', {
        supported_features: 1,
        percentage: 60,
        percentage_step: 20,
      }),
      'sensor.rpm': entityState('sensor.rpm', '1234', { unit_of_measurement: 'rpm' }),
    });
    await el.updateComplete;
    return el;
  }
  it('confirms calibration, shows progress, writes results and summary', async () => {
    const el = await calibrationEditor();
    let finish!: (points: { value: number; rpm: number }[]) => void;
    calibrationRunner.run = async (getHass, opts) => {
      expect(getHass()).to.equal(el.hass);
      expect(opts).to.include({ fanEntity: 'fan.test', rpmEntity: 'sensor.rpm' });
      expect(opts.target.kind).to.equal('fan_percentage');
      opts.onProgress?.({ step: 2, total: 2, value: 20, rpm: 1234, phase: 'sampling' });
      return new Promise((resolve) => {
        finish = resolve;
      });
    };
    await click(el, '.calibrate');
    expect(el.shadowRoot!.textContent!.replace(/\s+/g, ' ')).to.include(
      'The purifier will run at its lowest and highest speed for up to a minute or two, then return to its current mode.'
    );
    await click(el, '.cancel-calibration');
    expect(el.shadowRoot!.querySelector('.start-calibration')).to.equal(null);
    await click(el, '.calibrate');
    await click(el, '.start-calibration');
    expect(el.shadowRoot!.textContent!.replace(/\s+/g, ' ')).to.include('Step 2 of 2 · 1,234 rpm');
    const event = oncePromise<{ config: MaterialPurifierCardConfig }>(el, 'config-changed');
    const points = [
      { value: 20, rpm: 400 },
      { value: 100, rpm: 2104 },
    ];
    finish(points);
    expect((await event).detail.config.calibration).to.deep.equal(points);
    await el.updateComplete;
    expect(el.shadowRoot!.textContent).to.include('Max 2,104 rpm · now 60%');
  });
  for (const [rpm, display, summary] of [
    ['456', undefined, 'Max 2,048 rpm · now 7%'],
    ['3000', undefined, 'Max 2,048 rpm · now 100%'],
    ['456', 'level', 'Max 2,048 rpm · now Level 0'],
    ['unknown', undefined, 'Max 2,048 rpm'],
  ] as const) {
    it(`summarizes calibrated 0–14 speed for rpm ${rpm} with ${display ?? 'default'} display`, async () => {
      const el = await setup({
        ...base,
        motor_speed_entity: 'sensor.rpm',
        features: [{ type: 'speed-wheel', entity: 'number.speed', display }],
        calibration: [
          { value: 0, rpm: 430 },
          { value: 4, rpm: 888 },
          { value: 7, rpm: 1140 },
          { value: 11, rpm: 1584 },
          { value: 14, rpm: 2048 },
        ],
      });
      el.hass = makeHass({
        'number.speed': entityState('number.speed', '14', { min: 0, max: 14, step: 1 }),
        'sensor.rpm': entityState('sensor.rpm', rpm, { unit_of_measurement: 'rpm' }),
      });
      await el.updateComplete;
      const summaries = [...el.shadowRoot!.querySelectorAll('.calibration .hint')]
        .map((hint) => hint.textContent!.trim())
        .filter((text) => text.startsWith('Max '));
      expect(summaries).to.deep.equal([summary]);
    });
  }
  it('Stop aborts and does not save results; errors stay inline', async () => {
    const el = await calibrationEditor();
    let signal!: AbortSignal;
    calibrationRunner.run = async (_getHass, opts) => {
      signal = opts.signal!;
      return new Promise((_resolve, reject) =>
        signal.addEventListener('abort', () => reject(new Error('abort')))
      );
    };
    await click(el, '.calibrate');
    await click(el, '.start-calibration');
    await click(el, '.stop-calibration');
    expect(signal.aborted).to.equal(true);
    await el.updateComplete;
    expect(el.shadowRoot!.textContent).to.include('Calibration stopped');
    calibrationRunner.run = async () => {
      throw new Error('private backend error');
    };
    await click(el, '.calibrate');
    await click(el, '.start-calibration');
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('[role="alert"]')!.textContent).to.include(
      'Calibration failed'
    );
    expect(el.shadowRoot!.textContent).not.to.include('private backend error');
  });
  it('disables calibration with missing rpm or missing speed control reasons', async () => {
    const el = await setup();
    expect((el.shadowRoot!.querySelector('.calibrate') as HTMLButtonElement).disabled).to.equal(
      true
    );
    expect(el.shadowRoot!.textContent).to.include('Select a motor speed sensor');
    el.setConfig({ ...base, motor_speed_entity: 'sensor.rpm' });
    el.hass = makeHass({ 'sensor.rpm': entityState('sensor.rpm', '100') });
    await el.updateComplete;
    expect((el.shadowRoot!.querySelector('.calibrate') as HTMLButtonElement).disabled).to.equal(
      true
    );
    expect(el.shadowRoot!.textContent).to.include('No speed control available');
  });
  it('auto-resolves rpm, aborts on disconnect, and never saves an aborted result', async () => {
    const el = await setup();
    el.hass = makeHass(
      {
        'fan.test': fanState('fan.test', 'on', { supported_features: 1 }),
        'sensor.rpm': entityState('sensor.rpm', '1000', { unit_of_measurement: 'rpm' }),
      },
      {
        entities: {
          'fan.test': { entity_id: 'fan.test', device_id: 'purifier' },
          'sensor.rpm': { entity_id: 'sensor.rpm', device_id: 'purifier' },
        },
      }
    );
    await el.updateComplete;
    let signal!: AbortSignal;
    let finish!: (points: { value: number; rpm: number }[]) => void;
    let writes = 0;
    el.addEventListener('config-changed', () => writes++);
    calibrationRunner.run = async (_getHass, opts) => {
      expect(opts.rpmEntity).to.equal('sensor.rpm');
      signal = opts.signal!;
      return new Promise((resolve) => {
        finish = resolve;
      });
    };
    await click(el, '.calibrate');
    await click(el, '.start-calibration');
    el.remove();
    expect(signal.aborted).to.equal(true);
    finish([{ value: 100, rpm: 2104 }]);
    await Promise.resolve();
    await Promise.resolve();
    expect(writes).to.equal(0);
  });
  it('adds each feature with valid defaults and supplies card context', async () => {
    const defaults: FeatureConfig[] = [
      { type: 'fan-presets', display: 'tile' },
      { type: 'speed-wheel' },
      { type: 'filter-vacuum' },
      { type: 'entity-tile', entity: '' },
      { type: 'sensor-list', items: [] },
      { type: 'switch-list', entities: [] },
      { type: 'switch-group', entities: [] },
      { type: 'button-list', items: [] },
      { type: 'input-select', entity: '' },
      { type: 'percentage-tile', entity: '' },
    ];
    for (const [index, expected] of defaults.entries()) {
      const el = await setup({ ...base, motor_speed_entity: 'sensor.rpm' });
      await click(el, '.add > .add-btn');
      expect(
        el.shadowRoot!.querySelectorAll('.add-opt').length,
        `menu for ${expected.type}`
      ).to.equal(10);
      if (expected.type === 'filter-vacuum') {
        expect(el.shadowRoot!.querySelectorAll('.add-opt')[index].textContent).to.equal(
          'Vacuum filter'
        );
      }
      const event = oncePromise<{ config: MaterialPurifierCardConfig }>(el, 'config-changed');
      (el.shadowRoot!.querySelectorAll('.add-opt')[index] as HTMLButtonElement).click();
      const next = (await event).detail.config;
      expect(next.features).to.deep.equal([expected]);
      await el.updateComplete;
      if (expected.type === 'filter-vacuum') {
        expect(el.shadowRoot!.querySelector('.feature-title > div')!.textContent).to.equal(
          'Vacuum filter'
        );
      }
      const sub = el.shadowRoot!.querySelector('mp-purifier-feature-editor') as Element & {
        cardConfig: MaterialPurifierCardConfig;
        rpmEntity: string;
      };
      if (sub) {
        expect(sub.cardConfig).to.equal(next);
        expect(sub.rpmEntity).to.equal('sensor.rpm');
      }
    }
  });
  it('reorders, edits and deletes features immutably, preserving YAML-only fields', async () => {
    const features: FeatureConfig[] = [
      { type: 'speed-wheel' },
      { type: 'entity-tile', entity: 'sensor.test', tap_action: { action: 'more-info' } },
    ];
    const el = await setup({ ...base, features });
    const event = oncePromise<{ config: MaterialPurifierCardConfig }>(el, 'config-changed');
    el.shadowRoot!.querySelector('ha-sortable')!.dispatchEvent(
      new CustomEvent('item-moved', { detail: { oldIndex: 0, newIndex: 1 } })
    );
    expect((await event).detail.config.features).to.deep.equal([features[1], features[0]]);
    await el.updateComplete;
    await click(el, '[aria-label="Edit feature"]');
    const editedEvent = oncePromise<{ config: MaterialPurifierCardConfig }>(el, 'config-changed');
    el.shadowRoot!.querySelector('mp-entity-tile-editor')!.dispatchEvent(
      new CustomEvent('feature-changed', {
        detail: { feature: { ...features[1], name: 'Custom' } },
      })
    );
    expect((await editedEvent).detail.config.features![0])
      .to.include({ name: 'Custom' })
      .and.have.property('tap_action')
      .that.deep.equals({ action: 'more-info' });
    const deleted = oncePromise<{ config: MaterialPurifierCardConfig }>(el, 'config-changed');
    await click(el, '[aria-label="Delete feature"]');
    expect((await deleted).detail.config.features).to.deep.equal([features[0]]);
    expect(features[0].type).to.equal('speed-wheel');
  });
  it('preserves YAML-only tile actions and list colors through real subeditor patches', async () => {
    for (const feature of [
      { type: 'entity-tile', entity: 'sensor.test', tap_action: { action: 'more-info' } },
      { type: 'sensor-list', items: [{ entity: 'sensor.test', color: '#abcdef' }] },
      { type: 'switch-list', entities: [{ entity: 'switch.test', color: '#abcdef' }] },
      { type: 'button-list', items: [{ entity: 'button.test', color: '#abcdef' }] },
    ] as FeatureConfig[]) {
      const el = await setup({ ...base, features: [feature] });
      await click(el, '[aria-label="Edit feature"]');
      const sub = el.shadowRoot!.querySelector(
        'mp-entity-tile-editor, mp-entity-list-editor'
      ) as HTMLElement & { updateComplete: Promise<boolean> };
      await sub.updateComplete;
      const next = await change(el, sub.shadowRoot!.querySelector('mp-text-field')!, 'Renamed');
      if (feature.type === 'entity-tile')
        expect(next.features![0])
          .to.have.property('tap_action')
          .that.deep.equals(feature.tap_action);
      else {
        const key = feature.type === 'switch-list' ? 'entities' : 'items';
        expect(next.features![0])
          .to.have.property(key)
          .that.deep.equals(
            key === 'entities' && feature.type === 'switch-list'
              ? feature.entities
              : 'items' in feature
                ? feature.items
                : []
          );
      }
    }
  });
});
