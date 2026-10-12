import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import '../../src/features/filter-vacuum';
import type { MpFilterVacuum } from '../../src/features/filter-vacuum';
import type { FilterVacuumFeatureConfig, MaterialPurifierCardConfig } from '../../src/types';
import { entityState, makeHass } from '../helpers';

describe('mp-filter-vacuum', () => {
  let clock: sinon.SinonFakeTimers;
  beforeEach(() => {
    clock = sinon.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  });
  afterEach(() => {
    sinon.restore();
    clock.restore();
  });

  async function mount(
    config: Partial<FilterVacuumFeatureConfig> = {},
    counter = '33000',
    card: Partial<MaterialPurifierCardConfig> = {},
    changes = [8250],
    lastReset?: string
  ) {
    const hass = makeHass({
      'sensor.counter': entityState('sensor.counter', counter, { last_reset: lastReset }),
      'input_select.dust': entityState('input_select.dust', 'Medium', {
        options: ['Low', 'Medium', 'High'],
      }),
    });
    const ws = sinon.stub(hass, 'callWS').resolves({
      'sensor.counter': changes.map((change, i) => ({
        start: Date.now() - (changes.length - i) * 3600000,
        change,
      })),
    });
    const el = await fixture<MpFilterVacuum>(
      html` <mp-filter-vacuum
        .hass=${hass}
        .rpmEntity=${'sensor.rpm'}
        .cardConfig=${{ type: 'custom:material-purifier-card', entity: 'fan.purifier', cadr: 360, max_rpm: 2200, ...card }}
        .config=${{ type: 'filter-vacuum', counter_entity: 'sensor.counter', ...config }}
      ></mp-filter-vacuum>`
    );
    await settle(el);
    return { el, hass, ws };
  }
  function button(el: MpFilterVacuum, selector: string): HTMLButtonElement {
    return el.shadowRoot!.querySelector<HTMLButtonElement>(selector)!;
  }
  function value(el: MpFilterVacuum): string {
    return el.shadowRoot!.querySelector('.value')!.textContent!;
  }
  async function settle(el: MpFilterVacuum) {
    await Promise.resolve();
    await Promise.resolve();
    await el.updateComplete;
  }

  for (const [level, fraction] of [
    ['low', 5400 / 250000],
    ['medium', 5400 / 125000],
    ['high', 5400 / 62500],
  ] as const) {
    it(`uses the ${level} threshold for runtime-derived progress without a volume line`, async () => {
      const { el } = await mount({ dust_level: level });
      expect(el.shadowRoot!.querySelector('.arc')!.getAttribute('stroke-dasharray')).to.equal(
        `${fraction} 1`
      );
      expect(el.shadowRoot!.querySelector('.volume')).to.equal(null);
      const text = el.shadowRoot!.querySelector('.tile')!.textContent!;
      expect(text).not.to.contain('~');
      expect(text).not.to.contain('m³');
      expect(text.toLowerCase()).not.to.contain('dust');
    });
  }
  it('defaults the title to Vacuum filter and preserves custom labels', async () => {
    const { el } = await mount();
    expect(el.shadowRoot!.querySelector('.title')!.textContent!.trim()).to.equal('Vacuum filter');
    expect(button(el, '.more-info').getAttribute('aria-label')).to.include('Vacuum filter:');
    el.config = { ...el.config, label: 'Custom reminder' };
    await settle(el);
    expect(el.shadowRoot!.querySelector('.title')!.textContent!.trim()).to.equal('Custom reminder');
  });
  it('prefers configured dust over the entity and applies overrides', async () => {
    const { el } = await mount({
      dust_level_entity: 'input_select.dust',
      dust_level: 'low',
      thresholds: { low: 6000 },
    });
    expect(el.shadowRoot!.querySelector('.arc')!.getAttribute('stroke-dasharray')).to.equal(
      '0.9 1'
    );
  });
  it('follows dust entity updates and defaults missing dust to medium', async () => {
    const { el, hass } = await mount({ dust_level_entity: 'input_select.dust' });
    expect(el.shadowRoot!.querySelector('.arc')!.getAttribute('stroke-dasharray')).to.equal(
      `${5400 / 125000} 1`
    );
    el.hass = {
      ...hass,
      states: { ...hass.states, 'input_select.dust': entityState('input_select.dust', 'Heavy') },
    };
    await settle(el);
    expect(el.shadowRoot!.querySelector('.arc')!.getAttribute('stroke-dasharray')).to.equal(
      `${5400 / 62500} 1`
    );
    el.config = { ...el.config, dust_level_entity: 'select.missing' };
    await settle(el);
    expect(el.shadowRoot!.querySelector('.arc')!.getAttribute('stroke-dasharray')).to.equal(
      `${5400 / 125000} 1`
    );
  });

  it('shows tracking setup when no counter is configured', async () => {
    const { el, ws } = await mount({ counter_entity: undefined });
    expect(value(el)).to.equal('Set up tracking in the editor');
    expect(el.shadowRoot!.querySelector('.volume')).to.equal(null);
    expect(el.shadowRoot!.querySelector('.reset')).to.equal(null);
    expect(ws.called).to.equal(false);
  });
  for (const cadr of [undefined, 0, NaN]) {
    it(`asks for valid CADR (${cadr})`, async () => {
      const { el } = await mount({}, '44000', { cadr });
      expect(value(el)).to.equal('Add CADR in card settings');
    });
  }
  it('asks for fan calibration without a max rpm', async () => {
    const { el } = await mount({}, '44000', { max_rpm: undefined });
    expect(value(el)).to.equal('Calibrate fan speed in card settings');
  });
  it('uses the max rpm from configured calibration', async () => {
    const { el } = await mount({}, '33000', {
      max_rpm: undefined,
      calibration: [
        { value: 10, rpm: 1000 },
        { value: 100, rpm: 2200 },
      ],
    });
    expect(value(el)).to.equal('In 4 days');
  });

  it('uses hourly changes only as fallback and refetches only after more than 60 minutes', async () => {
    const { el, hass, ws } = await mount();
    expect(ws.callCount).to.equal(1);
    expect(ws.firstCall.args[0]).to.include({
      type: 'recorder/statistics_during_period',
      period: 'hour',
    });
    expect(ws.firstCall.args[0].types).to.deep.equal(['change']);
    expect(ws.firstCall.args[0].statistic_ids).to.deep.equal(['sensor.counter']);
    expect(value(el)).to.equal('In 4 days');
    await clock.tickAsync(3600000);
    el.hass = { ...hass };
    await settle(el);
    expect(ws.callCount).to.equal(1);
    await clock.tickAsync(1);
    el.hass = { ...hass };
    await settle(el);
    expect(ws.callCount).to.equal(2);
  });
  it('shows the live monthly ETA without fetching and recomputes on every hass update', async () => {
    const reset = new Date(Date.now() - 0.38 * 3600000).toISOString();
    const { el, hass, ws } = await mount({}, '186.17', { max_rpm: 2048 }, [71.11], reset);
    expect(value(el)).to.equal('In 2 months');
    expect(ws.called).to.equal(false);
    await clock.tickAsync(0.38 * 3600000);
    el.hass = { ...hass };
    await settle(el);
    expect(value(el)).to.equal('In 4 months');
    expect(ws.called).to.equal(false);
    el.hass = {
      ...hass,
      states: {
        ...hass.states,
        'sensor.counter': entityState('sensor.counter', '372.34', { last_reset: reset }),
      },
    };
    await settle(el);
    expect(value(el)).to.equal('In 2 months');
    expect(ws.called).to.equal(false);
  });
  it('uses fallback after a recent reset and stops fetching once the primary matures', async () => {
    const reset = new Date(Date.now()).toISOString();
    const { el, hass, ws } = await mount({}, '0', {}, [], reset);
    expect(value(el)).to.equal('No estimate yet');
    expect(ws.callCount).to.equal(1);
    await clock.tickAsync(3600001);
    el.hass = {
      ...hass,
      states: {
        ...hass.states,
        'sensor.counter': entityState('sensor.counter', '500', { last_reset: reset }),
      },
    };
    await settle(el);
    expect(value(el)).not.to.equal('No estimate yet');
    expect(ws.callCount).to.equal(1);
  });
  it('clears old statistics when the counter entity changes and ignores stale responses', async () => {
    const { el, hass, ws } = await mount();
    let resolve!: (result: Record<string, { change: number }[]>) => void;
    ws.returns(
      new Promise((done) => {
        resolve = done;
      })
    );
    el.config = { ...el.config, counter_entity: 'sensor.other' };
    el.hass = {
      ...hass,
      states: { ...hass.states, 'sensor.other': entityState('sensor.other', '44000') },
    };
    await settle(el);
    expect(value(el)).to.equal('No estimate yet');
    ws.resolves({ 'sensor.counter': [{ start: Date.now() - 3600000, change: 8250 }] });
    el.config = { ...el.config, counter_entity: 'sensor.counter' };
    await settle(el);
    resolve({ 'sensor.other': [{ change: 1 }] });
    await settle(el);
    expect(value(el)).to.equal('In 4 days');
  });
  it('handles recorder errors without showing raw error text', async () => {
    const { el, hass, ws } = await mount();
    ws.rejects(new Error('Recorder unavailable'));
    await clock.tickAsync(3600001);
    el.hass = { ...hass };
    await settle(el);
    expect(value(el)).to.equal('No estimate yet');
  });
  it('shows Due now with error accent, badge and the configured icon', async () => {
    const { el } = await mount({ color: 'green', icon: 'mdi:custom' }, '800000');
    expect(value(el)).to.equal('Due now');
    const tile = el.shadowRoot!.querySelector<HTMLElement>('.tile')!;
    expect(tile.classList.contains('on')).to.equal(true);
    expect(tile.style.getPropertyValue('--mp-tile-accent')).to.equal('var(--mp-error)');
    expect(el.shadowRoot!.querySelector('.badge')).not.to.equal(null);
    expect(el.shadowRoot!.querySelector('ha-icon')!.getAttribute('icon')).to.equal('mdi:custom');
  });

  it('asks a question and resets the counter once on confirmation', async () => {
    const { el, hass } = await mount();
    button(el, '.reset').click();
    await settle(el);
    expect(hass.__calls).to.have.length(0);
    expect(el.shadowRoot!.querySelector('.title')!.textContent!.trim()).to.equal(
      'Did you vacuum the filter?'
    );
    expect(el.shadowRoot!.querySelector('.value')).to.equal(null);
    expect(el.shadowRoot!.querySelector('.reset')).to.equal(null);
    expect(button(el, '.confirm').getAttribute('aria-label')).to.equal(
      'Yes, I vacuumed the filter'
    );
    expect(button(el, '.cancel').getAttribute('aria-label')).to.equal('Cancel');
    expect(el.shadowRoot!.activeElement).to.equal(button(el, '.confirm'));
    el.hass = {
      ...hass,
      states: { ...hass.states, 'sensor.counter': entityState('sensor.counter', '33000.125') },
    };
    await settle(el);
    button(el, '.confirm').click();
    button(el, '.confirm').click();
    await settle(el);
    expect(hass.__calls).to.have.length(1);
    expect(hass.__calls[0]).to.include({ domain: 'utility_meter', service: 'reset' });
    expect(hass.__calls[0].data).to.deep.equal({
      entity_id: 'sensor.counter',
    });
    expect(el.shadowRoot!.querySelector('.actions')).to.equal(null);
    expect(el.shadowRoot!.activeElement).to.equal(button(el, '.reset'));
  });
  it('shows a recoverable inline service error', async () => {
    const { el, hass } = await mount();
    sinon.stub(hass, 'callService').rejects(new Error('Internal server error'));
    button(el, '.reset').click();
    await settle(el);
    button(el, '.confirm').click();
    await settle(el);
    expect(el.shadowRoot!.querySelector('[role="alert"]')!.textContent).to.equal(
      'Unable to update. Try again.'
    );
    expect(button(el, '.reset').disabled).to.equal(false);
  });
  for (const action of ['cancel', 'timeout', 'escape'] as const) {
    it(`cancels without a service call on ${action}`, async () => {
      const { el, hass } = await mount();
      button(el, '.reset').click();
      await settle(el);
      if (action === 'cancel') button(el, '.cancel').click();
      if (action === 'timeout') {
        await clock.tickAsync(9999);
        expect(el.shadowRoot!.querySelector('.actions')).not.to.equal(null);
        await clock.tickAsync(1);
      }
      if (action === 'escape')
        button(el, '.confirm').dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true })
        );
      await settle(el);
      expect(hass.__calls).to.have.length(0);
      expect(el.shadowRoot!.activeElement).to.equal(button(el, '.reset'));
      expect(clock.countTimers()).to.equal(0);
    });
  }
  it('does not open more-info while asking', async () => {
    const { el } = await mount();
    const spy = sinon.spy();
    el.addEventListener('hass-more-info', spy);
    button(el, '.reset').click();
    await settle(el);
    button(el, '.more-info').click();
    button(el, '.cancel').click();
    await settle(el);
    button(el, '.reset').click();
    await settle(el);
    button(el, '.confirm').click();
    await settle(el);
    expect(spy.called).to.equal(false);
  });

  it('fits title, ETA and padded ring in a 140px tile with no volume text', async () => {
    const { el, hass, ws } = await mount();
    el.style.width = '140px';
    el.style.height = '162px';
    const eta = el.shadowRoot!.querySelector<HTMLElement>('.value')!;
    expect(eta.textContent).to.equal('In 4 days');
    expect(eta.clientWidth).to.be.greaterThan(0);
    expect(eta.scrollWidth).to.be.at.most(eta.clientWidth);
    expect(eta.scrollHeight).to.be.at.most(eta.clientHeight);
    expect(getComputedStyle(eta).whiteSpace).to.equal('normal');
    expect(getComputedStyle(eta).webkitLineClamp).to.equal('2');
    const ring = el.shadowRoot!.querySelector<HTMLElement>('.ring')!;
    expect(ring.getBoundingClientRect().width).to.equal(44);
    expect(ring.getBoundingClientRect().height).to.equal(44);
    expect(
      getComputedStyle(ring.querySelector('ha-icon')!).getPropertyValue('--mdc-icon-size').trim()
    ).to.equal('20px');
    expect(ring.querySelector('svg')!.getAttribute('viewBox')).to.equal('0 0 44 44');
    for (const circle of ring.querySelectorAll('circle')) {
      expect(circle.getAttribute('stroke-width')).to.equal('4');
      expect(circle.getAttribute('r')).to.equal('20');
    }
    const text = el.shadowRoot!.querySelector<HTMLElement>('.text')!;
    expect([...text.children].map((child) => child.className)).to.deep.equal(['title', 'value']);
    expect(button(el, '.reset').getBoundingClientRect().top).to.equal(
      ring.getBoundingClientRect().top
    );
    expect(ring.getBoundingClientRect().bottom).to.be.at.most(text.getBoundingClientRect().top);
    expect(button(el, '.reset').getBoundingClientRect().bottom).to.be.at.most(
      text.getBoundingClientRect().top
    );
    expect(eta.getBoundingClientRect().bottom).to.be.at.most(el.getBoundingClientRect().bottom);
    ws.resolves({});
    await clock.tickAsync(3600001);
    el.hass = { ...hass };
    await settle(el);
    expect(eta.textContent).to.equal('No estimate yet');
    expect(eta.scrollWidth).to.be.at.most(eta.clientWidth);
    expect(eta.scrollHeight).to.be.at.most(eta.clientHeight);
    el.style.width = '330px';
    expect(button(el, '.reset').getBoundingClientRect().bottom).to.be.at.most(
      text.getBoundingClientRect().top
    );
  });

  for (const width of [140, 330]) {
    it(`keeps idle height and hides the ring while asking at ${width}px`, async () => {
      const { el } = await mount();
      el.style.width = `${width}px`;
      const tile = el.shadowRoot!.querySelector<HTMLElement>('.tile')!;
      const ring = el.shadowRoot!.querySelector<HTMLElement>('.ring')!;
      const height = tile.getBoundingClientRect().height;
      button(el, '.reset').click();
      await settle(el);
      expect(tile.getBoundingClientRect().height).to.be.closeTo(height, 0.5);
      expect(el.getBoundingClientRect().height).to.be.closeTo(height, 0.5);
      expect(ring.getBoundingClientRect().height).to.equal(0);
      const title = el.shadowRoot!.querySelector<HTMLElement>('.title')!;
      const actions = el.shadowRoot!.querySelector<HTMLElement>('.actions')!;
      expect(title.scrollHeight).to.be.at.most(title.clientHeight);
      expect(title.scrollWidth).to.be.at.most(title.clientWidth);
      expect(title.getBoundingClientRect().bottom).to.be.at.most(
        actions.getBoundingClientRect().top
      );
      expect(actions.getBoundingClientRect().bottom).to.be.at.most(
        tile.getBoundingClientRect().bottom
      );
      button(el, '.cancel').click();
      await settle(el);
      expect(tile.getBoundingClientRect().height).to.be.closeTo(height, 0.5);
      expect(ring.getBoundingClientRect().height).to.equal(44);
    });
    it(`fits the question and connected segments in a ${width}×162 tile`, async () => {
      const { el } = await mount();
      el.style.width = `${width}px`;
      el.style.height = '162px';
      const tile = el.shadowRoot!.querySelector<HTMLElement>('.tile')!;
      const height = tile.getBoundingClientRect().height;
      button(el, '.reset').click();
      await settle(el);
      expect(tile.getBoundingClientRect().height).to.be.closeTo(height, 0.5);
      const title = el.shadowRoot!.querySelector<HTMLElement>('.title')!;
      const text = el.shadowRoot!.querySelector<HTMLElement>('.text')!;
      expect(title.scrollHeight).to.be.at.most(title.clientHeight);
      expect(title.scrollWidth).to.be.at.most(title.clientWidth);
      expect(getComputedStyle(title).textOverflow).not.to.equal('ellipsis');
      expect(getComputedStyle(title).whiteSpace).to.equal('normal');
      expect(title.clientHeight).to.be.at.most(
        parseFloat(getComputedStyle(title).lineHeight) * 3 + 1
      );
      const confirm = button(el, '.confirm').getBoundingClientRect();
      const cancel = button(el, '.cancel').getBoundingClientRect();
      expect(confirm.width).to.be.at.least(48);
      expect(cancel.width).to.equal(confirm.width);
      expect(confirm.height).to.equal(40);
      expect(cancel.left - confirm.right).to.equal(2);
      expect(confirm.left).to.equal(text.getBoundingClientRect().left);
      expect(cancel.right).to.equal(text.getBoundingClientRect().right);
      expect(cancel.bottom).to.be.at.most(el.getBoundingClientRect().bottom);
      const target = el.shadowRoot!.elementFromPoint(
        confirm.x + confirm.width / 2,
        confirm.y + confirm.height / 2
      )!;
      expect(target.closest('button')).to.equal(button(el, '.confirm'));
    });
  }

  for (const counter of ['unavailable', 'unknown', 'NaN', 'Infinity', '', '12junk']) {
    it(`hides the arc and disables marking for unavailable counter ${counter}`, async () => {
      const { el } = await mount({}, counter);
      expect(value(el)).to.equal('Tracking unavailable');
      expect(el.shadowRoot!.querySelector('.arc')!.getAttribute('opacity')).to.equal('0');
      expect(button(el, '.reset').disabled).to.equal(true);
    });
  }
  it('does not reset if the counter becomes unavailable during confirmation', async () => {
    const { el, hass } = await mount();
    button(el, '.reset').click();
    await settle(el);
    el.hass = {
      ...hass,
      states: { ...hass.states, 'sensor.counter': entityState('sensor.counter', 'unavailable') },
    };
    await settle(el);
    button(el, '.confirm').click();
    await settle(el);
    expect(hass.__calls).to.have.length(0);
  });
  it('handles a reset counter and missing counter state without a round-cap dot', async () => {
    const { el, hass } = await mount({}, '0');
    expect(el.shadowRoot!.querySelector('.arc')!.getAttribute('opacity')).to.equal('0');
    expect(value(el)).to.equal('In 4 days');
    expect(button(el, '.reset').disabled).to.equal(false);
    el.hass = { ...hass, states: {} };
    await settle(el);
    expect(value(el)).to.equal('Tracking unavailable');
  });
  it('opens counter details with a bubbling composed event through the ETA', async () => {
    const { el } = await mount();
    const spy = sinon.spy();
    el.addEventListener('hass-more-info', spy);
    const rect = el.shadowRoot!.querySelector<HTMLElement>('.value')!.getBoundingClientRect();
    const target = el.shadowRoot!.elementFromPoint(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2
    ) as HTMLElement;
    expect(target).to.equal(button(el, '.more-info'));
    target.click();
    const event = spy.firstCall.args[0] as CustomEvent<{ entityId: string }>;
    expect(event.detail).to.deep.equal({ entityId: 'sensor.counter' });
    expect(event.bubbles).to.equal(true);
    expect(event.composed).to.equal(true);
  });
  it('ignores statistics after disconnect and clears confirmation timers', async () => {
    const { el, hass, ws } = await mount();
    let resolve!: (result: Record<string, { change: number }[]>) => void;
    ws.returns(
      new Promise((done) => {
        resolve = done;
      })
    );
    await clock.tickAsync(3600001);
    el.hass = { ...hass };
    await settle(el);
    button(el, '.reset').click();
    await settle(el);
    el.remove();
    resolve({ 'sensor.counter': [{ change: 2200 }] });
    await settle(el);
    expect(clock.countTimers()).to.equal(0);
    expect(value(el)).to.equal('In 4 days');
  });
});
