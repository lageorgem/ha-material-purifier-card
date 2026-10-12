import { expect, fixture, html } from '@open-wc/testing';
import type { MpSpeedWheel } from '../../src/features/speed-wheel';
import '../../src/features/speed-wheel';
import sinon from 'sinon';
import {
  coverageRange,
  detentCount,
  detentIndex,
  formatSpeed,
  formatCoverage,
  resolveSpeedTarget,
  setSpeed,
  speedSource,
  speedFraction,
  speedPercent,
  speedPreset,
} from '../../src/speed';
import type { SpeedTarget } from '../../src/speed';
import type { MaterialPurifierCardConfig } from '../../src/types';
import { entityState, fanState, makeHass } from '../helpers';

const fanId = 'fan.test';
const numberId = 'number.favorite_level';
const inputId = 'input_number.speed';

function numberTarget(overrides: Partial<SpeedTarget> = {}): SpeedTarget {
  return {
    kind: 'number',
    entity: numberId,
    available: true,
    min: 0,
    max: 14,
    step: 1,
    value: 7,
    unit: '',
    ...overrides,
  };
}

describe('speed', () => {
  afterEach(() => sinon.restore());

  describe('speedSource', () => {
    const card: MaterialPurifierCardConfig = {
      type: 'custom:material-purifier-card',
      entity: fanId,
    };

    it('falls back to legacy settings when no speed wheel is configured', () => {
      expect(speedSource(card)).to.deep.equal({});
      const speed = {
        entity: numberId,
        preset: 'Manual',
        display: 'level' as const,
        estimate_auto: true,
      };
      expect(speedSource({ ...card, speed })).to.deep.equal(speed);
    });

    it('uses the first speed wheel with per-field fallback and preserves false', () => {
      expect(
        speedSource({
          ...card,
          speed: { entity: numberId, preset: 'Manual', display: 'level', estimate_auto: true },
          features: [
            { type: 'fan-presets' },
            {
              type: 'speed-wheel',
              entity: inputId,
              preset: false,
              estimate_auto: false,
              show_coverage: false,
            },
            { type: 'speed-wheel', display: 'percent' },
          ],
        })
      ).to.deep.equal({
        entity: inputId,
        preset: false,
        display: 'level',
        estimate_auto: false,
        show_coverage: false,
      });
      expect(
        speedSource({
          ...card,
          features: [{ type: 'speed-wheel', display: 'percent', show_coverage: true }],
        })
      ).to.deep.equal({ display: 'percent', show_coverage: true });
    });
  });

  describe('resolveSpeedTarget', () => {
    it('resolves number attributes and parses numeric states', () => {
      const hass = makeHass({
        [numberId]: entityState(numberId, '3.5', {
          min: 0,
          max: 14,
          step: 0.5,
          unit_of_measurement: 'rpm',
        }),
      });
      expect(resolveSpeedTarget(hass, fanId, { entity: numberId })).to.deep.equal(
        numberTarget({ value: 3.5, step: 0.5, unit: 'rpm' })
      );
    });

    it('resolves input_number with default bounds, step, and unit', () => {
      const hass = makeHass({ [inputId]: entityState(inputId, '12') });
      expect(resolveSpeedTarget(hass, fanId, { entity: inputId })).to.deep.equal(
        numberTarget({ kind: 'input_number', entity: inputId, max: 100, value: 12 })
      );
    });

    it('gives the override precedence over card configuration', () => {
      const hass = makeHass({ [inputId]: entityState(inputId, '4') });
      expect(resolveSpeedTarget(hass, fanId, { entity: numberId }, inputId).entity).to.equal(
        inputId
      );
      expect(resolveSpeedTarget(hass, fanId, { entity: numberId }, inputId).kind).to.equal(
        'input_number'
      );
    });

    for (const state of ['unknown', 'unavailable', 'not a number']) {
      it(`returns null for ${state}`, () => {
        const hass = makeHass({ [numberId]: entityState(numberId, state) });
        expect(resolveSpeedTarget(hass, fanId, { entity: numberId }).value).to.equal(null);
      });
    }

    for (const entity of [numberId, 'sensor.speed']) {
      it(`does not fall back to fan percentage for invalid configured entity ${entity}`, () => {
        const hass = makeHass({
          [fanId]: fanState(fanId, 'on', { supported_features: 1 }),
          'sensor.speed': entityState('sensor.speed', '7'),
        });
        expect(resolveSpeedTarget(hass, fanId, { entity })).to.deep.equal({
          kind: 'none',
          entity,
          available: false,
          min: 0,
          max: 0,
          step: 1,
          value: null,
          unit: '',
        });
      });
    }

    it('uses the SET_SPEED bit and percentage attributes on an on fan', () => {
      const hass = makeHass({
        [fanId]: fanState(fanId, 'on', {
          supported_features: 57,
          percentage_step: 10,
          percentage: 40,
        }),
      });
      expect(resolveSpeedTarget(hass, fanId)).to.deep.equal({
        kind: 'fan_percentage',
        entity: fanId,
        available: true,
        min: 10,
        max: 100,
        step: 10,
        value: 40,
        unit: '%',
      });
    });

    it('defaults percentage step and keeps a missing percentage null', () => {
      const hass = makeHass({ [fanId]: fanState(fanId, 'on', { supported_features: 1 }) });
      expect(resolveSpeedTarget(hass, fanId)).to.deep.equal({
        kind: 'fan_percentage',
        entity: fanId,
        available: true,
        min: 1,
        max: 100,
        step: 1,
        value: null,
        unit: '%',
      });
    });

    it('does not report a stale percentage when the fan is off', () => {
      const hass = makeHass({
        [fanId]: fanState(fanId, 'off', { supported_features: 1, percentage: 50 }),
      });
      expect(resolveSpeedTarget(hass, fanId).value).to.equal(null);
    });

    it('returns none for absent fans or fans without SET_SPEED', () => {
      for (const hass of [makeHass(), makeHass({ [fanId]: fanState() })]) {
        expect(resolveSpeedTarget(hass, fanId)).to.deep.equal({
          kind: 'none',
          entity: null,
          available: false,
          min: 0,
          max: 0,
          step: 1,
          value: null,
          unit: '',
        });
      }
    });
  });

  describe('speedPreset', () => {
    it('matches Favorite, Favourite, and Manual case-insensitively in list order', () => {
      for (const preset of ['Favorite', 'Favourite', 'MANUAL']) {
        const hass = makeHass({
          [fanId]: fanState(fanId, 'on', { preset_modes: ['Auto', preset, 'Manual'] }),
        });
        expect(speedPreset(hass.states[fanId])).to.equal(preset);
      }
    });

    it('honors disabled and explicit presets, including without a fan', () => {
      const hass = makeHass({ [fanId]: fanState() });
      expect(speedPreset(hass.states[fanId], { preset: false })).to.equal(null);
      expect(speedPreset(hass.states[fanId], { preset: 'Custom' })).to.equal('Custom');
      expect(speedPreset(undefined, { preset: 'Custom' })).to.equal('Custom');
    });

    it('returns null without a matching mode or fan', () => {
      const hass = makeHass({
        [fanId]: fanState(fanId, 'on', { preset_modes: ['Auto', 'Silent'] }),
      });
      expect(speedPreset(hass.states[fanId])).to.equal(null);
      expect(speedPreset(undefined)).to.equal(null);
      expect(speedPreset(makeHass({ [fanId]: entityState(fanId) }).states[fanId])).to.equal(null);
    });
  });

  describe('setSpeed', () => {
    it('wheel and service normalization agree on terminal maximum', async () => {
      for (const step of [30, 40]) {
        for (const value of [100, 100 - Number.EPSILON * 100]) {
          const hass = makeHass({ [fanId]: fanState() });
          await setSpeed(hass, fanId, numberTarget({ max: 100, step }), value, { preset: false });
          expect(hass.__calls[0].data?.value).to.equal(100);
        }
      }
    });

    it('an unavailable configured number never switches the preset', async () => {
      for (const state of ['unavailable', 'unknown']) {
        const hass = makeHass({
          [fanId]: fanState(fanId, 'on', { preset_mode: 'Auto' }),
          [numberId]: entityState(numberId, state),
        });
        const target = resolveSpeedTarget(hass, fanId, { entity: numberId });
        expect(target.available).to.equal(false);
        await setSpeed(hass, fanId, target, 5);
        expect(hass.__calls).to.deep.equal([]);

        const unavailableFan = makeHass({
          [fanId]: fanState(fanId, state, { supported_features: 1 }),
        });
        const percentage = resolveSpeedTarget(unavailableFan, fanId);
        expect(percentage.available).to.equal(false);
        await setSpeed(unavailableFan, fanId, percentage, 50);
        expect(unavailableFan.__calls).to.deep.equal([]);
      }
      const missing = makeHass({ [fanId]: fanState() });
      const target = resolveSpeedTarget(missing, fanId, { entity: numberId });
      expect(target.available).to.equal(false);
      await setSpeed(missing, fanId, target, 5);
      expect(missing.__calls).to.deep.equal([]);
    });

    it('does nothing for none targets', async () => {
      const hass = makeHass({ [fanId]: fanState() });
      await setSpeed(hass, fanId, numberTarget({ kind: 'none', entity: null }), 5);
      expect(hass.__calls).to.deep.equal([]);
    });

    it('awaits the preset before issuing the value service', async () => {
      const hass = makeHass({ [fanId]: fanState() });
      const original = hass.callService.bind(hass);
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const stub = sinon.stub(hass, 'callService');
      stub.callsFake(original);
      stub.onFirstCall().callsFake(async (...args) => {
        await gate;
        return original(...args);
      });
      const pending = setSpeed(hass, fanId, numberTarget(), 5);
      expect(stub.callCount).to.equal(1);
      expect(stub.firstCall.args).to.deep.equal([
        'fan',
        'set_preset_mode',
        { entity_id: fanId, preset_mode: 'Favorite' },
      ]);
      release();
      await pending;
      expect(
        hass.__calls.map(({ domain, service, data }) => ({ domain, service, data }))
      ).to.deep.equal([
        {
          domain: 'fan',
          service: 'set_preset_mode',
          data: { entity_id: fanId, preset_mode: 'Favorite' },
        },
        { domain: 'number', service: 'set_value', data: { entity_id: numberId, value: 5 } },
      ]);
    });

    it('skips a preset already active on an on fan', async () => {
      const hass = makeHass({ [fanId]: fanState(fanId, 'on', { preset_mode: 'Favorite' }) });
      await setSpeed(hass, fanId, numberTarget(), 5);
      expect(hass.__calls.map((call) => call.service)).to.deep.equal(['set_value']);
    });

    it('reactivates the preset on an off fan even if its stored mode matches', async () => {
      const hass = makeHass({ [fanId]: fanState(fanId, 'off', { preset_mode: 'Favorite' }) });
      await setSpeed(hass, fanId, numberTarget(), 5);
      expect(hass.__calls.map((call) => call.service)).to.deep.equal([
        'set_preset_mode',
        'set_value',
      ]);
    });

    it('turns on an off number fan without a matching preset', async () => {
      const hass = makeHass({ [fanId]: fanState(fanId, 'off', { preset_modes: ['Auto'] }) });
      await setSpeed(hass, fanId, numberTarget(), 5);
      expect(hass.__calls[0].data).to.deep.equal({ entity_id: fanId });
      expect(hass.__calls.map((call) => call.service)).to.deep.equal(['turn_on', 'set_value']);
    });

    it('awaits turn_on and the final value call', async () => {
      const hass = makeHass({ [fanId]: fanState(fanId, 'off') });
      const original = hass.callService.bind(hass);
      let releasePower!: () => void;
      let releaseValue!: () => void;
      const powerGate = new Promise<void>((resolve) => {
        releasePower = resolve;
      });
      const valueGate = new Promise<void>((resolve) => {
        releaseValue = resolve;
      });
      const stub = sinon.stub(hass, 'callService').callsFake(async (...args) => {
        await (args[1] === 'turn_on' ? powerGate : valueGate);
        return original(...args);
      });
      let settled = false;
      const pending = setSpeed(hass, fanId, numberTarget(), 5, { preset: false }).then(() => {
        settled = true;
      });
      expect(stub.callCount).to.equal(1);
      expect(stub.firstCall.args[1]).to.equal('turn_on');
      releasePower();
      // Drain the resolved power-service chain while the value service remains blocked.
      for (let i = 0; i < 10; i += 1) await Promise.resolve();
      expect(stub.callCount).to.equal(2);
      expect(settled).to.equal(false);
      releaseValue();
      await pending;
      expect(settled).to.equal(true);
    });

    it('honors preset false and calls the input_number service', async () => {
      const hass = makeHass({ [fanId]: fanState(fanId, 'off') });
      await setSpeed(hass, fanId, numberTarget({ kind: 'input_number', entity: inputId }), 4, {
        preset: false,
      });
      expect(hass.__calls.map((call) => call.service)).to.deep.equal(['turn_on', 'set_value']);
      expect(hass.__calls[1]).to.include({ domain: 'input_number', service: 'set_value' });
      expect(hass.__calls[1].data).to.deep.equal({ entity_id: inputId, value: 4 });
    });

    it('switches to an explicit preset', async () => {
      const hass = makeHass({ [fanId]: fanState() });
      await setSpeed(hass, fanId, numberTarget(), 4, { preset: 'Custom' });
      expect(hass.__calls[0].data).to.deep.equal({ entity_id: fanId, preset_mode: 'Custom' });
    });

    it('sets percentage without a separate turn_on when disabled preset and off', async () => {
      const hass = makeHass({ [fanId]: fanState(fanId, 'off', { supported_features: 1 }) });
      await setSpeed(hass, fanId, resolveSpeedTarget(hass, fanId), 45, { preset: false });
      expect(hass.__calls).to.have.length(1);
      expect(hass.__calls[0]).to.include({ domain: 'fan', service: 'set_percentage' });
      expect(hass.__calls[0].data).to.deep.equal({ entity_id: fanId, percentage: 45 });
    });

    it('switches presets before percentage as well', async () => {
      const hass = makeHass({ [fanId]: fanState(fanId, 'on', { supported_features: 1 }) });
      await setSpeed(hass, fanId, resolveSpeedTarget(hass, fanId), 45);
      expect(hass.__calls.map((call) => call.service)).to.deep.equal([
        'set_preset_mode',
        'set_percentage',
      ]);
    });

    for (const [value, expected] of [
      [-10, 0],
      [100, 14],
      [3.6, 4],
    ]) {
      it(`clamps and rounds ${value} to ${expected}`, async () => {
        const hass = makeHass({ [fanId]: fanState() });
        await setSpeed(hass, fanId, numberTarget(), value, { preset: false });
        expect(hass.__calls[0].data?.value).to.equal(expected);
      });
    }

    it('rounds decimal steps without floating-point noise', async () => {
      const hass = makeHass({ [fanId]: fanState() });
      await setSpeed(hass, fanId, numberTarget({ max: 1, step: 0.1 }), 0.26, { preset: false });
      expect(hass.__calls[0].data?.value).to.equal(0.3);
    });

    for (const kind of ['number', 'input_number'] as const) {
      for (const [min, max, step, value, expected] of [
        [0.5, 5.5, 1, 1.5, 1.5],
        [0, 1, 0.1, 0.3, 0.3],
        [0, 1e-6, 1e-7, 3e-7, 3e-7],
        [0, 1e-6, 1.5e-7, 4.5e-7, 4.5e-7],
        [1.5e-7, 1, 0.1, 0.10000015, 0.10000015],
        [0.5, 5.5, 1, -10, 0.5],
        [0.5, 5.5, 1, 10, 5.5],
        [0.5, 5.25, 1, 10, 5.25],
      ]) {
        it(`preserves ${kind} precision and bounds for min=${min}, step=${step}, value=${value}`, async () => {
          const hass = makeHass({ [fanId]: fanState() });
          const entity = kind === 'number' ? numberId : inputId;
          await setSpeed(hass, fanId, numberTarget({ kind, entity, min, max, step }), value, {
            preset: false,
          });
          expect(hass.__calls[0]).to.include({ domain: kind, service: 'set_value' });
          expect(hass.__calls[0].data).to.deep.equal({ entity_id: entity, value: expected });
        });
      }
    }

    it('does not issue the value call if preset activation fails', async () => {
      const hass = makeHass({ [fanId]: fanState() });
      const failure = new Error('HA unavailable');
      const stub = sinon.stub(hass, 'callService').rejects(failure);
      let caught: unknown;
      try {
        await setSpeed(hass, fanId, numberTarget(), 4);
      } catch (error) {
        caught = error;
      }
      expect(caught).to.equal(failure);
      expect(stub.callCount).to.equal(1);
    });
  });

  describe('speedFraction', () => {
    it('defaults to the current value and accepts explicit overrides', () => {
      expect(speedFraction(numberTarget())).to.equal(0.5);
      expect(speedFraction(numberTarget(), 0)).to.equal(0);
      expect(speedFraction(numberTarget(), 14)).to.equal(1);
      expect(speedFraction(numberTarget({ min: 4, max: 8 }), 6)).to.equal(0.5);
    });

    it('clamps values outside the range', () => {
      expect(speedFraction(numberTarget(), -1)).to.equal(0);
      expect(speedFraction(numberTarget(), 20)).to.equal(1);
    });

    it('returns null for null values or non-increasing ranges', () => {
      expect(speedFraction(numberTarget(), null)).to.equal(null);
      expect(speedFraction(numberTarget({ value: null }))).to.equal(null);
      expect(speedFraction(numberTarget({ min: 14 }))).to.equal(null);
      expect(speedFraction(numberTarget({ min: 15 }))).to.equal(null);
    });
  });

  describe('detents', () => {
    it('selects the nearest detent and favors the terminal maximum on ties', () => {
      const target = numberTarget({ max: 100, step: 30 });
      expect(detentIndex(target, 96)).to.equal(4);
      expect(detentIndex(target, 94)).to.equal(3);
      expect(detentIndex(target, 95)).to.equal(4);
      expect(detentIndex(target, 15)).to.equal(1);
      expect(detentIndex(numberTarget(), 14)).to.equal(14);
      expect(detentIndex(numberTarget(), 6.4)).to.equal(6);
      expect(detentIndex(numberTarget(), 6.6)).to.equal(7);
    });

    it('matches the wheel across every half-step value in an off-lattice range', async () => {
      const target = numberTarget({ max: 100, step: 30 });
      const wheel = await fixture<MpSpeedWheel>(html`
        <mp-speed-wheel .min=${target.min} .max=${target.max} .step=${target.step}></mp-speed-wheel>
      `);
      const detents = [0, 30, 60, 90, 100];
      for (let value = 0; value <= 100; value += 0.5) {
        wheel.value = value;
        await wheel.updateComplete;
        const wheelIndex = detents.indexOf(Number(wheel.getAttribute('aria-valuenow')));
        expect(wheelIndex, `wheel detent for ${value}`).to.be.at.least(0);
        expect(detentIndex(target, value), `detent for ${value}`).to.equal(wheelIndex);
      }
    });

    it('uses the terminal detent for percent labels near maximum', () => {
      const target = numberTarget({ max: 100, step: 30 });
      expect(speedPercent(target, 96)).to.equal(100);
      expect(speedPercent(target, 94)).to.equal(80);
    });

    it('counts regular and terminal detents, including decimal steps', () => {
      expect(detentCount(0, 14, 1)).to.equal(15);
      expect(detentCount(0, 100, 30)).to.equal(5);
      expect(detentCount(0, 0.3, 0.1)).to.equal(4);
      expect(detentCount(4, 4, 1)).to.equal(1);
      expect(detentCount(0, 14, 0)).to.equal(1);
      expect(detentCount(14, 0, 1)).to.equal(1);
      expect(detentCount(0, Infinity, 1)).to.equal(1);
    });

    it('rounds and clamps indices and reserves the final index for the maximum', () => {
      expect(detentIndex(numberTarget(), null)).to.equal(null);
      expect(detentIndex(numberTarget(), -1)).to.equal(0);
      expect(detentIndex(numberTarget(), 3.6)).to.equal(4);
      expect(detentIndex(numberTarget(), 20)).to.equal(14);
      expect(detentIndex(numberTarget({ min: 5, max: 105, step: 30 }), 65)).to.equal(2);
      expect(detentIndex(numberTarget({ max: 100, step: 30 }), 90)).to.equal(3);
      expect(detentIndex(numberTarget({ max: 100, step: 30 }), 100)).to.equal(4);
    });
  });

  describe('coverage', () => {
    it('derives rounded area from airflow and formats an en dash', () => {
      expect(coverageRange(360)).to.deep.equal([25, 43]);
      expect(formatCoverage(coverageRange(360))).to.equal('25–43 m²');
      expect(coverageRange(180)).to.deep.equal([13, 22]);
      expect(formatCoverage(coverageRange(180))).to.equal('13–22 m²');
    });

    it('returns null for missing or invalid airflow', () => {
      for (const airflow of [null, 0, -1, NaN, Infinity]) {
        expect(coverageRange(airflow)).to.equal(null);
        expect(formatCoverage(coverageRange(airflow))).to.equal(null);
      }
    });
  });

  describe('speedPercent', () => {
    it('maps number and input_number detents to percentages', () => {
      for (const kind of ['number', 'input_number'] as const) {
        expect(speedPercent(numberTarget({ kind }), 0)).to.equal(7);
        expect(speedPercent(numberTarget({ kind }), 7)).to.equal(53);
        expect(speedPercent(numberTarget({ kind }), 14)).to.equal(100);
      }
      expect(speedPercent(numberTarget({ max: 100, step: 30 }), 90)).to.equal(80);
      expect(speedPercent(numberTarget({ max: 100, step: 30 }), 100)).to.equal(100);
      expect(speedPercent(numberTarget(), null)).to.equal(null);
    });

    it('leaves fan percentages unchanged', () => {
      expect(speedPercent(numberTarget({ kind: 'fan_percentage' }), 40)).to.equal(40);
      expect(speedPercent(numberTarget({ kind: 'fan_percentage' }), 0)).to.equal(0);
    });
  });

  describe('formatSpeed', () => {
    it('defaults to percent display for number entities', () => {
      expect(formatSpeed(numberTarget(), 0)).to.equal('7%');
      expect(formatSpeed(numberTarget(), 7, 'percent')).to.equal('53%');
      expect(formatSpeed(numberTarget(), 14)).to.equal('100%');
    });

    it('formats null, percentages, levels, and units', () => {
      expect(formatSpeed(numberTarget(), null)).to.equal('—');
      expect(formatSpeed(numberTarget(), null, 'level')).to.equal('—');
      expect(formatSpeed(numberTarget({ kind: 'fan_percentage', unit: '%' }), 40)).to.equal('40%');
      expect(formatSpeed(numberTarget({ kind: 'fan_percentage' }), 40, 'level')).to.equal('40%');
      expect(formatSpeed(numberTarget(), 0, 'level')).to.equal('Level 0');
      expect(formatSpeed(numberTarget({ kind: 'input_number' }), 3.5, 'level')).to.equal(
        'Level 3.5'
      );
      expect(formatSpeed(numberTarget({ unit: 'rpm' }), 100, 'level')).to.equal('100 rpm');
      expect(formatSpeed(numberTarget({ kind: 'input_number', unit: '%' }), 40, 'level')).to.equal(
        '40 %'
      );
    });
  });
});
