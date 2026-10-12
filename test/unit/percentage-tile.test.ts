import { expect, fixture, html } from '@open-wc/testing';
import { MpPercentageTile, percentFill, rangeColor } from '../../src/features/percentage-tile';
import '../../src/features/entity-tile';
import type { PercentageTileFeatureConfig, PercentRange } from '../../src/types';
import { entityState, makeHass } from '../helpers';

const ranges: PercentRange[] = [
  { to: 20, color: '#ea4335' },
  { from: 20, to: 50, color: '#f9ab00' },
  { from: 50, color: '#34a853' },
];

async function tile(value = '93', config: Partial<PercentageTileFeatureConfig> = {}) {
  return fixture<MpPercentageTile>(html`
    <mp-percentage-tile
      .hass=${makeHass({
        'sensor.filter': entityState('sensor.filter', value, {
          friendly_name: 'Filter life',
          unit_of_measurement: '%',
        }),
      })}
      .config=${{ type: 'percentage-tile', entity: 'sensor.filter', ...config }}
    ></mp-percentage-tile>
  `);
}

describe('percentage tile helpers', () => {
  it('normalizes and clamps values', () => {
    expect(percentFill(93)).to.equal(93);
    expect(percentFill(150)).to.equal(100);
    expect(percentFill(-5)).to.equal(0);
    expect(percentFill(30, 20, 40)).to.equal(50);
    expect(percentFill(null)).to.equal(null);
    expect(percentFill(NaN)).to.equal(null);
    expect(percentFill(10, 20, 20)).to.equal(null);
    expect(percentFill(10, 20, 0)).to.equal(null);
  });

  it('matches open ends, first match, and the last inclusive upper boundary', () => {
    expect(rangeColor(15, ranges, 'fallback')).to.equal('#ea4335');
    expect(rangeColor(20, ranges, 'fallback')).to.equal('#f9ab00');
    expect(rangeColor(35, ranges, 'fallback')).to.equal('#f9ab00');
    expect(rangeColor(100, ranges, 'fallback')).to.equal('#34a853');
    expect(rangeColor(-10, ranges, 'fallback')).to.equal('#ea4335');
    const bounded = [{ from: 0, to: 100, color: 'green' }];
    expect(rangeColor(100, bounded, 'fallback')).to.equal('green');
    expect(rangeColor(101, bounded, 'fallback')).to.equal('fallback');
    expect(rangeColor(20, [{ to: 20, color: 'red' }, ...bounded], 'fallback')).to.equal('green');
    expect(rangeColor(10, [{ color: 'first' }, { color: 'second' }], 'fallback')).to.equal('first');
    expect(rangeColor(null, ranges, 'fallback')).to.equal('fallback');
    expect(rangeColor(NaN, ranges, 'fallback')).to.equal('fallback');
    expect(rangeColor(10, undefined, 'fallback')).to.equal('fallback');
  });
});

