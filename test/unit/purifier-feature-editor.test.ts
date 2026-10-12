import { expect, fixture, html } from '@open-wc/testing';
import { MpPurifierFeatureEditor, helperCreator } from '../../src/editors/purifier-feature-editor';
import '../../src/editors/purifier-feature-editor';
import '../../src/features/filter-vacuum';
import '../../src/features/speed-wheel-tile';
import '../../src/features/percentage-tile';
import type {
  FanPresetsFeatureConfig,
  FilterVacuumFeatureConfig,
  SpeedWheelFeatureConfig,
  PercentageTileFeatureConfig,
} from '../../src/types';
import { fanState, makeHass, oncePromise } from '../helpers';

type Feature =
  | FanPresetsFeatureConfig
  | SpeedWheelFeatureConfig
  | FilterVacuumFeatureConfig
  | PercentageTileFeatureConfig;
async function setup(feature: Feature) {
  const el = await fixture<MpPurifierFeatureEditor>(
    html`<mp-purifier-feature-editor></mp-purifier-feature-editor>`
  );
  el.hass = makeHass({ 'fan.test': fanState() });
  el.fanEntity = 'fan.test';
  el.feature = feature;
  await el.updateComplete;
  return el;
}
async function patch(el: MpPurifierFeatureEditor, selector: string, type: string, detail: unknown) {
  const event = oncePromise<{ feature: Feature }>(el, 'feature-changed');
  el.shadowRoot!.querySelector(selector)!.dispatchEvent(
    new CustomEvent(type, { detail, bubbles: true, composed: true })
  );
  return (await event).detail.feature;
}
function numberInput(el: MpPurifierFeatureEditor, selector: string): HTMLInputElement {
  return el.shadowRoot!.querySelector(selector)!.shadowRoot!.querySelector('input')!;
}
describe('mp-purifier-feature-editor', () => {
  for (const counter_entity of [undefined, 'sensor.runtime']) {
    it(`explains vacuum tracking before all fields${counter_entity ? ' with tracking' : ''}`, async () => {
      const el = await setup({ type: 'filter-vacuum', counter_entity });
      const note = el.shadowRoot!.querySelector('.editor')!.firstElementChild!;
      expect(note.getAttribute('role')).to.equal('note');
      expect(note.querySelector('ha-icon')!.getAttribute('icon')).to.equal(
        'mdi:information-outline'
      );
      expect(note.querySelector('.vacuum-info-title')!.textContent).to.equal('What this tracks');
      const text = note.querySelector('p')!.textContent!.replace(/\s+/g, ' ').trim();
      expect(text).to.include('outer mesh');
      expect(text).to.equal(
        "Dust and hair collect on the outer mesh of the purifier's cylindrical filter. Vacuuming it regularly keeps air flowing and the filter working longer. This tile counts how much air has passed through since you last vacuumed it and tells you when it's time again. Tap ✓ on the tile after vacuuming to start a new count."
      );
    });
  }
  for (const feature of [
    { type: 'speed-wheel' },
    { type: 'percentage-tile', entity: 'sensor.battery' },
    { type: 'fan-presets' },
  ] satisfies Feature[]) {
    it(`omits the vacuum explainer for ${feature.type}`, async () => {
      const el = await setup(feature);
      expect(el.shadowRoot!.querySelector('[role="note"]')).to.equal(null);
    });
  }
  for (const feature of [
    { type: 'filter-vacuum' },
    { type: 'filter-vacuum', counter_entity: 'sensor.runtime' },
    { type: 'speed-wheel' },
    { type: 'percentage-tile', entity: 'sensor.battery', ranges: [{ color: 'red' }] },
    { type: 'fan-presets' },
  ] satisfies Feature[]) {
    it(`labels every field above its control or range column for ${feature.type}${'counter_entity' in feature ? ' with tracking' : ''}`, async () => {
      const el = await setup(feature);
      const fields = el.shadowRoot!.querySelectorAll(
        'mp-entity-picker, mp-text-field, mp-select-field, mp-icon-field, mp-color-field, mp-display-toggle, mp-width-field, ha-form, .toggle'
      );
      expect(fields.length).to.be.greaterThan(0);
      for (const field of fields) {
        if (field.closest('.range')) {
          const column = Array.from(field.parentElement!.children).indexOf(field);
          const header = el.shadowRoot!.querySelector('.range-header')!.children[column];
          const control = field.shadowRoot!.querySelector('input, button')!;
          expect(control.getAttribute('aria-label') ?? control.getAttribute('title')).to.equal(
            header.textContent!.trim()
          );
          continue;
        }
        const label = field.previousElementSibling as HTMLElement | null;
        expect(label, `${field.tagName} needs a label in its column`).not.to.equal(null);
        expect(label!.classList.contains('field-label'), field.outerHTML).to.equal(true);
        expect(label!.textContent!.trim()).not.to.equal('');
        expect(getComputedStyle(label!).display).not.to.equal('none');
        expect(getComputedStyle(field.parentElement!).flexDirection).to.equal('column');
      }
      for (const toggle of el.shadowRoot!.querySelectorAll('.toggle')) {
        expect(toggle.tagName).to.equal('LABEL');
        expect(toggle.textContent!.trim()).not.to.equal('');
      }
    });
  }
  for (const feature of [
    { type: 'filter-vacuum' },
    { type: 'speed-wheel' },
    { type: 'percentage-tile', entity: 'sensor.battery' },
    { type: 'fan-presets' },
  ] satisfies Feature[]) {
    it(`labels icon and color columns for ${feature.type}`, async () => {
      const el = await setup(feature);
      const rows = el.shadowRoot!.querySelectorAll('.appearance-row');
      expect(rows.length).to.be.greaterThan(0);
      for (const row of rows) {
        expect(
          Array.from(row.querySelectorAll('.field-label'), (label) => label.textContent)
        ).to.deep.equal(['Icon', 'Color']);
        expect(row.querySelector('mp-icon-field')).not.to.equal(null);
        expect(row.querySelector('mp-color-field')).not.to.equal(null);
      }
    });
  }
  for (const count of [0, 1, 2]) {
    it(`keeps ${count} range rows on one compact line at 380px with one column header`, async () => {
      const el = await setup({
        type: 'percentage-tile',
        entity: '',
        ranges: [
          { from: 0, to: 50, color: 'red' },
          { from: 50, color: 'green' },
        ].slice(0, count),
      });
      el.style.display = 'block';
      el.style.width = '380px';
      await el.updateComplete;
      const headers = el.shadowRoot!.querySelectorAll('.range-header');
      expect(headers).to.have.length(1);
      expect(Array.from(headers[0].children, (child) => child.textContent)).to.deep.equal([
        'From',
        'To',
        'Color',
      ]);
      const ranges = el.shadowRoot!.querySelector('.ranges')!;
      expect((ranges.textContent!.match(/From/g) ?? []).length).to.equal(1);
      expect(ranges.querySelectorAll('.range').length).to.equal(count);
      for (const row of el.shadowRoot!.querySelectorAll('.range')) {
        const children = Array.from(row.children) as HTMLElement[];
        await Promise.all(
          children.map((child) => (child as { updateComplete?: Promise<unknown> }).updateComplete)
        );
        expect(row.querySelectorAll('.field-label').length).to.equal(0);
        expect(getComputedStyle(row).gridTemplateColumns).to.equal(
          getComputedStyle(headers[0]).gridTemplateColumns
        );
        const controls = children.map(
          (child) => child.shadowRoot?.querySelector('input, button') ?? child
        );
        const centers = controls.map((control) => {
          const rect = control.getBoundingClientRect();
          return rect.top + rect.height / 2;
        });
        expect(Math.max(...centers) - Math.min(...centers)).to.be.at.most(2);
        for (const [column, header] of Array.from(headers[0].children).entries()) {
          expect(
            Math.abs(
              header.getBoundingClientRect().left - controls[column].getBoundingClientRect().left
            )
          ).to.be.at.most(2);
          expect(
            controls[column].getAttribute('aria-label') ?? controls[column].getAttribute('title')
          ).to.equal(header.textContent!.trim());
        }
        expect(children[0].getBoundingClientRect().width).to.equal(88);
        expect(row.querySelector('button')!.getAttribute('aria-label')).to.equal('Remove range');
        expect(row.querySelector('mp-color-field')!.attached).to.equal(false);
        for (const field of row.querySelectorAll('mp-text-field')) {
          expect(field.shadowRoot!.querySelector('input')!.type).to.equal('number');
          expect(field.shadowRoot!.querySelector('input')!.placeholder).to.equal('—');
        }
      }
      expect(
        el.shadowRoot!.querySelector('[aria-label="Add range"]')!.textContent!.trim()
      ).to.equal('Add range');
    });
  }
  for (const feature of [
    { type: 'filter-vacuum' },
    { type: 'speed-wheel' },
    { type: 'percentage-tile', entity: 'sensor.battery' },
  ] satisfies Feature[]) {
    it(`previews the runtime ${feature.type} default icon without persisting it`, async () => {
      const el = await setup(feature);
      const runtime = await fixture(
        feature.type === 'filter-vacuum'
          ? html`<mp-filter-vacuum .hass=${el.hass} .config=${feature}></mp-filter-vacuum>`
          : feature.type === 'speed-wheel'
            ? html`<mp-speed-wheel-tile
                .hass=${el.hass}
                entity="fan.test"
                .config=${feature}
              ></mp-speed-wheel-tile>`
            : html`<mp-percentage-tile .hass=${el.hass} .config=${feature}></mp-percentage-tile>`
      );
      const icon = el.shadowRoot!.querySelector('mp-icon-field')!;
      await icon.updateComplete;
      const runtimeIcon = runtime.shadowRoot!.querySelector('ha-icon')!.getAttribute('icon');
      expect(runtimeIcon).to.be.a('string').and.not.equal('');
      expect(icon.defaultIcon).to.equal(runtimeIcon);
      expect(icon.value).to.equal(undefined);
      expect(feature).not.to.have.property('icon');
      const next = await patch(el, 'mp-text-field', 'value-changed', { value: 'Custom title' });
      expect(next).not.to.have.property('icon');
      const custom = await patch(el, 'mp-icon-field', 'value-changed', { value: 'mdi:star' });
      expect(custom).to.include({ icon: 'mdi:star' });
      el.feature = custom;
      await el.updateComplete;
      const cleared = await patch(el, 'mp-icon-field', 'value-changed', { value: undefined });
      expect(cleared).not.to.have.property('icon');
    });
  }
  it('edits percentage fields and prunes optional empty values while retaining actions', async () => {
    const el = await setup({
      type: 'percentage-tile',
      entity: 'sensor.battery',
      name: 'Battery',
      tap_action: { action: 'more-info' },
    });
    expect(el.shadowRoot!.querySelector('mp-entity-picker')!.includeDomains).to.deep.equal([
      'sensor',
      'number',
      'input_number',
    ]);
    expect(el.shadowRoot!.querySelector('mp-width-field')!.default).to.equal(50);
    const next = await patch(el, 'mp-text-field[label="Name"]', 'value-changed', { value: '' });
    expect(next).not.to.have.property('name');
    expect(next).to.have.property('tap_action').that.deep.equals({ action: 'more-info' });
    const input = numberInput(el, '[data-field="min"]');
    expect(input.type).to.equal('number');
    expect(input.placeholder).to.equal('0');
    input.value = '0';
    const event = oncePromise<{ feature: Feature }>(el, 'feature-changed');
    input.dispatchEvent(new Event('input'));
    expect((await event).detail.feature).to.include({ min: 0 });
  });
  it('adds range drafts, emits only colored ranges, prunes bounds, and removes rows', async () => {
    const original: PercentageTileFeatureConfig = {
      type: 'percentage-tile',
      entity: '',
      ranges: [{ from: 0, to: 50, color: 'red' }],
    };
    const el = await setup(original);
    (el.shadowRoot!.querySelector('[aria-label="Add range"]') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll('.range')).to.have.length(2);
    const renamed = await patch(el, 'mp-text-field[label="Name"]', 'value-changed', {
      value: 'Battery',
    });
    expect(renamed).to.have.property('ranges').that.deep.equals(original.ranges);
    await el.updateComplete;
    const next = await patch(el, '.range ~ .range mp-color-field', 'value-changed', {
      value: 'green',
    });
    expect(next)
      .to.have.property('ranges')
      .that.deep.equals([...original.ranges!, { color: 'green' }]);
    await el.updateComplete;
    const input = numberInput(el, '.range [data-field="from"]');
    input.value = '';
    const event = oncePromise<{ feature: Feature }>(el, 'feature-changed');
    input.dispatchEvent(new Event('input'));
    expect((await event).detail.feature)
      .to.have.property('ranges')
      .that.deep.equals([{ to: 50, color: 'red' }, { color: 'green' }]);
    await el.updateComplete;
    const removed = oncePromise<{ feature: Feature }>(el, 'feature-changed');
    (el.shadowRoot!.querySelector('[aria-label="Remove range"]') as HTMLButtonElement).click();
    expect((await removed).detail.feature)
      .to.have.property('ranges')
      .that.deep.equals([{ color: 'green' }]);
    expect(original.ranges).to.deep.equal([{ from: 0, to: 50, color: 'red' }]);
  });
  it('shows household dust level before its optional read-only helper and emits the setting', async () => {
    const feature: FilterVacuumFeatureConfig = {
      type: 'filter-vacuum',
      dust_level_entity: 'input_select.dust',
    };
    const el = await setup(feature);
    const select = el.shadowRoot!.querySelector<HTMLElementTagNameMap['mp-select-field']>(
      'mp-select-field[label="Household dust level"]'
    )!;
    expect(el.shadowRoot!.textContent).to.include('read-only');
    expect(select.options).to.deep.equal([
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
    ]);
    const next = await patch(el, 'mp-select-field', 'value-changed', { value: 'low' });
    expect(next).to.include({ dust_level: 'low', dust_level_entity: 'input_select.dust' });
    el.feature = next;
    await el.updateComplete;
    expect(select.value).to.equal('low');
    const cleared = await patch(el, 'mp-select-field', 'value-changed', { value: '' });
    expect(cleared).not.to.have.property('dust_level');
    expect(feature).not.to.have.property('dust_level');
  });
  for (const [feature, defaultWidth] of [
    [{ type: 'speed-wheel' }, 50],
    [{ type: 'filter-vacuum' }, 50],
    [{ type: 'fan-presets' }, 100],
  ] satisfies [Feature, number][]) {
    it(`shows an unset ${feature.type} width as ${defaultWidth}% without persisting it`, async () => {
      const el = await setup(feature);
      const width = el.shadowRoot!.querySelector('mp-width-field')!;
      await width.updateComplete;
      expect(width.value).to.equal(undefined);
      const slider = width.shadowRoot!.querySelector('mp-grid-slider')!;
      expect(slider.value).to.equal(defaultWidth);
      expect(feature).not.to.have.property('width');

      const next = await patch(el, 'mp-text-field', 'value-changed', { value: 'Custom title' });
      expect(next).to.include({ label: 'Custom title' });
      expect(next).not.to.have.property('width');
    });
  }
  it('patches show_off, display and per-preset overrides immutably', async () => {
    const feature: FanPresetsFeatureConfig = {
      type: 'fan-presets',
      options: [{ value: 'Auto', color: '#abcdef' }],
    };
    const el = await setup(feature);
    const next = await patch(el, 'ha-form', 'value-changed', { value: { show_off: true } });
    expect(next).to.include({ show_off: true });
    expect(next).to.have.property('options').that.deep.equals(feature.options);
    const off = await patch(el, 'ha-form', 'value-changed', { value: { show_off: false } });
    expect(off).to.include({ show_off: false });
    const display = await patch(el, 'mp-display-toggle', 'value-changed', { value: 'dropdown' });
    expect(display).to.include({ display: 'dropdown' });
    const override = await patch(el, '.opt mp-text-field', 'value-changed', { value: 'Automatic' });
    expect(override)
      .to.have.property('options')
      .that.deep.equals([{ value: 'Auto', color: '#abcdef', label: 'Automatic' }]);
    expect(feature.options![0]).not.to.have.property('label');
  });
  it('stops nested reorder events and emits preset order', async () => {
    const el = await setup({ type: 'fan-presets' });
    let bubbled = false;
    el.addEventListener('item-moved', () => {
      bubbled = true;
    });
    const next = await patch(el, 'ha-sortable', 'item-moved', { oldIndex: 0, newIndex: 2 });
    expect(next).to.have.property('order').that.deep.equals(['Silent', 'Favorite', 'Auto']);
    expect(bubbled).to.equal(false);
  });
  it('patches speed entity, icon, color and width while preserving other fields', async () => {
    const el = await setup({ type: 'speed-wheel', label: 'Speed' });
    expect(
      await patch(el, 'mp-entity-picker', 'value-changed', { value: 'number.speed' })
    ).to.include({ entity: 'number.speed', label: 'Speed' });
    expect(await patch(el, 'mp-icon-field', 'value-changed', { value: '' })).to.include({
      icon: '',
    });
    expect(await patch(el, 'mp-color-field', 'value-changed', { value: '#abcdef' })).to.include({
      color: '#abcdef',
    });
    expect(await patch(el, 'mp-width-field', 'width-changed', { value: 40 })).to.include({
      width: 40,
    });
  });
  it('explains filtered-air thresholds directly after household dust level', async () => {
    const el = await setup({ type: 'filter-vacuum' });
    const root = el.shadowRoot!;
    const select = root.querySelector('mp-select-field[label="Household dust level"]')!;
    const group = select.parentElement!.nextElementSibling!;
    const heading = group.querySelector('.field-label')!;
    const intro = heading.nextElementSibling!;
    const thresholds = intro.nextElementSibling!;
    const helper = thresholds.nextElementSibling!;
    expect(heading.textContent!.replace(/\s+/g, ' ').trim()).to.equal(
      'Air filtered between vacuums'
    );
    expect(intro.classList.contains('hint')).to.equal(true);
    expect(intro.textContent!.replace(/\s+/g, ' ').trim()).to.equal(
      'How many m³ of air the purifier can clean before the pre-filter needs vacuuming. The household dust level picks which one applies.'
    );
    expect(thresholds.classList.contains('thresholds')).to.equal(true);
    expect(
      Array.from(thresholds.querySelectorAll('.field-label'), (label) => label.textContent)
    ).to.deep.equal(['Low dust (m³)', 'Medium dust (m³)', 'High dust (m³)']);
    expect(thresholds.querySelectorAll('mp-text-field')).to.have.length(3);
    expect(helper.classList.contains('hint')).to.equal(true);
    expect(helper.textContent!.replace(/\s+/g, ' ').trim()).to.equal(
      'Leave empty to use the defaults shown. Medium is about 2 months of mostly-Auto use on a 360 m³/h purifier.'
    );
    expect(root.textContent).not.to.include('Empty thresholds use the defaults shown above.');
  });
  it('patches vacuum fields and prunes empty thresholds, preserving untouched values', async () => {
    const feature: FilterVacuumFeatureConfig = {
      type: 'filter-vacuum',
      thresholds: { low: 100, high: 300 },
    };
    const el = await setup(feature);
    const input = numberInput(el, '[data-level="medium"]');
    expect(input.type).to.equal('number');
    expect(input.placeholder).to.equal('125000');
    input.value = '250';
    const thresholdEvent = oncePromise<{ feature: Feature }>(el, 'feature-changed');
    input.dispatchEvent(new Event('input'));
    expect((await thresholdEvent).detail.feature)
      .to.have.property('thresholds')
      .that.deep.equals({ low: 100, medium: 250, high: 300 });
    const next = await patch(el, 'mp-select-field', 'value-changed', { value: 'high' });
    expect(next).to.include({ dust_level: 'high' });
    expect(feature.thresholds).to.deep.equal({ low: 100, high: 300 });
    el.feature = next;
    await el.updateComplete;
    for (const level of ['low', 'high']) {
      const field = numberInput(el, `[data-level="${level}"]`);
      field.value = '';
      const event = oncePromise<{ feature: Feature }>(el, 'feature-changed');
      field.dispatchEvent(new Event('input'));
      el.feature = (await event).detail.feature;
      await el.updateComplete;
    }
    expect(el.feature).not.to.have.property('thresholds');
  });
  it('edits speed settings and prunes defaults', async () => {
    const el = await setup({
      type: 'speed-wheel',
      estimate_auto: true,
      show_coverage: true,
      display: 'percent',
    });
    expect(el.shadowRoot!.textContent).to.include("Leave empty to use the fan's percentage");
    expect(el.shadowRoot!.textContent).to.include('Needs CADR in card settings');
    const preset = el.shadowRoot!.querySelector<HTMLElementTagNameMap['mp-select-field']>(
      'mp-select-field[label="Preset"]'
    )!;
    expect(preset.options.map((option) => option.label)).to.deep.equal([
      'Auto-detect',
      'None',
      'Auto',
      'Silent',
      'Favorite',
    ]);
    for (const [value, expected] of [
      ['none', false],
      ['preset:Favorite', 'Favorite'],
      ['', undefined],
    ] as const) {
      const next = await patch(el, 'mp-select-field[label="Preset"]', 'value-changed', { value });
      if (expected === undefined) expect(next).not.to.have.property('preset');
      else expect(next).to.include({ preset: expected });
      expect(next).not.to.have.property('estimate_auto');
      expect(next).not.to.have.property('show_coverage');
      expect(next).not.to.have.property('display');
    }
    expect(
      await patch(el, 'mp-select-field[label="Display"]', 'value-changed', { value: 'level' })
    ).to.include({ display: 'level' });
    for (const key of ['estimate_auto', 'show_coverage']) {
      const input = el.shadowRoot!.querySelector(`[data-field="${key}"]`) as HTMLInputElement;
      input.checked = false;
      const event = oncePromise<{ feature: Feature }>(el, 'feature-changed');
      input.dispatchEvent(new Event('change'));
      const next = (await event).detail.feature;
      expect(next).to.include({ [key]: false });
      el.feature = next;
      await el.updateComplete;
      input.checked = true;
      const restored = oncePromise<{ feature: Feature }>(el, 'feature-changed');
      input.dispatchEvent(new Event('change'));
      expect((await restored).detail.feature).not.to.have.property(key);
    }
    el.cardConfig = { type: 'custom:material-purifier-card', entity: 'fan.test', cadr: 300 };
    await el.updateComplete;
    expect(el.shadowRoot!.textContent).not.to.include('Needs CADR in card settings');
    expect(
      await patch(el, 'mp-entity-picker', 'value-changed', { value: '' })
    ).not.to.have.property('entity');
  });
  it('disables tracking setup without a motor speed sensor', async () => {
    const el = await setup({ type: 'filter-vacuum' });
    expect(el.shadowRoot!.querySelector<HTMLButtonElement>('.setup-tracking')!.disabled).to.equal(
      true
    );
    expect(el.shadowRoot!.textContent).to.include('Choose a motor speed sensor in card settings');
  });
  it('creates tracking helpers with progress and emits only the counter id', async () => {
    const original = helperCreator.create;
    let resolve!: (value: { runtimeEntity: string; counterEntity: string }) => void;
    let calls = 0;
    helperCreator.create = async (hass, opts) => {
      calls++;
      expect(hass).to.equal(el.hass);
      expect(opts.rpmEntity).to.equal('sensor.rpm');
      expect(opts.name).to.equal(el.hass.states['fan.test'].attributes.friendly_name);
      return new Promise((done) => {
        resolve = done;
      });
    };
    const el = await setup({ type: 'filter-vacuum', label: 'Clean', dust_level: 'low' });
    el.rpmEntity = 'sensor.rpm';
    await el.updateComplete;
    try {
      const event = oncePromise<{ feature: Feature }>(el, 'feature-changed');
      const button = el.shadowRoot!.querySelector<HTMLButtonElement>('.setup-tracking')!;
      button.click();
      button.click();
      await el.updateComplete;
      expect(calls).to.equal(1);
      expect(button.disabled).to.equal(true);
      expect(el.shadowRoot!.textContent).to.include('Setting up tracking');
      resolve({ runtimeEntity: 'sensor.runtime', counterEntity: 'sensor.counter' });
      expect((await event).detail.feature).to.deep.equal({
        type: 'filter-vacuum',
        counter_entity: 'sensor.counter',
        label: 'Clean',
        dust_level: 'low',
      });
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.setup-tracking')).to.equal(null);
      expect(el.shadowRoot!.querySelector('details summary')!.textContent).to.equal('Advanced');
      expect(el.feature).to.deep.equal({
        type: 'filter-vacuum',
        counter_entity: 'sensor.counter',
        label: 'Clean',
        dust_level: 'low',
      });
    } finally {
      helperCreator.create = original;
    }
  });
  it('shows setup errors inline and allows retry', async () => {
    const original = helperCreator.create;
    helperCreator.create = async () => {
      throw new Error('internal websocket details');
    };
    try {
      const el = await setup({ type: 'filter-vacuum' });
      el.rpmEntity = 'sensor.rpm';
      await el.updateComplete;
      el.shadowRoot!.querySelector<HTMLButtonElement>('.setup-tracking')!.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('[role="alert"]')!.textContent).to.include(
        'Could not set up tracking'
      );
      expect(el.shadowRoot!.textContent).not.to.include('internal websocket details');
      expect(el.shadowRoot!.querySelector<HTMLButtonElement>('.setup-tracking')!.disabled).to.equal(
        false
      );
    } finally {
      helperCreator.create = original;
    }
  });
  it('shows configured tracking with one rounded advanced counter picker', async () => {
    const el = await setup({
      type: 'filter-vacuum',
      counter_entity: 'sensor.counter',
    });
    el.rpmEntity = 'sensor.rpm';
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.setup-tracking')).to.equal(null);
    expect(el.shadowRoot!.querySelector('[role="status"]')!.textContent).to.include(
      'Counting motor runtime since the last vacuum'
    );
    expect(el.shadowRoot!.querySelector('details')!.open).to.equal(false);
    expect(el.shadowRoot!.querySelector('details')!.textContent).to.include(
      'Utility Meter (no cycle) over an Integration of the motor speed sensor'
    );
    const pickers = el.shadowRoot!.querySelectorAll<HTMLElementTagNameMap['mp-entity-picker']>(
      'details mp-entity-picker'
    );
    expect(pickers).to.have.length(1);
    expect(pickers[0].includeDomains).to.deep.equal(['sensor']);
    expect(pickers[0].value).to.equal('sensor.counter');
    expect(
      await patch(el, 'details mp-entity-picker', 'value-changed', { value: 'sensor.other' })
    ).to.deep.equal({ type: 'filter-vacuum', counter_entity: 'sensor.other' });
    const cleared = await patch(el, 'details mp-entity-picker', 'value-changed', { value: '' });
    expect(cleared).not.to.have.property('counter_entity');
    el.feature = cleared;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.setup-tracking')).not.to.equal(null);
  });
  it('does not attach pending tracking helpers to another feature', async () => {
    const original = helperCreator.create;
    let resolve!: (value: { runtimeEntity: string; counterEntity: string }) => void;
    helperCreator.create = () =>
      new Promise((done) => {
        resolve = done;
      });
    try {
      const el = await setup({ type: 'filter-vacuum' });
      el.rpmEntity = 'sensor.rpm';
      await el.updateComplete;
      let emitted = false;
      el.addEventListener('feature-changed', () => {
        emitted = true;
      });
      el.shadowRoot!.querySelector<HTMLButtonElement>('.setup-tracking')!.click();
      el.feature = { type: 'speed-wheel' };
      resolve({ runtimeEntity: 'sensor.runtime', counterEntity: 'sensor.counter' });
      await new Promise((done) => setTimeout(done, 0));
      await el.updateComplete;
      expect(emitted).to.equal(false);
      expect(el.feature).to.deep.equal({ type: 'speed-wheel' });
    } finally {
      helperCreator.create = original;
    }
  });
});
