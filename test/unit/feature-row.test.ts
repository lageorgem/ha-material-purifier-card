import { fixture, html, expect } from '@open-wc/testing';
import { makeHass, fanState } from '../helpers';
import '../../src/features/feature-row';
import type { MpFeatureRow } from '../../src/features/feature-row';
import type { FeatureConfig, MaterialPurifierCardConfig } from '../../src/types';

const cardConfig: MaterialPurifierCardConfig = {
  type: 'custom:material-purifier-card',
  entity: 'fan.test',
  speed: { entity: 'number.speed', preset: 'Favorite' },
  motor_speed_entity: 'sensor.configured_rpm',
  max_rpm: 2200,
  cadr: 360,
};

const cases: { feature: FeatureConfig; tag: string; props: Record<string, unknown> }[] = [
  {
    feature: { type: 'percentage-tile', entity: 'sensor.battery' },
    tag: 'mp-percentage-tile',
    props: { forceOff: false },
  },
  {
    feature: { type: 'fan-presets', label: 'Mode', show_off: true },
    tag: 'mp-fan-presets',
    props: { entity: 'fan.test' },
  },
  {
    feature: { type: 'speed-wheel', entity: 'number.override', label: 'Speed' },
    tag: 'mp-speed-wheel-tile',
    props: {
      entity: 'fan.test',
      cardConfig,
      rpmEntity: 'sensor.resolved_rpm',
    },
  },
  {
    feature: { type: 'filter-vacuum', runtime_entity: 'sensor.runtime' },
    tag: 'mp-filter-vacuum',
    props: { rpmEntity: 'sensor.resolved_rpm', cardConfig },
  },
  {
    feature: {
      type: 'input-select',
      entity: 'input_select.mode',
      display: 'dropdown',
      label: 'Mode',
      options: [{ value: 'Auto', label: 'Automatic' }],
      order: ['Auto'],
    },
    tag: 'mp-input-select',
    props: { entity: 'input_select.mode', display: 'dropdown', label: 'Mode' },
  },
  {
    feature: {
      type: 'switch-group',
      entities: [{ entity: 'switch.lock' }],
      display: 'tile',
      label: 'Controls',
    },
    tag: 'mp-switch-group',
    props: { display: 'tile', label: 'Controls' },
  },
  {
    feature: { type: 'switch-list', entities: [{ entity: 'switch.lock' }], label: 'Switches' },
    tag: 'mp-switch-list',
    props: { label: 'Switches' },
  },
  {
    feature: { type: 'button-list', items: [{ entity: 'button.reset' }], label: 'Actions' },
    tag: 'mp-button-list',
    props: { label: 'Actions' },
  },
  {
    feature: { type: 'entity-tile', entity: 'sensor.temperature' },
    tag: 'mp-entity-tile',
    props: { forceOff: false },
  },
  {
    feature: { type: 'sensor-list', items: [{ entity: 'sensor.pm25' }], label: 'Sensors' },
    tag: 'mp-sensor-list',
    props: { label: 'Sensors' },
  },
];

async function mount(feature: FeatureConfig): Promise<MpFeatureRow> {
  return fixture<MpFeatureRow>(
    html`<mp-feature-row
      .hass=${makeHass({ 'fan.test': fanState() })}
      .entity=${'fan.test'}
      .feature=${feature}
      .cardConfig=${cardConfig}
      .rpmEntity=${'sensor.resolved_rpm'}
    ></mp-feature-row>`
  );
}

