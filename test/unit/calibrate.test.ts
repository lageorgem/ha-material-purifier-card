import { expect } from '@open-wc/testing';
import { calibrationSteps, runCalibration, type CalibrationProgress } from '../../src/calibrate';
import type { SpeedTarget } from '../../src/speed';
import { entityState, fanState, makeHass } from '../helpers';

const target: SpeedTarget = {
  kind: 'number',
  entity: 'number.level',
  available: true,
  min: 0,
  max: 14,
  step: 1,
  value: 14,
  unit: '',
};

function fixture(readings = [1000, 1005, 1005], interval = 3000) {
  const epoch = Date.now();
  let time = 0;
  let started = 0;
  let active = false;
  let value = 0;
  const hass = makeHass({
    'fan.test': fanState(),
    'number.level': entityState('number.level', '14'),
    'sensor.rpm': {
      ...entityState('sensor.rpm', '900'),
      last_reported: new Date(epoch).toISOString(),
    },
  });
  const call = hass.callService.bind(hass);
  hass.callService = async (domain, service, data) => {
    await call(domain, service, data);
    if (service === 'set_preset_mode')
      hass.states['fan.test'].attributes.preset_mode = data!.preset_mode;
    if (service === 'turn_off') hass.states['fan.test'].state = 'off';
    if (service === 'turn_on') hass.states['fan.test'].state = 'on';
    if (service === 'set_value' || service === 'set_percentage') {
      value = Number(data!.value ?? data!.percentage);
      started = time;
      active = true;
      if (service === 'set_value') hass.states['number.level'].state = String(value);
      else hass.states['fan.test'].attributes.percentage = value;
    }
  };
  const opts = {
    fanEntity: 'fan.test',
    rpmEntity: 'sensor.rpm',
    target,
    now: () => epoch + time,
    sleep: async (ms: number) => {
      time += ms;
      if (active) {
        const index = Math.floor((time - started) / interval) - 1;
        if (index >= 0 && index < readings.length) {
          const previous = hass.states['sensor.rpm'];
          const state = String(readings[index] + value);
          hass.states['sensor.rpm'] = {
            ...entityState('sensor.rpm', state),
            last_updated:
              previous.state === state
                ? previous.last_updated
                : new Date(epoch + started + (index + 1) * interval).toISOString(),
            last_reported: new Date(epoch + started + (index + 1) * interval).toISOString(),
          } as any;
        }
      }
    },
  };
  return { hass, opts, time: () => time };
}

