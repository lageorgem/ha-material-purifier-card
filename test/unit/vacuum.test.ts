import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import {
  DEFAULT_THRESHOLDS,
  resolveDustLevel,
  thresholdFor,
  vacuumProgress,
  volumeFromRuntime,
  runtimeRatePerHour,
  etaDays,
  fetchHourlyChanges,
  formatEta,
} from '../../src/calc/vacuum';
import type { DustLevel } from '../../src/types';

describe('vacuum calculations', () => {
  it('keeps the dust thresholds', () => {
    expect(DEFAULT_THRESHOLDS).to.deep.equal({ low: 250000, medium: 125000, high: 62500 });
  });

  it('resolves all normalized dust aliases and fallback states', () => {
    const aliases: Record<DustLevel, string[]> = {
      low: ['low', 'light'],
      medium: ['medium', 'med', 'moderate', 'normal'],
      high: ['high', 'heavy'],
    };
    for (const level of ['low', 'medium', 'high'] as const) {
      for (const alias of aliases[level])
        expect(resolveDustLevel(` ${alias.toUpperCase()} `)).to.equal(level);
    }
    for (const state of [undefined, null, '', 'unknown', 'unavailable', 'dusty']) {
      expect(resolveDustLevel(state)).to.equal('medium');
      expect(resolveDustLevel(state, 'high')).to.equal('high');
    }
  });

  it('accepts only positive finite threshold overrides', () => {
    for (const level of ['low', 'medium', 'high'] as const) {
      expect(thresholdFor(level)).to.equal(DEFAULT_THRESHOLDS[level]);
      expect(thresholdFor(level, { [level]: 123 })).to.equal(123);
      for (const value of [0, -1, NaN, Infinity, -Infinity]) {
        expect(thresholdFor(level, { [level]: value })).to.equal(DEFAULT_THRESHOLDS[level]);
      }
    }
  });

  it('converts counter rpm-hours without rounding and clamps negative values', () => {
    expect(volumeFromRuntime(33000, 360, 2200)).to.equal(5400);
    expect(volumeFromRuntime(8.5, 100, 200)).to.equal(4.25);
    expect(volumeFromRuntime(-10, 360, 2200)).to.equal(0);
    expect(volumeFromRuntime(0, 360, 2200)).to.equal(0);
  });

  it('rejects missing or invalid runtime inputs and device settings', () => {
    for (const invalid of [null, NaN, Infinity, -Infinity]) {
      expect(volumeFromRuntime(invalid, 360, 2200)).to.equal(null);
    }
    for (const invalid of [null, 0, -1, NaN, Infinity, -Infinity]) {
      expect(volumeFromRuntime(100, invalid, 2200)).to.equal(null);
      expect(volumeFromRuntime(100, 360, invalid)).to.equal(null);
    }
  });

  it('uses the exact average since reset for the live partial-day counter', () => {
    const now = Date.parse('2026-10-12T10:00:00Z');
    const rate = runtimeRatePerHour(
      [{ start: now - 3600000, change: 71.11 }],
      now,
      186.17,
      now - 0.38 * 3600000
    )!;
    expect(rate).to.be.closeTo(490, 0.1);
    const daily = volumeFromRuntime(rate * 24, 360, 2048)!;
    expect(daily).to.be.closeTo(2067, 1);
    const days = etaDays(125000 - volumeFromRuntime(186.17, 360, 2048)!, daily)!;
    expect(days).to.be.closeTo(60, 1);
    expect(formatEta(days)).to.equal('In 2 months');
  });

  it('includes off periods and accepts exactly a quarter hour since reset', () => {
    expect(runtimeRatePerHour([], 3600000, 100, 0)).to.equal(100);
    expect(runtimeRatePerHour([], 900000, 100, 0)).to.equal(400);
    expect(runtimeRatePerHour([], 3600000, 0, 0)).to.equal(0);
  });

  it('averages 14 days of hourly changes over their covered hours', () => {
    const rows = Array.from({ length: 14 * 24 }, (_, i) => ({ start: i * 3600000, change: 500 }));
    expect(runtimeRatePerHour(rows, 14 * 86400000, 186.17, null)).to.equal(500);
    expect(runtimeRatePerHour(rows.reverse(), 14 * 86400000, null, null)).to.equal(500);
  });

  it('ignores negative changes without removing their hours or gaps', () => {
    expect(
      runtimeRatePerHour(
        [
          { start: 0, change: 300 },
          { start: 3600000, change: -200 },
          { start: 7200000, change: 0 },
        ],
        0,
        null,
        null
      )
    ).to.equal(100);
    expect(
      runtimeRatePerHour(
        [
          { start: 0, change: 100 },
          { start: 10800000, change: 300 },
        ],
        0,
        null,
        null
      )
    ).to.equal(100);
    expect(runtimeRatePerHour([{ start: 0, change: 71.11 }], 0, null, null)).to.equal(71.11);
  });

  it('falls back for unknown, future, too recent resets or invalid counters', () => {
    const rows = [{ start: 0, change: 50 }];
    for (const reset of [null, NaN, Infinity, 3600001, 3600000 - 899999])
      expect(runtimeRatePerHour(rows, 3600000, 100, reset)).to.equal(50);
    for (const counter of [null, NaN, Infinity, -1])
      expect(runtimeRatePerHour(rows, 3600000, counter, 0)).to.equal(50);
    expect(runtimeRatePerHour([], 899999, 100, 0)).to.equal(null);
    expect(runtimeRatePerHour([], 0, null, null)).to.equal(null);
    expect(
      runtimeRatePerHour(
        [
          { start: NaN, change: 100 },
          { start: 0, change: Infinity },
        ],
        0,
        null,
        null
      )
    ).to.equal(null);
  });

  it('reports progress below, at, and above the threshold', () => {
    expect(vacuumProgress(25, 100)).to.deep.equal({
      fraction: 0.25,
      rawFraction: 0.25,
      remainingM3: 75,
      due: false,
    });
    expect(vacuumProgress(100, 100)).to.deep.equal({
      fraction: 1,
      rawFraction: 1,
      remainingM3: 0,
      due: true,
    });
    expect(vacuumProgress(150, 100)).to.deep.equal({
      fraction: 1,
      rawFraction: 1.5,
      remainingM3: 0,
      due: true,
    });
    for (const volume of [0, -10, NaN]) {
      expect(vacuumProgress(volume, 100)).to.deep.equal({
        fraction: 0,
        rawFraction: 0,
        remainingM3: 100,
        due: false,
      });
    }
  });

  it('computes ETA or returns unavailable for invalid daily estimates', () => {
    expect(etaDays(100, 25)).to.equal(4);
    expect(etaDays(0, 25)).to.equal(0);
    expect(etaDays(-100, 25)).to.equal(0);
    for (const daily of [null, 0, -1, NaN, Infinity, -Infinity])
      expect(etaDays(100, daily)).to.equal(null);
  });

  it('formats every ETA branch without approximation marks', () => {
    for (const [days, formatted] of [
      [null, 'No estimate yet'],
      [-1, 'Due now'],
      [0, 'Due now'],
      [0.5, 'Due today'],
      [1, 'In 1 day'],
      [1.49, 'In 1 day'],
      [1.5, 'In 2 days'],
      [11, 'In 11 days'],
      [13.4, 'In 13 days'],
      [13.9, 'In 14 days'],
      [14, 'In 2 weeks'],
      [25, 'In 4 weeks'],
      [28, 'In 4 weeks'],
      [29, 'In 1 month'],
      [57, 'In 2 months'],
      [400, 'In 13 months'],
    ] as const)
      expect(formatEta(days)).to.equal(formatted);
  });
});