describe('mp-feature-row', () => {
  for (const { feature, tag, props } of cases) {
    it(`dispatches ${feature.type} with its properties`, async () => {
      const el = await mount(feature);
      const child = el.shadowRoot!.querySelector(tag) as HTMLElement & Record<string, unknown>;
      expect(child).to.not.equal(null);
      expect(child.hass).to.equal(el.hass);
      for (const [key, value] of Object.entries(props)) expect(child[key]).to.equal(value);
      if (
        ['percentage-tile', 'fan-presets', 'speed-wheel', 'filter-vacuum', 'entity-tile'].includes(
          feature.type
        )
      ) {
        expect(child.config).to.equal(feature);
      }
      if ('entities' in feature) expect(child.entities).to.equal(feature.entities);
      if ('items' in feature) expect(child.items).to.equal(feature.items);
      if (feature.type === 'input-select') {
        expect(child.options).to.equal(feature.options);
        expect(child.order).to.equal(feature.order);
      }
    });

    it(`uses the default width for ${feature.type}`, async () => {
      const el = await mount(feature);
      const tile = ['percentage-tile', 'entity-tile', 'speed-wheel', 'filter-vacuum'].includes(
        feature.type
      );
      expect(el.style.gridColumn).to.equal(tile ? 'span 5' : 'span 10');
    });

    it(`uses explicit width for ${feature.type}`, async () => {
      const el = await mount({ ...feature, width: 30 });
      expect(el.style.gridColumn).to.equal('span 3');
    });
  }

  it('defaults selector display to icons', async () => {
    for (const feature of [
      { type: 'input-select', entity: 'input_select.mode' },
      { type: 'switch-group', entities: [] },
    ] satisfies FeatureConfig[]) {
      const el = await mount(feature);
      const child = el.shadowRoot!.firstElementChild as HTMLElement & { display: string };
      expect(child.display).to.equal('icons');
    }
  });

  it('forwards parentOff and updates it without inferring fan state', async () => {
    const el = await mount({ type: 'entity-tile', entity: 'sensor.temperature' });
    el.parentOff = true;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('mp-entity-tile')!.forceOff).to.equal(true);
    el.parentOff = false;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('mp-entity-tile')!.forceOff).to.equal(false);
  });

  it('forwards parentOff true and false to percentage tiles', async () => {
    const el = await mount({ type: 'percentage-tile', entity: 'sensor.filter' });
    for (const parentOff of [true, false]) {
      el.parentOff = parentOff;
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('mp-percentage-tile')!.forceOff).to.equal(parentOff);
    }
  });

  it('updates span when the feature changes and clamps explicit widths', async () => {
    const el = await mount({ type: 'fan-presets' });
    el.feature = { type: 'speed-wheel' };
    await el.updateComplete;
    expect(el.style.gridColumn).to.equal('span 5');
    for (const [width, span] of [
      [0, 5],
      [-10, 5],
      [NaN, 5],
      [200, 10],
      [36, 4],
    ]) {
      el.feature = { type: 'speed-wheel', width };
      await el.updateComplete;
      expect(el.style.gridColumn).to.equal(`span ${span}`);
    }
  });

  it('updates card-level and resolved properties', async () => {
    const el = await mount({ type: 'filter-vacuum', runtime_entity: 'sensor.runtime' });
    el.rpmEntity = undefined;
    el.cardConfig = { ...cardConfig, max_rpm: undefined, cadr: undefined };
    await el.updateComplete;
    const child = el.shadowRoot!.querySelector('mp-filter-vacuum')!;
    expect(child.rpmEntity).to.equal(undefined);
    expect(child.cardConfig).to.equal(el.cardConfig);
    el.feature = { type: 'speed-wheel' };
    el.entity = 'fan.other';
    el.cardConfig = { ...cardConfig, speed: undefined };
    await el.updateComplete;
    const wheel = el.shadowRoot!.querySelector('mp-speed-wheel-tile')!;
    expect(wheel.entity).to.equal('fan.other');
    expect(wheel.cardConfig).to.equal(el.cardConfig);
    expect(wheel.rpmEntity).to.equal(undefined);
  });

  it('does not hide a row in response to feature-visibility events', async () => {
    const el = await mount({ type: 'fan-presets' });
    el.shadowRoot!.firstElementChild!.dispatchEvent(
      new CustomEvent('feature-visibility', {
        detail: { visible: false },
        bubbles: true,
        composed: true,
      })
    );
    await el.updateComplete;
    expect(el.hasAttribute('hidden')).to.equal(false);
  });

  it('renders an error for an unknown feature type', async () => {
    const el = await mount({ type: 'totally-bogus' } as unknown as FeatureConfig);
    expect(el.shadowRoot!.textContent).to.contain('Unknown feature: totally-bogus');
    expect(el.shadowRoot!.querySelector('.error')).to.not.equal(null);
    expect(el.style.gridColumn).to.equal('span 10');
  });
});