describe('calibration', () => {
  it('uses ascending deduplicated lattice values and both endpoints', () => {
    expect(calibrationSteps(target)).to.deep.equal([0, 14]);
    expect(calibrationSteps(target, 5)).to.deep.equal([0, 4, 7, 11, 14]);
    expect(calibrationSteps({ ...target, max: 2 }, 5)).to.deep.equal([0, 1, 2]);
    expect(
      calibrationSteps({ ...target, kind: 'fan_percentage', min: 20, max: 100, step: 20 })
    ).to.deep.equal([20, 100]);
    expect(calibrationSteps({ ...target, kind: 'fan_percentage', min: 1, max: 100 })).to.deep.equal(
      [1, 100]
    );
  });

  it('measures identical readings, emits phases and restores value before Auto', async () => {
    const f = fixture();
    const phases: string[] = [];
    const points = await runCalibration(() => f.hass, {
      ...f.opts,
      onProgress: (p) => phases.push(p.phase),
    });
    expect(points).to.deep.equal([0, 14].map((value) => ({ value, rpm: 1005 + value })));
    expect(
      f.hass.__calls.filter((c) => c.service === 'set_value').map((c) => c.data!.value)
    ).to.deep.equal([14, 0, 14]);
    expect(phases).to.include.members(['switching', 'settling', 'sampling', 'restoring', 'done']);
    expect(f.hass.__calls.slice(-2).map((c) => c.service)).to.deep.equal([
      'set_value',
      'set_preset_mode',
    ]);
    expect(f.hass.states['number.level'].state).to.equal('14');
    expect(f.hass.states['fan.test'].attributes.preset_mode).to.equal('Auto');
  });

  it('waits through ramping readings before accepting convergence', async () => {
    const f = fixture([700, 1500, 2000, 2050, 2060, 2060]);
    const points = await runCalibration(() => f.hass, f.opts);
    expect(points[0].rpm).to.equal(2060);
    expect(f.time()).to.equal(2 * 18000);
  });

  it('supports slow polling and repeated values with fresh timestamps', async () => {
    const f = fixture([1000, 1000], 30000);
    const points = await runCalibration(() => f.hass, { ...f.opts, pollMs: 30000 });
    expect(points).to.have.length(2);
    expect(points[0].rpm).to.equal(1000);
    expect(f.time()).to.equal(2 * 62000);
  });

  it('uses timeout medians without treating stale polls as fresh samples', async () => {
    const f = fixture([700, 1500, 2000, 2050, 2060]);
    const progress: CalibrationProgress[] = [];
    const points = await runCalibration(() => f.hass, {
      ...f.opts,
      stepTimeoutMs: 16000,
      onProgress: (p) => progress.push(p),
    });
    expect(points[0].rpm).to.equal(2050);
    expect(
      progress
        .filter((p) => p.phase === 'sampling' && p.rpm !== null)
        .every((p) => p.stable === false)
    ).to.equal(true);
  });

  it('does not count the same timestamp twice, even if the value changes', async () => {
    const f = fixture([1000, 2000]);
    const sleep = f.opts.sleep;
    let timestamp: string | undefined;
    const points = await runCalibration(() => f.hass, {
      ...f.opts,
      stepTimeoutMs: 10000,
      sleep: async (ms) => {
        await sleep(ms);
        const state = f.hass.states['sensor.rpm'] as any;
        if (f.time() % 10000 >= 3000) timestamp ??= state.last_updated;
        if (timestamp) state.last_reported = timestamp;
      },
      onProgress: (p) => {
        if (p.phase === 'switching') timestamp = undefined;
        if (p.phase === 'sampling' && p.rpm !== null) expect(p.stable).to.equal(false);
      },
    });
    expect(points[0].rpm).to.equal(1000);
    expect(f.time()).to.equal(20000);
  });

  it('ignores readings taken before switch plus two seconds', async () => {
    const f = fixture([700, 700, 1500, 2000, 2060, 2060], 1000);
    const points = await runCalibration(() => f.hass, f.opts);
    expect(points[0].rpm).to.equal(2060);
    expect(f.time()).to.equal(12000);
  });

  it('defaults to a 90 second timeout when no second fresh report arrives', async () => {
    const f = fixture([1000]);
    const points = await runCalibration(() => f.hass, {
      ...f.opts,
      onProgress: (p) => {
        if (p.phase === 'sampling' && p.rpm !== null) expect(p.stable).to.equal(false);
      },
    });
    expect(points[0].rpm).to.equal(1000);
    expect(f.time()).to.equal(180000);
  });

  for (const reported of [false, true])
    it(`waits for a quiet window after fresh readings (last_reported: ${reported})`, async () => {
      const f = fixture([2040, 2052, 2056]);
      if (!reported) delete (f.hass.states['sensor.rpm'] as any).last_reported;
      const sleep = f.opts.sleep;
      const points = await runCalibration(() => f.hass, {
        ...f.opts,
        sleep: async (ms) => {
          await sleep(ms);
          if (!reported) delete (f.hass.states['sensor.rpm'] as any).last_reported;
        },
        onProgress: (p) => {
          if (p.phase === 'sampling' && p.rpm !== null) expect(p.stable).to.equal(true);
        },
      });
      expect(points[0].rpm).to.equal(2056);
      expect(f.time()).to.equal(30000);
    });

  it('requires two fresh readings even without last_reported', async () => {
    const f = fixture([1000]);
    const sleep = f.opts.sleep;
    delete (f.hass.states['sensor.rpm'] as any).last_reported;
    await runCalibration(() => f.hass, {
      ...f.opts,
      sleep: async (ms) => {
        await sleep(ms);
        delete (f.hass.states['sensor.rpm'] as any).last_reported;
      },
      onProgress: (p) => {
        if (p.phase === 'sampling' && p.rpm !== null) expect(p.stable).to.equal(false);
      },
    });
    expect(f.time()).to.equal(180000);
  });

  it('scales the quiet window to twice the median fresh-reading gap', async () => {
    const f = fixture([2000, 2040, 2056], 9000);
    await runCalibration(() => f.hass, f.opts);
    expect(f.time()).to.equal(90000);
  });

  it('uses the median gap rather than the last gap for the fallback', async () => {
    const f = fixture();
    let started = 0;
    const schedule = [3000, 12000, 15000];
    const points = await runCalibration(() => f.hass, {
      ...f.opts,
      onProgress: (p) => {
        if (p.phase === 'switching') started = f.time();
        if (p.phase === 'sampling' && p.rpm !== null) expect(p.stable).to.equal(true);
      },
      sleep: async (ms) => {
        await f.opts.sleep(ms);
        const elapsed = f.time() - started;
        const index = schedule.filter((taken) => taken <= elapsed).length - 1;
        if (index < 0) return;
        f.hass.states['sensor.rpm'] = {
          ...entityState('sensor.rpm', String(2000 + index)),
          last_updated: new Date(f.opts.now() - elapsed + schedule[index]).toISOString(),
        };
      },
    });
    // Gaps of 9s and 3s have a 6s median: require 12s quiet, not 6s.
    expect(points.map((p) => p.rpm)).to.deep.equal([2002, 2002]);
    expect(f.time()).to.equal(54000);
  });

  it('skips missing readings and rejects insufficient points after restoring', async () => {
    const f = fixture([]);
    try {
      await runCalibration(() => f.hass, { ...f.opts, stepTimeoutMs: 5000 });
      expect.fail('Expected rejection');
    } catch (error) {
      expect((error as Error).message).to.equal('Not enough readings');
    }
    expect(f.hass.__calls.at(-1)!.service).to.equal('set_preset_mode');
  });

  it('restores an originally off fan', async () => {
    const f = fixture();
    f.hass.states['fan.test'].state = 'off';
    await runCalibration(() => f.hass, f.opts);
    expect(f.hass.__calls.at(-1)!.service).to.equal('turn_off');
  });

  it('restores on abort between polls', async () => {
    const f = fixture();
    const controller = new AbortController();
    const sleep = f.opts.sleep;
    try {
      await runCalibration(() => f.hass, {
        ...f.opts,
        signal: controller.signal,
        sleep: async (ms) => {
          await sleep(ms);
          controller.abort();
        },
      });
      expect.fail('Expected abort');
    } catch (error) {
      expect((error as Error).name).to.equal('AbortError');
    }
    expect(f.hass.__calls.slice(-2).map((c) => c.service)).to.deep.equal([
      'set_value',
      'set_preset_mode',
    ]);
  });

  it('restores even when setting the speed fails', async () => {
    const f = fixture();
    const call = f.hass.callService.bind(f.hass);
    let failed = false;
    f.hass.callService = async (domain, service, data) => {
      if (service === 'set_value' && !failed) {
        failed = true;
        throw new Error('Service failed');
      }
      return call(domain, service, data);
    };
    try {
      await runCalibration(() => f.hass, f.opts);
      expect.fail('Expected rejection');
    } catch (error) {
      expect((error as Error).message).to.equal('Service failed');
    }
    expect(f.hass.states['fan.test'].attributes.preset_mode).to.equal('Auto');
    expect(f.hass.states['number.level'].state).to.equal('14');
  });

  it('validates before any device mutation', async () => {
    for (const invalid of ['rpm', 'target']) {
      const f = fixture();
      if (invalid === 'rpm') f.hass.states['sensor.rpm'].state = 'unknown';
      try {
        await runCalibration(() => f.hass, {
          ...f.opts,
          target: invalid === 'target' ? { ...target, available: false } : target,
        });
        expect.fail('Expected rejection');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
      expect(f.hass.__calls).to.have.length(0);
    }
  });

  it('restores the preset even before HA reports a successful switch', async () => {
    const f = fixture();
    const call = f.hass.callService.bind(f.hass);
    f.hass.callService = async (domain, service, data) => {
      if (service === 'set_preset_mode' && data!.preset_mode === 'Favorite') {
        f.hass.__calls.push({ domain, service, data });
        throw new Error('Lost response');
      }
      return call(domain, service, data);
    };
    try {
      await runCalibration(() => f.hass, f.opts);
      expect.fail('Expected rejection');
    } catch (error) {
      expect((error as Error).message).to.equal('Lost response');
    }
    expect(f.hass.__calls.at(-1)!.data!.preset_mode).to.equal('Auto');
  });

  it('does not mask the original error or skip turn_off when restoring speed fails', async () => {
    const f = fixture();
    f.hass.states['fan.test'].state = 'off';
    const call = f.hass.callService.bind(f.hass);
    let failed = false;
    f.hass.callService = async (domain, service, data) => {
      if (service === 'set_value') {
        const message = failed ? 'Restore failed' : 'Original failure';
        failed = true;
        throw new Error(message);
      }
      return call(domain, service, data);
    };
    const warn = console.warn;
    const logged: unknown[] = [];
    console.warn = (...args) => {
      logged.push(args);
    };
    try {
      try {
        await runCalibration(() => f.hass, f.opts);
        expect.fail('Expected rejection');
      } catch (error) {
        expect((error as Error).message).to.equal('Original failure');
      }
      expect(f.hass.__calls.at(-1)!.service).to.equal('turn_off');
      expect(logged).to.have.length(1);
    } finally {
      console.warn = warn;
    }
  });

  it('measures and restores fan percentages directly', async () => {
    const f = fixture();
    f.hass.states['fan.test'].attributes.percentage = 60;
    const points = await runCalibration(() => f.hass, {
      ...f.opts,
      target: {
        ...target,
        kind: 'fan_percentage',
        entity: 'fan.test',
        min: 20,
        max: 100,
        step: 20,
        value: 60,
      },
    });
    expect(points.map((p) => p.value)).to.deep.equal([20, 100]);
    expect(f.hass.states['fan.test'].attributes.percentage).to.equal(60);
    expect(f.hass.__calls.slice(-2).map((c) => c.service)).to.deep.equal([
      'set_percentage',
      'set_preset_mode',
    ]);
  });
});
