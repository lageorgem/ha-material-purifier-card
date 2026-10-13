import { expect, fixture, html, fixtureCleanup } from '@open-wc/testing';
import sinon from 'sinon';
import { sendKeys } from '@web/test-runner-commands';
import { MpSpeedWheelTile } from '../../src/features/speed-wheel-tile';
import type { MpSpeedWheel } from '../../src/features/speed-wheel';
import { entityState, fanState, makeHass, type TestHass } from '../helpers';
import '../../src/features/speed-wheel-tile';

describe('mp-speed-wheel-tile', () => {
  let clock: sinon.SinonFakeTimers;
  let tile: MpSpeedWheelTile;
  let hass: TestHass;

  beforeEach(async () => {
    hass = makeHass({
      'fan.test': fanState(),
      'number.speed': entityState('number.speed', '3', { min: 1, max: 10, step: 1 }),
    });
    tile = await fixture<MpSpeedWheelTile>(html`
      <mp-speed-wheel-tile
        .hass=${hass}
        .entity=${'fan.test'}
        .config=${{ type: 'speed-wheel', label: 'Speed', icon: 'mdi:fan', color: '#123456' }}
        .cardConfig=${{ type: 'custom:material-purifier-card', entity: 'fan.test', speed: { entity: 'number.speed', display: 'level' } }}
      ></mp-speed-wheel-tile>
    `);
    clock = sinon.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    fixtureCleanup();
    clock.restore();
    sinon.restore();
  });

  const wheel = (): MpSpeedWheel => tile.shadowRoot!.querySelector('mp-speed-wheel')!;
  const valueText = (): string => tile.shadowRoot!.querySelector('.value')!.textContent!.trim();
  const change = (value: number, type = 'value-changed'): void => {
    wheel().dispatchEvent(new CustomEvent(type, { detail: { value } }));
  };

  const showEstimatedSpeed = async (rpm = '1250', preset = 'Auto'): Promise<void> => {
    tile.config = { ...tile.config, entity: 'number.speed', display: 'percent' };
    tile.cardConfig = { ...tile.cardConfig, cadr: 360, max_rpm: 2100 };
    tile.hass = Object.assign(
      makeHass({
        'fan.test': fanState('fan.test', 'on', { preset_mode: preset }),
        'number.speed': entityState('number.speed', '14', { min: 0, max: 14, step: 1 }),
        'sensor.rpm': entityState('sensor.rpm', rpm, { unit_of_measurement: 'rpm' }),
        'sensor.external_rpm': entityState('sensor.external_rpm', '1250', {
          unit_of_measurement: 'rpm',
        }),
      }),
      {
        entities: {
          'fan.test': { entity_id: 'fan.test', device_id: 'device' },
          'sensor.rpm': { entity_id: 'sensor.rpm', device_id: 'device' },
          'sensor.external_rpm': { entity_id: 'sensor.external_rpm', device_id: 'other-device' },
        },
      }
    );
    await tile.updateComplete;
    await clock.tickAsync(0);
    await tile.updateComplete;
    await wheel().updateComplete;
  };

  const calibrationStub = () =>
    sinon.stub(MpSpeedWheelTile, 'calibrationProvider').resolves({
      points: [
        { detent: 0, rpm: 400 },
        { detent: 14, rpm: 2100 },
      ],
    });

  for (const [theme, background] of [
    ['light', '#e9e1d3'],
    ['dark', '#25232a'],
  ]) {
    it(`matches both gradient ends to the ${theme} tile in Manual, Auto and Off`, async () => {
      tile.style.setProperty('--mp-surface-container', background);
      tile.style.setProperty('--mp-surface-container-highest', background);
      const drum = wheel().shadowRoot!.querySelector<HTMLElement>('.drum')!;
      surface().style.transition = 'none';
      drum.style.transition = 'none';
      for (const accent of ['#123456', '#e25a91']) {
        tile.config = { ...tile.config, color: accent };
        for (const [preset, state] of [
          ['Favorite', 'on'],
          ['Auto', 'on'],
          ['Favorite', 'off'],
        ]) {
          await reportPreset(preset, state);
          await wheel().updateComplete;
          // Rendering a new accent replaces the tile's inline style attribute.
          surface().style.transition = 'none';
          const color = getComputedStyle(surface()).backgroundColor;
          const gradient = getComputedStyle(drum).backgroundImage;
          expect(
            gradient.startsWith(`linear-gradient(${color},`),
            `${color}: ${gradient}`
          ).to.equal(true);
          expect(gradient.endsWith(`${color})`), `${color}: ${gradient}`).to.equal(true);
        }
      }
    });
  }

  it('keeps the end color synchronized during on/off background transitions', async () => {
    clock.restore();
    tile.style.setProperty('--mp-surface-container', '#e9e1d3');
    const drum = wheel().shadowRoot!.querySelector<HTMLElement>('.drum')!;
    const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    // Settle the initial theme change before testing both directions.
    for (let i = 0; i < 20; i++) await frame();
    for (const state of ['on', 'off']) {
      await reportPreset('Favorite', state);
      for (let i = 0; i < 20; i++) {
        await frame();
        const color = getComputedStyle(surface()).backgroundColor;
        const gradient = getComputedStyle(drum).backgroundImage;
        expect(gradient.startsWith(`linear-gradient(${color},`), gradient).to.equal(true);
        expect(gradient.endsWith(`${color})`), gradient).to.equal(true);
      }
    }
  });

  const estimatedPreset = async (preset: string): Promise<void> => {
    tile.hass = {
      ...tile.hass,
      states: {
        ...tile.hass.states,
        'fan.test': fanState('fan.test', 'on', { preset_mode: preset }),
      },
    };
    await tile.updateComplete;
  };

  it('restores the estimate after tapped Manual and Auto reports without remounting', async () => {
    calibrationStub();
    await showEstimatedSpeed();
    surface().click();
    await estimatedPreset('Favorite');
    await clock.tickAsync(0);
    let finish!: () => void;
    tile.hass.callService = sinon.stub().returns(
      new Promise<void>((done) => {
        finish = done;
      })
    );
    surface().click();
    await estimatedPreset('Auto');
    finish();
    await clock.tickAsync(0);
    await tile.updateComplete;
    expect(valueText()).to.equal('53%');
  });

  it('restores the estimate after externally reported Manual and Auto', async () => {
    calibrationStub();
    await showEstimatedSpeed();
    await estimatedPreset('Favorite');
    expect(valueText()).not.to.include('≈');
    await estimatedPreset('Auto');
    expect(valueText()).to.equal('53%');
  });

  it('accepts calibration resolving in Manual after a toggle', async () => {
    let finish!: (cal: { points: { detent: number; rpm: number }[] }) => void;
    sinon.stub(MpSpeedWheelTile, 'calibrationProvider').returns(
      new Promise((done) => {
        finish = done;
      })
    );
    await showEstimatedSpeed();
    surface().click();
    await estimatedPreset('Favorite');
    finish({
      points: [
        { detent: 0, rpm: 400 },
        { detent: 14, rpm: 2100 },
      ],
    });
    await clock.tickAsync(0);
    await estimatedPreset('Auto');
    expect(valueText()).to.equal('53%');
  });

  it('restores the estimate immediately after wheel Manual returns to Auto', async () => {
    calibrationStub();
    await showEstimatedSpeed();
    wheel().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    await clock.tickAsync(600);
    await estimatedPreset('Favorite');
    await estimatedPreset('Auto');
    expect(valueText()).to.equal('53%');
  });

  for (const duration of [29999, 30000]) {
    it(`refreshes once only after a qualifying ${duration} ms Manual run and retains the old curve`, async () => {
      const provider = calibrationStub();
      let finish!: (cal: { points: { detent: number; rpm: number }[] }) => void;
      provider.onSecondCall().returns(
        new Promise((done) => {
          finish = done;
        })
      );
      await showEstimatedSpeed();
      await estimatedPreset('Favorite');
      await clock.tickAsync(duration);
      await estimatedPreset('Auto');
      await estimatedPreset('Auto');
      expect(provider.callCount).to.equal(duration >= 30000 ? 2 : 1);
      expect(valueText()).to.equal('53%');
      if (duration >= 30000) {
        expect(provider.secondCall.args[2]).to.include({ force: true });
        finish({
          points: [
            { detent: 0, rpm: 400 },
            { detent: 14, rpm: 1250 },
          ],
        });
        await clock.tickAsync(0);
        await tile.updateComplete;
        expect(valueText()).to.equal('100%');
      }
    });
  }

  it('bypasses the tile null retry delay after a qualifying Manual run', async () => {
    const provider = sinon.stub(MpSpeedWheelTile, 'calibrationProvider').resolves(null);
    provider.onSecondCall().resolves({
      points: [
        { detent: 0, rpm: 400 },
        { detent: 14, rpm: 2100 },
      ],
    });
    await showEstimatedSpeed();
    await estimatedPreset('Favorite');
    await clock.tickAsync(30000);
    await estimatedPreset('Auto');
    await clock.tickAsync(0);
    await tile.updateComplete;
    expect(provider.calledTwice).to.equal(true);
    expect(provider.secondCall.args[2]).to.include({ force: true });
    expect(valueText()).to.equal('53%');
  });

  it('estimates Auto and Sleep from calibrated RPM on the exact target lattice', async () => {
    const provider = calibrationStub();
    for (const preset of ['Auto', 'Sleep']) {
      await showEstimatedSpeed('1250', preset);
      expect(valueText()).to.equal('53%');
      expect(wheel().value).to.equal(7);
      expect(wheel().valueText).to.equal('Current speed 53%, 15–26 m²');
      expect(tile.shadowRoot!.querySelector('.coverage')!.textContent!.trim()).to.equal('15–26 m²');
      expect(tile.shadowRoot!.querySelector('.tile')!.classList.contains('on')).to.equal(false);
    }
    expect(provider.calledOnce).to.equal(true);
    expect(provider.firstCall.args[1]).to.include({
      fanEntity: 'fan.test',
      speedEntity: 'number.speed',
      rpmEntity: 'sensor.rpm',
      speedPreset: 'Favorite',
    });
  });

  it('uses an explicit non-sibling RPM sensor for calibration and the Auto estimate', async () => {
    const provider = calibrationStub();
    tile.rpmEntity = 'sensor.external_rpm';
    await showEstimatedSpeed('2100');
    expect(provider.firstCall.args[1].rpmEntity).to.equal('sensor.external_rpm');
    expect(valueText()).to.equal('53%');
    expect(wheel().value).to.equal(7);

    tile.rpmEntity = undefined;
    await tile.updateComplete;
    await clock.tickAsync(0);
    await tile.updateComplete;
    expect(provider.calledTwice).to.equal(true);
    expect(provider.secondCall.args[1].rpmEntity).to.equal('sensor.rpm');
    expect(wheel().value).to.equal(14);
  });

  it('uses an explicit non-sibling RPM sensor for the Auto fallback', async () => {
    const provider = sinon.stub(MpSpeedWheelTile, 'calibrationProvider').resolves(null);
    tile.rpmEntity = 'sensor.external_rpm';
    await showEstimatedSpeed('432');
    expect(provider.firstCall.args[1].rpmEntity).to.equal('sensor.external_rpm');
    expect(valueText()).to.equal('Auto');
    expect(tile.shadowRoot!.querySelector('.secondary')!.textContent!.trim()).to.equal(
      `${(1250).toLocaleString()} rpm`
    );
    expect(wheel().valueText).to.equal('Auto mode');
  });

  it('uses device-reported percentage in Auto without calibration', async () => {
    const provider = calibrationStub();
    tile.cardConfig = { ...tile.cardConfig, speed: undefined };
    tile.hass = makeHass({
      'fan.test': fanState('fan.test', 'on', {
        preset_mode: 'Auto',
        supported_features: 1,
        percentage: 40,
      }),
    });
    await tile.updateComplete;
    expect(valueText()).to.equal('40%');
    expect(wheel().value).to.equal(40);
    expect(wheel().valueText).to.equal('Current speed 40%');
    expect(provider.called).to.equal(false);
  });

  it('re-estimates RPM updates without refetching and refetches changed source identities', async () => {
    const provider = calibrationStub();
    await showEstimatedSpeed();
    await showEstimatedSpeed('2100');
    expect(wheel().value).to.equal(14);
    expect(provider.calledOnce).to.equal(true);
    tile.config = { ...tile.config, preset: 'Custom' };
    await tile.updateComplete;
    await clock.tickAsync(0);
    expect(provider.callCount).to.equal(2);
  });

  it('shows modes without estimates, saved Manual levels, and Off without coverage', async () => {
    calibrationStub();
    await showEstimatedSpeed();
    tile.config = { ...tile.config, estimate_auto: false };
    await tile.updateComplete;
    expect(valueText()).to.equal('Auto');
    expect(wheel().value).to.equal(14);
    tile.config = { ...tile.config, estimate_auto: true };
    await showEstimatedSpeed('1250', 'Favorite');
    expect(valueText()).to.equal('100%');
    expect(tile.shadowRoot!.querySelector('.coverage')!.textContent!.trim()).to.equal('25–43 m²');
    await showEstimatedSpeed('unavailable');
    expect(valueText()).to.equal('Auto');
    expect(tile.shadowRoot!.querySelector('.secondary')).to.equal(null);
    tile.hass = {
      ...tile.hass,
      states: {
        ...tile.hass.states,
        'fan.test': fanState('fan.test', 'off', { preset_mode: 'Auto' }),
      },
    };
    await tile.updateComplete;
    expect(valueText()).to.equal('Off');
    expect(wheel().value).to.equal(14);
    expect(tile.shadowRoot!.querySelector('.coverage')).to.equal(null);
  });

  it('shows live modes and RPM without presenting the saved level as current speed', async () => {
    const provider = sinon.stub(MpSpeedWheelTile, 'calibrationProvider').resolves(null);
    expect(valueText()).to.equal('Auto');
    expect(provider.called).to.equal(false);
    await showEstimatedSpeed('432.4');
    expect(valueText()).to.equal('Auto');
    expect(tile.shadowRoot!.querySelector('.secondary')!.textContent!.trim()).to.equal('432 rpm');
    expect(tile.shadowRoot!.querySelector('.coverage')).to.equal(null);
    expect(tile.shadowRoot!.textContent).not.to.include('%');
    expect(wheel().valueText).to.equal('Auto mode');
    expect(
      wheel().getAttribute('aria-valuetext') ??
        wheel().shadowRoot!.querySelector('[aria-valuetext]')?.getAttribute('aria-valuetext')
    ).to.equal('Auto mode');
    expect(wheel().value).to.equal(14);
    await showEstimatedSpeed('0', 'Sleep');
    expect(valueText()).to.equal('Sleep');
    expect(wheel().valueText).to.equal('Sleep mode');
    expect(tile.shadowRoot!.querySelector('.secondary')).to.equal(null);
    wheel().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    await clock.tickAsync(600);
    expect((tile.hass as TestHass).__calls[0].data).to.include({ preset_mode: 'Favorite' });
    expect((tile.hass as TestHass).__calls[1].data).to.include({ value: 13 });
  });

  it('retries a null calibration on the next hass update after thirty minutes', async () => {
    const provider = sinon.stub(MpSpeedWheelTile, 'calibrationProvider').resolves(null);
    provider.onSecondCall().resolves({
      points: [
        { detent: 0, rpm: 400 },
        { detent: 14, rpm: 2100 },
      ],
    });
    await showEstimatedSpeed();
    await clock.tickAsync(30 * 60 * 1000 - 1);
    await showEstimatedSpeed();
    expect(provider.calledOnce).to.equal(true);
    await clock.tickAsync(1);
    expect(provider.calledOnce).to.equal(true);
    await showEstimatedSpeed();
    expect(provider.calledTwice).to.equal(true);
    expect(valueText()).to.equal('53%');
    await showEstimatedSpeed();
    expect(provider.calledTwice).to.equal(true);
  });

  it('turns from the estimated position into Manual and commits the new value', async () => {
    calibrationStub();
    await showEstimatedSpeed();
    expect(wheel().value).to.equal(7);
    wheel().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    await tile.updateComplete;
    expect(valueText()).not.to.include('≈');
    await clock.tickAsync(600);
    const calls = (tile.hass as TestHass).__calls;
    expect(calls[0].data).to.include({ preset_mode: 'Favorite' });
    expect(calls[1].data).to.include({ value: 8 });
  });

  it('ignores calibration results after disconnect even if reconnected', async () => {
    let resolve!: (cal: { points: { detent: number; rpm: number }[] }) => void;
    const provider = sinon.stub(MpSpeedWheelTile, 'calibrationProvider').resolves(null);
    provider.onFirstCall().returns(
      new Promise((done) => {
        resolve = done;
      })
    );
    await showEstimatedSpeed();
    tile.remove();
    document.body.append(tile);
    resolve({
      points: [
        { detent: 0, rpm: 400 },
        { detent: 14, rpm: 2100 },
      ],
    });
    await clock.tickAsync(0);
    await tile.updateComplete;
    expect(valueText()).to.equal('Auto');
    expect(wheel().value).to.equal(14);
  });

  const showXiaomiSpeed = async (value = 7): Promise<void> => {
    tile.config = { ...tile.config, entity: 'number.speed', display: 'percent' };
    tile.cardConfig = {
      ...tile.cardConfig,
      cadr: 360,
      calibration: [
        { value: 0, rpm: 420 },
        { value: 14, rpm: 2100 },
      ],
    };
    tile.hass = Object.assign(
      makeHass({
        ...hass.states,
        'fan.test': fanState('fan.test', 'on', { preset_mode: 'Favorite' }),
        'number.speed': entityState('number.speed', String(value), { min: 0, max: 14, step: 1 }),
      }),
      {
        devices: { purifier: { id: 'purifier', model: 'zhimi.airp.rmb1' } },
        entities: { 'fan.test': { entity_id: 'fan.test', device_id: 'purifier' } },
      }
    );
    await tile.updateComplete;
    await wheel().updateComplete;
  };

  it('defaults to percentage with CADR-based coverage and accessible value text', async () => {
    await showXiaomiSpeed();
    expect(valueText()).to.equal('53%');
    expect(tile.shadowRoot!.querySelector('.coverage')!.textContent!.trim()).to.equal('15–26 m²');
    expect(wheel().valueText).to.equal('53%, 15–26 m²');
    expect(
      wheel().getAttribute('aria-valuetext') ??
        wheel().shadowRoot!.querySelector('[aria-valuetext]')?.getAttribute('aria-valuetext')
    ).to.equal('53%, 15–26 m²');
  });

  it('uses this wheel fields ahead of the first wheel and legacy settings', async () => {
    tile.cardConfig = {
      ...tile.cardConfig,
      speed: { entity: 'number.speed', display: 'level', preset: 'Legacy', estimate_auto: true },
      features: [
        { type: 'speed-wheel', entity: 'number.speed', display: 'level', preset: 'First' },
      ],
      cadr: 360,
    };
    tile.config = {
      ...tile.config,
      entity: 'number.own',
      display: 'percent',
      preset: false,
      estimate_auto: false,
      show_coverage: false,
    };
    tile.hass = makeHass({
      'fan.test': fanState('fan.test', 'on', { preset_mode: 'Auto' }),
      'number.speed': entityState('number.speed', '3', { min: 0, max: 14, step: 1 }),
      'number.own': entityState('number.own', '0', { min: 0, max: 14, step: 1 }),
    });
    await tile.updateComplete;
    expect(wheel().value).to.equal(0);
    expect(valueText()).to.equal('7%');
    expect(tile.shadowRoot!.querySelector('.coverage')).to.equal(null);
    change(8);
    await clock.tickAsync(600);
    expect((tile.hass as TestHass).__calls.map(({ service }) => service)).to.deep.equal([
      'set_value',
    ]);
    expect((tile.hass as TestHass).__calls[0].data).to.include({ entity_id: 'number.own' });
  });

  it('uses configured calibration for estimates without fetching history', async () => {
    const provider = calibrationStub();
    tile.cardConfig = {
      ...tile.cardConfig,
      calibration: [
        { value: 0, rpm: 420 },
        { value: 14, rpm: 2100 },
      ],
    };
    await showEstimatedSpeed('420');
    expect(valueText()).to.equal('7%');
    expect(wheel().valueText).to.equal('Current speed 7%, 5–9 m²');
    expect(provider.called).to.equal(false);
    await estimatedPreset('Favorite');
    await clock.tickAsync(30000);
    await estimatedPreset('Auto');
    expect(provider.called).to.equal(false);
  });

  it('omits coverage without CADR or a known maximum RPM', async () => {
    await showXiaomiSpeed(14);
    tile.cardConfig = { ...tile.cardConfig, cadr: undefined };
    await tile.updateComplete;
    expect(tile.shadowRoot!.querySelector('.coverage')).to.equal(null);
    tile.cardConfig = { ...tile.cardConfig, cadr: 360, calibration: undefined };
    await tile.updateComplete;
    expect(tile.shadowRoot!.querySelector('.coverage')).to.equal(null);
  });

  it('computes percentage fan coverage directly from CADR', async () => {
    tile.cardConfig = { ...tile.cardConfig, speed: undefined, cadr: 360 };
    tile.hass = makeHass({
      'fan.test': fanState('fan.test', 'on', {
        supported_features: 1,
        percentage: 50,
        preset_modes: [],
      }),
    });
    await tile.updateComplete;
    expect(valueText()).to.equal('50%');
    expect(tile.shadowRoot!.querySelector('.coverage')!.textContent!.trim()).to.equal('13–22 m²');
  });

  it('supports raw levels while retaining coverage', async () => {
    await showXiaomiSpeed();
    tile.config = { ...tile.config, display: 'level' };
    await tile.updateComplete;
    expect(valueText()).to.equal('Level 7');
    expect(wheel().valueText).to.equal('Level 7, 15–26 m²');
  });

  it('hides coverage when explicitly disabled', async () => {
    await showXiaomiSpeed();
    tile.config = { ...tile.config, show_coverage: false };
    await tile.updateComplete;
    expect(tile.shadowRoot!.querySelector('.coverage')).to.equal(null);
    expect(wheel().valueText).to.equal('53%');
  });

  it('fits percentage and coverage beside the drum in a 140×162 tile', async () => {
    tile.style.width = '140px';
    tile.style.height = '162px';
    await showXiaomiSpeed(14);
    const surface = tile.shadowRoot!.querySelector('.tile') as HTMLElement;
    expect(valueText()).to.equal('100%');
    expect(tile.shadowRoot!.querySelector('.coverage')!.textContent!.trim()).to.equal('25–43 m²');
    const drum = wheel().getBoundingClientRect();
    for (const selector of ['.value', '.coverage']) {
      const text = tile.shadowRoot!.querySelector(selector) as HTMLElement;
      const bounds = text.getBoundingClientRect();
      expect(text.scrollWidth).to.be.at.most(text.clientWidth);
      expect(getComputedStyle(text).whiteSpace).to.equal('nowrap');
      expect(bounds.right).to.be.at.most(drum.left);
      expect(bounds.bottom).to.be.at.most(surface.getBoundingClientRect().bottom);
    }
    expect(surface.scrollWidth).to.be.at.most(surface.clientWidth);
    expect(surface.getBoundingClientRect().height).to.equal(162);
    expect(drum.width).to.equal(56);
    expect(wheel().label).to.equal('Speed');
  });

  for (const height of [136, 162]) {
    it(`insets the drum by 4px at both ends without changing the ${height}px tile or text`, async () => {
      tile.style.width = '140px';
      tile.style.height = `${height}px`;
      await wheel().updateComplete;
      for (const state of ['on', 'off']) {
        await reportPreset('Favorite', state);
        const slot = surface();
        const text = tile.shadowRoot!.querySelector('.text') as HTMLElement;
        slot.style.setProperty('--mp-wheel-block-inset', '0px');
        const beforeTile = slot.getBoundingClientRect();
        const beforeDrum = wheel().getBoundingClientRect();
        const beforeText = text.getBoundingClientRect();
        slot.style.removeProperty('--mp-wheel-block-inset');
        const afterTile = slot.getBoundingClientRect();
        const afterDrum = wheel().getBoundingClientRect();
        const afterText = text.getBoundingClientRect();
        expect(afterDrum.top - afterTile.top).to.be.closeTo(
          beforeDrum.top - beforeTile.top + 4,
          0.5
        );
        expect(afterTile.bottom - afterDrum.bottom).to.be.closeTo(
          beforeTile.bottom - beforeDrum.bottom + 4,
          0.5
        );
        expect(afterDrum.height).to.be.closeTo(beforeDrum.height - 8, 0.5);
        expect(afterDrum.width).to.equal(56);
        expect(afterTile.height).to.equal(height);
        expect(afterTile.height).to.equal(beforeTile.height);
        for (const edge of ['top', 'bottom', 'left', 'right'] as const) {
          expect(afterText[edge]).to.be.closeTo(beforeText[edge], 0.5);
        }
      }
    });
  }

  it('leaves the drum grid slot unpainted except for the wheel in every interaction state', async () => {
    tile.style.width = '140px';
    tile.style.height = '162px';
    await wheel().updateComplete;
    const assertSlot = () => {
      // The wheel is the sole element in column 2: no legacy capsule or backing slot.
      const occupants = [...surface().children].filter(
        (child) => getComputedStyle(child).gridColumnStart === '2'
      );
      expect(occupants).to.deep.equal([wheel()]);
      const style = getComputedStyle(wheel());
      expect(getComputedStyle(tile).overflow).to.equal('visible');
      expect(getComputedStyle(surface()).overflow).to.equal('visible');
      expect(style.overflow).to.equal('visible');
      expect(style.backgroundColor).to.equal('rgba(0, 0, 0, 0)');
      expect(style.backgroundImage).to.equal('none');
      expect(style.boxShadow).to.equal('none');
      for (const edge of ['Top', 'Right', 'Bottom', 'Left']) {
        expect(style.getPropertyValue(`border-${edge.toLowerCase()}-width`)).to.equal('0px');
      }
      for (const pseudo of ['::before', '::after']) {
        expect(getComputedStyle(wheel(), pseudo).content).to.equal('none');
      }
    };
    assertSlot();
    button().focus();
    await sendKeys({ press: 'Tab' });
    expect(wheel().matches(':focus-visible')).to.equal(true);
    assertSlot();
    sinon.stub(wheel(), 'setPointerCapture');
    wheel().dispatchEvent(
      new PointerEvent('pointerdown', { pointerId: 1, button: 0, clientY: 100 })
    );
    wheel().dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientY: 87 }));
    expect(wheel().hasAttribute('interacting')).to.equal(true);
    assertSlot();
    wheel().dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1 }));
  });

  it('shares radius-aware corner clearance between the text and icon', async () => {
    tile.style.width = '140px';
    const surface = tile.shadowRoot!.querySelector('.tile') as HTMLElement;
    const text = tile.shadowRoot!.querySelector('.text') as HTMLElement;
    const icon = tile.shadowRoot!.querySelector('.ic') as HTMLElement;
    for (const state of ['on', 'off']) {
      tile.hass = makeHass({
        ...hass.states,
        'fan.test': fanState('fan.test', state, { preset_mode: 'Favorite' }),
      });
      await tile.updateComplete;
      // Avoid sampling the shared border-radius transition mid-flight.
      surface.style.transition = 'none';
      const radius = parseFloat(getComputedStyle(surface).borderBottomLeftRadius);
      const inset = Math.max(12, radius - (radius - 12) * 0.7071);
      const textStyle = getComputedStyle(text);
      const iconStyle = getComputedStyle(icon);
      expect(parseFloat(textStyle.paddingBottom)).to.be.closeTo(inset, 0.02);
      expect(parseFloat(textStyle.paddingLeft)).to.be.closeTo(Math.max(16, inset + 2), 0.02);
      expect(iconStyle.marginTop).to.equal(textStyle.paddingBottom);
      expect(iconStyle.marginLeft).to.equal(textStyle.paddingLeft);
      if (state === 'on') {
        expect(radius).to.equal(28);
        expect(parseFloat(textStyle.paddingLeft)).to.be.at.least(16);
        expect(parseFloat(textStyle.paddingBottom)).to.be.at.least(16);
      }
    }
  });

  it('renders the configured title, speed, accent and wheel range', () => {
    const surface = tile.shadowRoot!.querySelector('.tile') as HTMLElement;
    expect(tile.shadowRoot!.querySelector('.title')!.textContent).to.equal('Speed');
    expect(valueText()).to.equal('Auto');
    expect(surface.classList.contains('on')).to.equal(false);
    expect(surface.style.getPropertyValue('--mp-tile-accent')).to.equal('#123456');
    expect(wheel().min).to.equal(1);
    expect(wheel().max).to.equal(10);
    expect(wheel().step).to.equal(1);
    expect(wheel().value).to.equal(3);
    expect(wheel().label).to.equal('Speed');
    expect(wheel().valueText).to.equal('Auto mode');
  });

  it('fits Level 14 without truncation in a 140px-wide tile', async () => {
    tile.style.width = '140px';
    tile.hass = makeHass({
      ...hass.states,
      'fan.test': fanState('fan.test', 'on', { preset_mode: 'Favorite' }),
      'number.speed': entityState('number.speed', '14', { min: 1, max: 14, step: 1 }),
    });
    await tile.updateComplete;
    const value = tile.shadowRoot!.querySelector('.value') as HTMLElement;
    expect(valueText()).to.equal('Level 14');
    expect(value.clientWidth).to.be.greaterThan(0);
    expect(value.scrollWidth).to.be.at.most(value.clientWidth);
    expect(getComputedStyle(value).textOverflow).not.to.equal('ellipsis');
    expect(wheel().getBoundingClientRect().width).to.equal(56);
  });

  const surface = (): HTMLElement => tile.shadowRoot!.querySelector('.tile')!;
  const button = (): HTMLButtonElement => tile.shadowRoot!.querySelector('button.ic')!;
  const reportPreset = async (
    preset: string,
    state = 'on',
    modes = ['Auto', 'Favorite']
  ): Promise<void> => {
    tile.hass = makeHass({
      ...hass.states,
      'fan.test': fanState('fan.test', state, {
        preset_mode: preset,
        preset_modes: modes,
      }),
    });
    await tile.updateComplete;
  };

  it('is active only for an on fan in its case-insensitive Manual preset', async () => {
    expect(surface().classList.contains('on')).to.equal(false);
    expect(button().getAttribute('aria-label')).to.equal('Manual mode');
    expect(button().getAttribute('aria-pressed')).to.equal('false');
    await reportPreset('fAVORITE');
    expect(surface().classList.contains('on')).to.equal(true);
    expect(button().getAttribute('aria-pressed')).to.equal('true');
    await reportPreset('Favorite', 'off');
    expect(button().getAttribute('aria-pressed')).to.equal('false');
  });

  it('toggles Auto to Manual and immediately reflects the requested state', async () => {
    surface().click();
    await tile.updateComplete;
    expect(hass.__calls).to.have.length(1);
    expect(hass.__calls[0]).to.include({ domain: 'fan', service: 'set_preset_mode' });
    expect(hass.__calls[0].data).to.deep.equal({ entity_id: 'fan.test', preset_mode: 'Favorite' });
    expect(button().getAttribute('aria-pressed')).to.equal('true');
    surface().click();
    await tile.updateComplete;
    expect(hass.__calls[1].data).to.include({ preset_mode: 'Auto' });
    expect(button().getAttribute('aria-pressed')).to.equal('false');
  });

  it('toggles Manual to Auto through the native button keyboard click', async () => {
    await reportPreset('Favorite');
    button().focus();
    // Enter/Space on a native button produce a click with detail 0.
    button().dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, detail: 0 }));
    await tile.updateComplete;
    expect((tile.hass as TestHass).__calls).to.have.length(1);
    expect((tile.hass as TestHass).__calls[0].data).to.include({ preset_mode: 'Auto' });
    expect(button().getAttribute('aria-pressed')).to.equal('false');
  });

  it('ignores drum clicks and surface clicks following a drag', async () => {
    wheel().dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    surface().dispatchEvent(new PointerEvent('pointerdown', { clientX: 10, clientY: 10 }));
    surface().dispatchEvent(new PointerEvent('pointermove', { clientX: 10, clientY: 30 }));
    surface().dispatchEvent(new PointerEvent('pointerup', { clientX: 10, clientY: 30 }));
    surface().dispatchEvent(new MouseEvent('click', { detail: 1 }));
    expect(hass.__calls).to.have.length(0);
    surface().dispatchEvent(new PointerEvent('pointerdown', { clientX: 10, clientY: 10 }));
    surface().dispatchEvent(new MouseEvent('click', { detail: 1 }));
    expect(hass.__calls).to.have.length(1);
  });

  it('ignores clicks retargeted after a wheel gesture but allows keyboard button activation', async () => {
    change(7, 'value-changing');
    surface().click();
    expect(hass.__calls).to.have.length(0);
    button().click();
    expect(hass.__calls).to.have.length(1);
  });

  it('selects Manual when the fan is off and honors an explicit speed preset', async () => {
    tile.config = { ...tile.config, preset: 'Custom' };
    await reportPreset('Custom', 'off', ['Custom', 'Automatic']);
    surface().click();
    await tile.updateComplete;
    expect((tile.hass as TestHass).__calls[0].data).to.include({ preset_mode: 'Custom' });
    expect(button().getAttribute('aria-pressed')).to.equal('true');
    await reportPreset('Custom', 'on', ['Custom', 'Automatic']);
    surface().click();
    expect((tile.hass as TestHass).__calls[0].data).to.include({ preset_mode: 'Automatic' });
  });

  it('does nothing in Manual without another preset, otherwise uses the first non-Manual preset', async () => {
    await reportPreset('Favorite', 'on', ['Favorite']);
    surface().click();
    expect((tile.hass as TestHass).__calls).to.have.length(0);
    await reportPreset('Favorite', 'on', ['Favorite', 'Silent']);
    surface().click();
    expect((tile.hass as TestHass).__calls[0].data).to.include({ preset_mode: 'Silent' });
  });

  it('uses fan.toggle for a percentage fan without presets', async () => {
    tile.cardConfig = { ...tile.cardConfig, speed: undefined };
    tile.hass = makeHass({
      'fan.test': fanState('fan.test', 'on', {
        supported_features: 1,
        percentage: 50,
        preset_modes: [],
      }),
    });
    await tile.updateComplete;
    expect(button().getAttribute('aria-pressed')).to.equal('true');
    surface().click();
    expect((tile.hass as TestHass).__calls[0]).to.include({ domain: 'fan', service: 'toggle' });
    expect((tile.hass as TestHass).__calls[0].data).to.deep.equal({ entity_id: 'fan.test' });
  });

  it('does not toggle when the target or fan is disabled', async () => {
    for (const state of ['unavailable', 'unknown']) {
      await reportPreset('Auto', state);
      expect(button().disabled).to.equal(true);
      surface().click();
      expect((tile.hass as TestHass).__calls).to.have.length(0);
    }
    tile.cardConfig = { ...tile.cardConfig, speed: undefined };
    await reportPreset('Auto');
    surface().click();
    expect(button().disabled).to.equal(true);
    expect((tile.hass as TestHass).__calls).to.have.length(0);
    tile.config = { ...tile.config, entity: 'number.speed' };
    tile.hass = makeHass({
      ...hass.states,
      'number.speed': entityState('number.speed', 'unavailable'),
    });
    await tile.updateComplete;
    surface().click();
    expect(button().disabled).to.equal(true);
    expect((tile.hass as TestHass).__calls).to.have.length(0);
  });

  it('clears mode optimism on target replacement and catches toggle failures', async () => {
    surface().click();
    await tile.updateComplete;
    tile.config = { ...tile.config, entity: 'number.other' };
    tile.hass = makeHass({
      ...hass.states,
      'number.other': entityState('number.other', '2', { min: 1, max: 10, step: 1 }),
    });
    await tile.updateComplete;
    expect(button().getAttribute('aria-pressed')).to.equal('false');
    expect(clock.countTimers()).to.equal(0);
    const warn = sinon.stub(console, 'warn');
    tile.hass.callService = sinon.stub().rejects(new Error('Toggle failed'));
    surface().click();
    await clock.tickAsync(0);
    await tile.updateComplete;
    expect(button().getAttribute('aria-pressed')).to.equal('false');
    expect(clock.countTimers()).to.equal(0);
    expect(warn.calledOnce).to.equal(true);
  });

  it('expires unmatched mode optimism after five seconds and confirms matching reports', async () => {
    surface().click();
    await clock.tickAsync(4999);
    expect(button().getAttribute('aria-pressed')).to.equal('true');
    await clock.tickAsync(1);
    await tile.updateComplete;
    expect(button().getAttribute('aria-pressed')).to.equal('false');
    surface().click();
    await reportPreset('Favorite');
    expect(clock.countTimers()).to.equal(0);
    await reportPreset('Auto');
    expect(button().getAttribute('aria-pressed')).to.equal('false');
    surface().click();
    tile.remove();
    expect(clock.countTimers()).to.equal(0);
  });

  it('does not activate on wheel commit until HA reports Manual', async () => {
    change(7);
    await clock.tickAsync(600);
    expect(button().getAttribute('aria-pressed')).to.equal('false');
    await reportPreset('Favorite');
    expect(button().getAttribute('aria-pressed')).to.equal('true');
  });

  it('fits 100% without truncation in a 140px-wide tile', async () => {
    tile.style.width = '140px';
    tile.cardConfig = { ...tile.cardConfig, speed: undefined };
    tile.hass = makeHass({
      'fan.test': fanState('fan.test', 'on', { percentage: 100, supported_features: 57 }),
    });
    await tile.updateComplete;
    const value = tile.shadowRoot!.querySelector('.value') as HTMLElement;
    expect(valueText()).to.equal('100%');
    expect(value.clientWidth).to.be.greaterThan(0);
    expect(value.scrollWidth).to.be.at.most(value.clientWidth);
  });

  it('keeps title-large value text on wider tiles', () => {
    tile.style.width = '320px';
    const value = tile.shadowRoot!.querySelector('.value') as HTMLElement;
    expect(getComputedStyle(value).fontSize).to.equal('22px');
  });

  it('waits 600 ms then selects Favorite before setting the speed exactly once', async () => {
    change(7);
    await clock.tickAsync(599);
    expect(hass.__calls).to.have.length(0);
    await clock.tickAsync(1);
    expect(hass.__calls.map(({ domain, service }) => `${domain}.${service}`)).to.deep.equal([
      'fan.set_preset_mode',
      'number.set_value',
    ]);
    expect(hass.__calls[0].data).to.include({ preset_mode: 'Favorite' });
    expect(hass.__calls[1].data).to.include({ value: 7 });
    await clock.tickAsync(600);
    expect(hass.__calls).to.have.length(2);
  });

  it('debounces rapid changes to the last value', async () => {
    change(4);
    await clock.tickAsync(400);
    change(8);
    await clock.tickAsync(599);
    expect(hass.__calls).to.have.length(0);
    await clock.tickAsync(1);
    expect(hass.__calls).to.have.length(2);
    expect(hass.__calls[1].data).to.include({ value: 8 });
  });

  it('pending commits do not survive target changes during debounce', async () => {
    change(7);
    await tile.updateComplete;
    tile.config = { ...tile.config, entity: 'number.other' };
    tile.hass = makeHass({
      ...hass.states,
      'number.other': entityState('number.other', '2', { min: 1, max: 10, step: 1 }),
    });
    await tile.updateComplete;
    expect(valueText()).to.equal('Auto');
    expect(clock.countTimers()).to.equal(0);
    await clock.tickAsync(600);
    expect(hass.__calls).to.deep.equal([]);
    expect((tile.hass as TestHass).__calls).to.deep.equal([]);
  });

  it('an unavailable configured number disables the wheel and clears pending optimism', async () => {
    change(7);
    await tile.updateComplete;
    tile.hass = makeHass({
      ...hass.states,
      'number.speed': entityState('number.speed', 'unavailable', { min: 1, max: 10, step: 1 }),
    });
    await tile.updateComplete;
    expect(wheel().disabled).to.equal(true);
    expect(valueText()).to.equal('—');
    expect(tile.shadowRoot!.textContent).to.include('Speed control unavailable');
    expect(clock.countTimers()).to.equal(0);
    change(8);
    await clock.tickAsync(600);
    expect(hass.__calls).to.deep.equal([]);
    expect((tile.hass as TestHass).__calls).to.deep.equal([]);
  });

  it('shows optimistic text during interaction and wait, then accepts matching state', async () => {
    change(7, 'value-changing');
    await tile.updateComplete;
    expect(valueText()).to.equal('Level 7');
    change(7);
    await clock.tickAsync(600);
    expect(valueText()).to.equal('Level 7');
    tile.hass = makeHass({
      ...hass.states,
      'number.speed': entityState('number.speed', '7', { min: 1, max: 10, step: 1 }),
    });
    await tile.updateComplete;
    tile.hass = makeHass({
      ...tile.hass.states,
      'number.speed': entityState('number.speed', '6', { min: 1, max: 10, step: 1 }),
    });
    await tile.updateComplete;
    expect(valueText()).to.equal('Auto');
  });

  it('clears unmatched optimism five seconds after the interaction', async () => {
    change(7);
    await clock.tickAsync(4999);
    expect(valueText()).to.equal('Level 7');
    await clock.tickAsync(1);
    await tile.updateComplete;
    expect(valueText()).to.equal('Auto');
  });

  it('serializes service sequences and coalesces pending commits to the newest value', async () => {
    const resolutions: Array<() => void> = [];
    const service = sinon
      .stub()
      .callsFake(() => new Promise<void>((resolve) => resolutions.push(resolve)));
    hass.callService = service;
    change(4);
    await clock.tickAsync(600);
    change(7);
    await clock.tickAsync(600);
    change(9);
    await clock.tickAsync(600);
    expect(service.callCount).to.equal(1);
    resolutions.shift()!();
    await clock.tickAsync(0);
    expect(service.secondCall.args).to.deep.equal([
      'number',
      'set_value',
      { entity_id: 'number.speed', value: 4 },
    ]);
    resolutions.shift()!();
    await clock.tickAsync(0);
    expect(service.thirdCall.args[1]).to.equal('set_preset_mode');
    resolutions.shift()!();
    await clock.tickAsync(0);
    expect(service.getCall(3).args).to.deep.equal([
      'number',
      'set_value',
      { entity_id: 'number.speed', value: 9 },
    ]);
    resolutions.shift()!();
    await clock.tickAsync(6000);
    expect(service.callCount).to.equal(4);
  });

  it('cancels a debounced wheel commit when Manual is toggled to Auto', async () => {
    await reportPreset('Favorite');
    const current = tile.hass as TestHass;
    change(7);
    await clock.tickAsync(300);
    button().click();
    await tile.updateComplete;
    expect(valueText()).to.equal('Auto');
    expect(
      current.__calls.map(({ domain, service, data }) => [domain, service, data])
    ).to.deep.equal([['fan', 'set_preset_mode', { entity_id: 'fan.test', preset_mode: 'Auto' }]]);
    await reportPreset('Auto');
    await clock.tickAsync(6000);
    expect(current.__calls).to.have.length(1);
    expect((tile.hass as TestHass).__calls).to.have.length(0);
  });

  it('serializes Auto after an in-flight speed sequence and drops coalesced speed', async () => {
    const resolutions: Array<() => void> = [];
    const service = sinon
      .stub()
      .callsFake(() => new Promise<void>((resolve) => resolutions.push(resolve)));
    tile.hass.callService = service;
    change(4);
    await clock.tickAsync(600);
    change(9);
    await clock.tickAsync(600);
    await reportPreset('Favorite');
    tile.hass.callService = service;
    button().click();
    expect(service.callCount).to.equal(1);
    resolutions.shift()!();
    await clock.tickAsync(0);
    expect(service.secondCall.args).to.deep.equal([
      'number',
      'set_value',
      { entity_id: 'number.speed', value: 4 },
    ]);
    resolutions.shift()!();
    await clock.tickAsync(0);
    expect(service.thirdCall.args).to.deep.equal([
      'fan',
      'set_preset_mode',
      { entity_id: 'fan.test', preset_mode: 'Auto' },
    ]);
    resolutions.shift()!();
    await clock.tickAsync(6000);
    expect(service.callCount).to.equal(3);
  });

  it('serializes a later wheel interaction after an unresolved Auto toggle', async () => {
    await reportPreset('Favorite');
    const resolutions: Array<() => void> = [];
    const service = sinon
      .stub()
      .callsFake(() => new Promise<void>((resolve) => resolutions.push(resolve)));
    tile.hass.callService = service;
    button().click();
    change(8);
    await clock.tickAsync(600);
    expect(service.callCount).to.equal(1);
    expect(service.firstCall.args[2]).to.include({ preset_mode: 'Auto' });
    resolutions.shift()!();
    await clock.tickAsync(0);
    expect(service.secondCall.args[2]).to.include({ preset_mode: 'Favorite' });
    resolutions.shift()!();
    await clock.tickAsync(0);
    expect(service.thirdCall.args).to.deep.equal([
      'number',
      'set_value',
      { entity_id: 'number.speed', value: 8 },
    ]);
    resolutions.shift()!();
    await clock.tickAsync(6000);
    expect(service.callCount).to.equal(3);
  });

  it('expires an interrupted gesture even without a commit', async () => {
    change(7, 'value-changing');
    await clock.tickAsync(5000);
    await tile.updateComplete;
    expect(valueText()).to.equal('Auto');
    expect(hass.__calls).to.have.length(0);
  });

  it('clears interrupted gesture optimism immediately when the fan becomes unavailable', async () => {
    change(7, 'value-changing');
    await tile.updateComplete;
    tile.hass = makeHass({ ...hass.states, 'fan.test': fanState('fan.test', 'unavailable') });
    await tile.updateComplete;
    expect(wheel().disabled).to.equal(true);
    expect(valueText()).to.equal('Level 3');
    expect(clock.countTimers()).to.equal(0);
  });

  it('clears expired optimism when an unresolved service sequence finally settles', async () => {
    let resolve!: () => void;
    hass.callService = sinon.stub().returns(
      new Promise<void>((done) => {
        resolve = done;
      })
    );
    change(7);
    await clock.tickAsync(5000);
    expect(valueText()).to.equal('Level 7');
    resolve();
    await clock.tickAsync(0);
    await tile.updateComplete;
    expect(valueText()).to.equal('Auto');
    expect(clock.countTimers()).to.equal(0);
  });

  it('catches service errors and clears optimism', async () => {
    const warn = sinon.stub(console, 'warn');
    hass.callService = sinon.stub().rejects(new Error('Service failed'));
    change(7);
    await clock.tickAsync(600);
    await tile.updateComplete;
    expect(valueText()).to.equal('Auto');
    expect(warn.calledOnce).to.equal(true);
  });

  it('shows setup guidance and disables the wheel without a speed target', async () => {
    tile.cardConfig = { ...tile.cardConfig, speed: undefined };
    const disabledHass = makeHass({
      'fan.test': fanState('fan.test', 'on', { supported_features: 0 }),
    });
    tile.hass = disabledHass;
    await tile.updateComplete;
    expect(valueText()).to.equal('No speed control');
    expect(tile.shadowRoot!.textContent).to.include('Add a speed entity');
    expect(wheel().disabled).to.equal(true);
    change(7);
    await clock.tickAsync(600);
    expect(disabledHass.__calls).to.have.length(0);
  });

  it('disables the wheel when the fan is unavailable', async () => {
    const disabledHass = makeHass({
      ...hass.states,
      'fan.test': fanState('fan.test', 'unavailable'),
    });
    tile.hass = disabledHass;
    await tile.updateComplete;
    expect(wheel().disabled).to.equal(true);
    change(7);
    await clock.tickAsync(600);
    expect(disabledHass.__calls).to.have.length(0);
  });

  it('clears debounce and optimistic expiry timers on disconnect', async () => {
    change(7);
    tile.remove();
    expect(clock.countTimers()).to.equal(0);
    await clock.tickAsync(6000);
    expect(hass.__calls).to.have.length(0);
    document.body.append(tile);
    await tile.updateComplete;
    change(8);
    await clock.tickAsync(600);
    expect(clock.countTimers()).to.equal(1);
    tile.remove();
    expect(clock.countTimers()).to.equal(0);
  });
});