describe('fetchHourlyChanges', () => {
  it('requests hourly changes and keeps finite numeric entries with their start times', async () => {
    const entityId = 'sensor.runtime';
    const callWS = sinon.stub().resolves({
      [entityId]: [
        { start: 0, change: 100 },
        { change: null },
        { start: 3600000, change: 0 },
        { change: '200' },
        { change: NaN },
        { change: Infinity },
        { change: -Infinity },
        { start: 7200000, change: -1 },
        {},
        { start: 10800000, change: 300 },
        { start: '2026-10-11T12:00:00Z', change: 100 },
        { start: NaN, change: 100 },
      ],
      'sensor.other': [{ change: 999 }],
    });
    expect(
      await fetchHourlyChanges({ callWS }, entityId, 3, new Date('2026-10-11T12:00:00Z'))
    ).to.deep.equal([
      { start: 0, change: 100 },
      { start: 3600000, change: 0 },
      { start: 7200000, change: -1 },
      { start: 10800000, change: 300 },
    ]);
    expect(
      callWS.calledOnceWithExactly({
        type: 'recorder/statistics_during_period',
        start_time: '2026-10-08T12:00:00.000Z',
        statistic_ids: [entityId],
        period: 'hour',
        types: ['change'],
      })
    ).to.equal(true);
  });

  it('defaults to a 14-day window and current time', async () => {
    const clock = sinon.useFakeTimers(new Date('2026-10-11T12:00:00Z').getTime());
    try {
      const callWS = sinon.stub().resolves({});
      expect(await fetchHourlyChanges({ callWS }, 'sensor.runtime')).to.deep.equal([]);
      expect(
        callWS.calledOnceWithExactly({
          type: 'recorder/statistics_during_period',
          start_time: '2026-09-27T12:00:00.000Z',
          statistic_ids: ['sensor.runtime'],
          period: 'hour',
          types: ['change'],
        })
      ).to.equal(true);
    } finally {
      clock.restore();
    }
  });

  it('returns no changes for malformed data or recorder errors', async () => {
    for (const response of [
      {},
      null,
      { 'sensor.runtime': null },
      { 'sensor.runtime': {} },
      { 'sensor.runtime': [] },
    ]) {
      expect(
        await fetchHourlyChanges({ callWS: sinon.stub().resolves(response) }, 'sensor.runtime')
      ).to.deep.equal([]);
    }
    expect(
      await fetchHourlyChanges(
        { callWS: sinon.stub().rejects(new Error('Unavailable')) },
        'sensor.runtime'
      )
    ).to.deep.equal([]);
  });
});