describe('mp-percentage-tile', () => {
  it('matches off entity tile styling and hides both layers as forceOff changes', async () => {
    const el = await tile('93', { ranges });
    const reference = await fixture(html`
      <mp-entity-tile
        .hass=${el.hass}
        .config=${{ type: 'entity-tile', entity: 'sensor.filter', color: '#34a853' }}
      ></mp-entity-tile>
    `);
    const meter = el.shadowRoot!.querySelector<HTMLElement>('.tile')!;
    const entityTile = reference.shadowRoot!.querySelector<HTMLElement>('.tile')!;
    // Compare settled states without waiting for the shared radius/color transitions.
    for (const host of [el, reference]) {
      const style = document.createElement('style');
      style.textContent = '* { transition: none !important; }';
      host.shadowRoot!.append(style);
    }
    const fill = el.shadowRoot!.querySelector<HTMLElement>('.fill')!;
    const activeFill = getComputedStyle(fill).backgroundColor;
    for (const forceOff of [false, true, false]) {
      el.forceOff = forceOff;
      reference.forceOff = forceOff;
      await Promise.all([el.updateComplete, reference.updateComplete]);
      expect(meter.classList.contains('on')).to.equal(!forceOff);
      expect(getComputedStyle(meter).borderRadius).to.equal(
        getComputedStyle(entityTile).borderRadius
      );
      expect(getComputedStyle(meter).overflow).to.equal('hidden');
      for (const selector of ['.ic', '.title', '.value']) {
        const actual = getComputedStyle(el.shadowRoot!.querySelector(selector)!);
        const expected = getComputedStyle(reference.shadowRoot!.querySelector(selector)!);
        expect(actual.color).to.equal(expected.color);
        expect(actual.backgroundColor).to.equal(expected.backgroundColor);
      }
      expect(fill.style.width).to.equal('93%');
      for (const layer of el.shadowRoot!.querySelectorAll('.fill, .fade')) {
        expect(getComputedStyle(layer).opacity).to.equal(forceOff ? '0' : '1');
      }
      expect(el.shadowRoot!.querySelector('.value')!.textContent).to.equal('93 %');
      if (forceOff) {
        expect(getComputedStyle(meter).backgroundColor).to.equal(
          getComputedStyle(entityTile).backgroundColor
        );
        expect(meter.style.getPropertyValue('--mp-tile-accent')).to.equal('');
      } else {
        expect(getComputedStyle(fill).backgroundColor).to.equal(activeFill);
      }
    }
  });

  it('treats zero as available but a missing entity as inactive', async () => {
    const el = await tile('0');
    expect(el.shadowRoot!.querySelector('.tile')!.classList.contains('on')).to.equal(true);
    el.hass = makeHass({});
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.tile')!.classList.contains('on')).to.equal(false);
  });

  it('keeps the entire 93% solid and adds the fade beyond it', async () => {
    const el = await tile();
    const fill = el.shadowRoot!.querySelector<HTMLElement>('.fill')!;
    const fade = el.shadowRoot!.querySelector<HTMLElement>('.fade')!;
    expect(fill.style.width).to.equal('93%');
    expect(fade.style.left).to.equal('93%');
    expect(parseFloat(getComputedStyle(fade).width)).to.be.closeTo(el.offsetWidth * 0.1, 0.1);
    expect(el.shadowRoot!.querySelector('.value')!.textContent).to.equal('93 %');
  });

  it('fills 100% and clips the additive fade', async () => {
    const el = await tile('100');
    expect(el.shadowRoot!.querySelector<HTMLElement>('.fill')!.style.width).to.equal('100%');
    expect(el.shadowRoot!.querySelector<HTMLElement>('.fade')!.style.left).to.equal('100%');
    expect(getComputedStyle(el.shadowRoot!.querySelector('.tile')!).overflow).to.equal('hidden');
  });

  it('hides both layers at zero', async () => {
    const el = await tile('0');
    for (const layer of el.shadowRoot!.querySelectorAll<HTMLElement>('.fill, .fade')) {
      expect(layer.style.opacity).to.equal('0');
    }
  });

  it('applies filter-life range colors', async () => {
    for (const [value, color] of [
      ['15', '#ea4335'],
      ['35', '#f9ab00'],
      ['100', '#34a853'],
    ]) {
      const el = await tile(value, { ranges });
      expect(
        el
          .shadowRoot!.querySelector<HTMLElement>('.tile')!
          .style.getPropertyValue('--mp-tile-accent')
      ).to.equal(color);
    }
  });

  it('shows an unavailable value without fill or a misleading aria value', async () => {
    for (const value of ['unavailable', 'unknown', 'not a number']) {
      const el = await tile(value);
      const reference = await fixture(html`
        <mp-entity-tile
          .hass=${el.hass}
          .config=${{ type: 'entity-tile', entity: 'sensor.filter' }}
          .forceOff=${true}
        ></mp-entity-tile>
      `);
      for (const selector of ['.tile', '.ic', '.title', '.value']) {
        const actual = getComputedStyle(el.shadowRoot!.querySelector(selector)!);
        const expected = getComputedStyle(reference.shadowRoot!.querySelector(selector)!);
        expect(actual.backgroundColor).to.equal(expected.backgroundColor);
        expect(actual.color).to.equal(expected.color);
        expect(actual.borderRadius).to.equal(expected.borderRadius);
      }
      expect(el.shadowRoot!.querySelector('.tile')!.classList.contains('on')).to.equal(false);
      expect(el.shadowRoot!.querySelector('.value')!.textContent).to.equal('—');
      for (const layer of el.shadowRoot!.querySelectorAll('.fill, .fade')) {
        expect(getComputedStyle(layer).opacity).to.equal('0');
      }
      expect(el.shadowRoot!.querySelector('.tile')!.hasAttribute('aria-valuenow')).to.equal(false);
    }
  });

  it('exposes meter bounds and the clamped raw value', async () => {
    const el = await tile('30', { min: 20, max: 40 });
    const meter = el.shadowRoot!.querySelector('[role="meter"]')!;
    expect(meter.getAttribute('aria-label')).to.equal('Filter life');
    expect(meter.getAttribute('aria-valuemin')).to.equal('20');
    expect(meter.getAttribute('aria-valuemax')).to.equal('40');
    expect(meter.getAttribute('aria-valuenow')).to.equal('30');
    expect(el.shadowRoot!.querySelector<HTMLElement>('.fill')!.style.width).to.equal('50%');
  });

  it('reads attributes and uses entity display formatting without duplicating units', async () => {
    const el = await tile('10', {
      attribute: 'remaining',
      name: 'Remaining',
      icon: 'mdi:air-filter',
    });
    let formattedState = '';
    el.hass = Object.assign(
      makeHass({
        'sensor.filter': entityState('sensor.filter', '10', {
          remaining: 93.25,
          unit_of_measurement: '%',
        }),
      }),
      {
        formatEntityState: (state: { state: string }) => {
          formattedState = state.state;
          return '93.3 %';
        },
      }
    );
    await el.updateComplete;
    expect(formattedState).to.equal('93.25');
    expect(el.shadowRoot!.querySelector('.value')!.textContent).to.equal('93.3 %');
    expect(el.shadowRoot!.querySelector('ha-icon')!.getAttribute('icon')).to.equal(
      'mdi:air-filter'
    );
  });

  it('opens more-info by default for clicks and Enter/Space, even for a fan', async () => {
    const el = await tile('93', { entity: 'fan.test' });
    const events: CustomEvent[] = [];
    el.addEventListener('hass-more-info', (event) => events.push(event as CustomEvent));
    const meter = el.shadowRoot!.querySelector<HTMLElement>('.tile')!;
    meter.click();
    for (const key of ['Enter', ' ']) {
      meter.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    }
    expect(events).to.have.length(3);
    expect(events.every((event) => event.detail.entityId === 'fan.test')).to.equal(true);
    expect(el.hass.callService).to.be.a('function');
  });

  it('honors an explicit tap action', async () => {
    const el = await tile('93', {
      tap_action: { action: 'more-info', entity: 'sensor.other' },
    });
    let entityId = '';
    el.addEventListener('hass-more-info', (event) => {
      entityId = (event as CustomEvent).detail.entityId;
    });
    el.shadowRoot!.querySelector<HTMLElement>('.tile')!.click();
    expect(entityId).to.equal('sensor.other');
  });
});
