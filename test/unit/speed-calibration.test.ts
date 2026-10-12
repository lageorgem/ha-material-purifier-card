import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import {
  buildCalibration,
  calibrationFromConfig,
  rpmAtDetent,
  maxRpmOf,
  resolveMaxRpm,
  airflowAt,
  detentFromRpm,
  fetchCalibration,
  getCalibration,
  type CalibrationSource,
} from '../../src/speed-calibration';
import { makeHass } from '../helpers';
import type { MaterialPurifierCardConfig } from '../../src/types';

const now = new Date('2026-10-12T12:00:00Z');
const start = now.getTime() - 60 * 60000;
const record = (minute: number, s: string, a?: Record<string, unknown>) => ({
  s,
  lu: (start + minute * 60000) / 1000,
  ...(a === undefined ? {} : { a }),
});
const source: CalibrationSource = {
  fanEntity: 'fan.calibration',
  speedEntity: 'number.speed',
  rpmEntity: 'sensor.rpm',
  speedPreset: 'Favorite',
  target: {
    kind: 'number',
    entity: 'number.speed',
    available: true,
    min: 1,
    max: 5,
    step: 1,
    value: 1,
    unit: '',
  },
};
const history = {
  [source.fanEntity]: [
    record(0, 'on', { preset_mode: 'fAvOrItE' }),
    record(5, 'on'),
    record(20, 'on', { preset_mode: 'Auto' }),
    record(30, 'on', { preset_mode: 'Favorite' }),
    record(40, 'off'),
    record(45, 'on'),
    record(47, 'off'),
  ],
  [source.speedEntity]: [record(0, '1'), record(10, '3'), record(35, '5')],
};

const cacheKey = (src: CalibrationSource) =>
  `material-purifier-card:cal:v3:${JSON.stringify({
    fanEntity: src.fanEntity,
    speedEntity: src.speedEntity,
    rpmEntity: src.rpmEntity,
    speedPreset: src.speedPreset.toLowerCase(),
    kind: src.target.kind,
    min: src.target.min,
    max: src.target.max,
    step: src.target.step,
  })}`;

describe('speed calibration', () => {
  const card: MaterialPurifierCardConfig = {
    type: 'custom:material-purifier-card',
    entity: 'fan.test',
  };

  it('maps configured values to number and percentage detents', () => {
    expect(
      calibrationFromConfig(
        [
          { value: 0, rpm: 400 },
          { value: 7, rpm: 1200 },
          { value: 14, rpm: 2100 },
        ],
        { ...source.target, min: 0, max: 14 }
      )
    ).to.deep.equal({
      points: [
        { detent: 0, rpm: 400 },
        { detent: 7, rpm: 1200 },
        { detent: 14, rpm: 2100 },
      ],
    });
    expect(
      calibrationFromConfig(
        [
          { value: 20, rpm: 400 },
          { value: 100, rpm: 2100 },
        ],
        { ...source.target, kind: 'fan_percentage', min: 20, max: 100, step: 20 }
      )
    ).to.deep.equal({
      points: [
        { detent: 0, rpm: 400 },
        { detent: 4, rpm: 2100 },
      ],
    });
    expect(calibrationFromConfig(undefined, source.target)).to.equal(null);
    expect(calibrationFromConfig([], source.target)).to.equal(null);
    expect(
      calibrationFromConfig(
        [
          { value: NaN, rpm: 400 },
          { value: 5, rpm: 1000 },
        ],
        source.target
      )
    ).to.equal(null);
  });

  it('interpolates forward, extrapolates at both ends, and clamps negative rpm', () => {
    const cal = {
      points: [
        { detent: 1, rpm: 200 },
        { detent: 3, rpm: 400 },
        { detent: 5, rpm: 1000 },
      ],
    };
    expect(rpmAtDetent(cal, 2)).to.equal(300);
    expect(rpmAtDetent(cal, 4)).to.equal(700);
    expect(rpmAtDetent(cal, 0)).to.equal(100);
    expect(rpmAtDetent(cal, 6)).to.equal(1300);
    expect(rpmAtDetent(cal, -5)).to.equal(0);
    expect(rpmAtDetent(cal, 5)).to.equal(1000);
    expect(rpmAtDetent(cal, NaN)).to.equal(null);
    expect(rpmAtDetent({ points: [] }, 1)).to.equal(null);
    expect(rpmAtDetent({ points: [{ detent: 1, rpm: 200 }] }, 1)).to.equal(null);
    expect(maxRpmOf(cal)).to.equal(1000);
    expect(maxRpmOf(null)).to.equal(null);
    expect(maxRpmOf({ points: [] })).to.equal(null);
  });

  it('resolves max rpm from a valid override or highest configured rpm without a default', () => {
    const calibration = [
      { value: 14, rpm: 2100 },
      { value: 0, rpm: 400 },
    ];
    expect(resolveMaxRpm({ ...card, calibration, max_rpm: 1800 })).to.equal(1800);
    expect(resolveMaxRpm({ ...card, calibration })).to.equal(2100);
    for (const max_rpm of [0, -1, NaN, Infinity]) {
      expect(resolveMaxRpm({ ...card, calibration, max_rpm })).to.equal(2100);
    }
    expect(resolveMaxRpm(card)).to.equal(null);
    expect(resolveMaxRpm({ ...card, calibration: [] })).to.equal(null);
    expect(
      resolveMaxRpm({
        ...card,
        calibration: [
          { value: 0, rpm: NaN },
          { value: 1, rpm: -1 },
        ],
      })
    ).to.equal(null);
  });

  it('scales CADR by rpm and clamps the fraction, requiring all inputs', () => {
    const configured = { ...card, cadr: 360, max_rpm: 2100 };
    expect(airflowAt(configured, 1050)).to.equal(180);
    expect(airflowAt(configured, 3000)).to.equal(360);
    expect(airflowAt(configured, -1)).to.equal(0);
    expect(airflowAt(configured, 0)).to.equal(0);
    expect(
      airflowAt({ ...card, cadr: 360, calibration: [{ value: 14, rpm: 2100 }] }, 1050)
    ).to.equal(180);
    for (const rpm of [null, NaN, Infinity]) expect(airflowAt(configured, rpm)).to.equal(null);
    expect(airflowAt(card, 1050)).to.equal(null);
    expect(airflowAt({ ...card, cadr: 360 }, 1050)).to.equal(null);
    expect(airflowAt({ ...card, max_rpm: 2100 }, 1050)).to.equal(null);
    expect(airflowAt({ ...configured, cadr: NaN }, 1050)).to.equal(null);
  });

  it('learns a monotonic calibration from the real HA history capture', async () => {
    const response = await fetch(new URL('../fixtures-real-history.json', import.meta.url));
    expect(response.ok).to.equal(true);
    const fixture = await response.json();
    const src: CalibrationSource = {
      fanEntity: 'fan.zhimi_rmb1_6ab7_air_purifier',
      speedEntity: 'number.zhimi_rmb1_6ab7_favorite_level',
      rpmEntity: 'sensor.zhimi_rmb1_6ab7_moto_speed_rpm',
      speedPreset: 'Manual',
      target: { ...source.target, min: 0, max: 14 },
    };
    const callWS = sinon.stub();
    callWS.onFirstCall().resolves(fixture.fanLevel);
    callWS.onSecondCall().resolves(fixture.rpm);
    const cal = await fetchCalibration(makeHass({}, { callWS }), src, {
      now: new Date(fixture.now),
    });
    expect(cal).not.to.equal(null);
    const points = cal!.points;
    expect(points.length).to.be.at.least(2);
    const lowest = points.find(({ detent }) => detent === 0 || detent === 2);
    expect(lowest).not.to.equal(undefined);
    expect(lowest!.rpm).to.be.within(350, 800);
    expect(points.find(({ detent }) => detent === 14)!.rpm).to.be.within(1900, 2200);
    points.slice(1).forEach((point, index) => {
      expect(point.detent).to.be.greaterThan(points[index].detent);
      expect(point.rpm).to.be.greaterThan(points[index].rpm);
    });
    expect(detentFromRpm(cal!, 1250, 14)).to.be.within(4, 10);
  });

  afterEach(() => {
    sinon.restore();
    localStorage.clear();
  });

  it('takes medians, pools inversions with equal detent weights, and keeps lower plateaus', () => {
    expect(
      buildCalibration([
        { detent: 0, rpm: 100 },
        { detent: 0, rpm: 300 },
        { detent: 0, rpm: 200 },
        { detent: 1, rpm: 500 },
        { detent: 2, rpm: 300 },
        { detent: 3, rpm: 400 },
        { detent: 4, rpm: 800 },
        { detent: 4, rpm: 0 },
        { detent: 4, rpm: Infinity },
        { detent: 4, rpm: -100 },
      ])
    ).to.deep.equal({
      points: [
        { detent: 0, rpm: 200 },
        { detent: 1, rpm: 400 },
        { detent: 4, rpm: 800 },
      ],
    });
    expect(buildCalibration([])).to.equal(null);
    expect(buildCalibration([{ detent: 1, rpm: 100 }])).to.equal(null);
    expect(
      buildCalibration([
        { detent: 1, rpm: 200 },
        { detent: 2, rpm: 100 },
      ])
    ).to.equal(null);
  });

  it('inverts by interpolation and end extrapolation, clamps, and rejects invalid rpm', () => {
    const cal = {
      points: [
        { detent: 1, rpm: 200 },
        { detent: 3, rpm: 400 },
      ],
    };
    expect(detentFromRpm(cal, 300, 5)).to.equal(2);
    expect(detentFromRpm(cal, 150, 5)).to.equal(0.5);
    expect(detentFromRpm(cal, 500, 5)).to.equal(4);
    expect(detentFromRpm(cal, 1, 5)).to.equal(0);
    expect(detentFromRpm(cal, 1000, 5)).to.equal(5);
    for (const rpm of [0, -1, NaN, Infinity]) {
      expect(detentFromRpm(cal, rpm, 5)).to.equal(null);
    }
  });

  it('merges history, carries attributes, and samples one whole-period rpm request', async () => {
    const callWS = sinon.stub();
    callWS.onCall(0).resolves(history);
    callWS.onSecondCall().resolves({
      [source.rpmEntity]: [
        record(-1, '9000'),
        record(1, '110'),
        record(15, '240'),
        record(31, '280'),
        record(36, '410'),
        record(46, '410'),
        record(61, '9000'),
        record(2, 'unknown'),
        record(3, '0'),
        record(4, '-1'),
      ],
    });
    const cal = await fetchCalibration(makeHass({}, { callWS }), source, {
      now,
      days: 1 / 24,
      windowMs: 4 * 60000,
    });
    expect(callWS.firstCall.args[0]).to.deep.equal({
      type: 'history/history_during_period',
      start_time: new Date(start).toISOString(),
      end_time: now.toISOString(),
      entity_ids: [source.fanEntity, source.speedEntity],
      minimal_response: false,
      no_attributes: false,
      significant_changes_only: false,
    });
    expect(callWS.callCount).to.equal(2);
    expect(callWS.secondCall.args[0]).to.deep.equal({
      type: 'history/history_during_period',
      start_time: new Date(start).toISOString(),
      end_time: now.toISOString(),
      entity_ids: [source.rpmEntity],
      minimal_response: true,
      no_attributes: true,
      significant_changes_only: false,
    });
    expect(cal).to.deep.equal({
      points: [
        { detent: 0, rpm: 110 },
        { detent: 2, rpm: 260 },
        { detent: 4, rpm: 410 },
      ],
    });
  });

  it('keeps legacy segment/window options harmless and makes only two requests', async () => {
    const callWS = sinon.stub().onFirstCall().resolves(history);
    let resolve!: (value: unknown) => void;
    callWS.onSecondCall().returns(
      new Promise((done) => {
        resolve = done;
      })
    );
    const pending = fetchCalibration(makeHass({}, { callWS }), source, {
      now,
      days: 1 / 24,
      maxSegments: 1,
      windowMs: 1,
    });
    await Promise.resolve();
    expect(callWS.callCount).to.equal(2);
    resolve({
      [source.rpmEntity]: [
        record(1, '100'),
        record(15, '300'),
        record(31, '300'),
        record(36, '500'),
        record(46, '500'),
      ],
    });
    expect(await pending).to.deep.equal({
      points: [
        { detent: 0, rpm: 100 },
        { detent: 2, rpm: 300 },
        { detent: 4, rpm: 500 },
      ],
    });
    expect(callWS.callCount).to.equal(2);
  });

  it('accepts readings at settle/end boundaries and closes an ongoing run at now', async () => {
    const callWS = sinon.stub();
    callWS.onFirstCall().resolves({
      [source.fanEntity]: [record(0, 'on', { preset_mode: 'Favorite' })],
      [source.speedEntity]: [record(0, '1'), record(3, 'unknown'), record(5, '5')],
    });
    callWS
      .onSecondCall()
      .resolves({ [source.rpmEntity]: [record(0.25, '100'), record(3, '100'), record(60, '500')] });
    expect(
      await fetchCalibration(makeHass({}, { callWS }), source, { now, days: 1 / 24 })
    ).to.deep.equal({
      points: [
        { detent: 0, rpm: 100 },
        { detent: 4, rpm: 500 },
      ],
    });
    expect(callWS.callCount).to.equal(2);
  });

  it('learns from short Manual runs despite formatting and attribute-only updates', async () => {
    const src = { ...source, speedPreset: 'Manual', target: { ...source.target, min: 0, max: 14 } };
    const second = (t: number, s: string, a?: Record<string, unknown>) => record(t / 60, s, a);
    const callWS = sinon.stub();
    callWS.onFirstCall().resolves({
      [src.fanEntity]: [
        second(0, 'on', { preset_mode: 'mAnUaL' }),
        second(8, 'on', { preset_mode: 'Manual', percentage: 100 }),
        second(17, 'off'),
        second(30, 'on'),
        second(103, 'off'),
        second(120, 'on'),
        second(240, 'off'),
        second(260, 'on'),
        second(457, 'off'),
        second(480, 'on'),
        second(485, 'off'),
      ],
      [src.speedEntity]: [
        second(0, '14'),
        second(7, '14.0'),
        second(30, '14'),
        second(50, '14.0'),
        second(120, '2'),
        second(260, '0'),
        second(280, '0.0'),
      ],
    });
    callWS.onSecondCall().resolves({
      [src.rpmEntity]: [
        second(16, '2076'),
        second(46, '2104'),
        second(60, '2052'),
        second(75, '2108'),
        second(90, '1988'),
        second(136, '716'),
        second(165, '672'),
        second(276, '416'),
        second(300, '456'),
        second(330, '1208'),
        second(360, '416'),
      ],
    });
    expect(await fetchCalibration(makeHass({}, { callWS }), src, { now })).to.deep.equal({
      points: [
        { detent: 0, rpm: 436 },
        { detent: 2, rpm: 694 },
        { detent: 14, rpm: 2076 },
      ],
    });
    expect(callWS.callCount).to.equal(2);
    expect(callWS.firstCall.args[0].start_time).to.equal(
      new Date(now.getTime() - 30 * 86400000).toISOString()
    );
  });

  it('never reuses pre-run readings and requires two samples across multiple runs', async () => {
    const callWS = sinon.stub();
    callWS.onFirstCall().resolves({
      [source.fanEntity]: [
        record(0, 'on', { preset_mode: 'Favorite' }),
        record(2, 'off'),
        record(3, 'on'),
        record(5, 'off'),
        record(6, 'on'),
        record(8, 'off'),
        record(9, 'on'),
        record(11, 'off'),
      ],
      [source.speedEntity]: [record(0, '1'), record(3, '3'), record(6, '5'), record(9, '1')],
    });
    callWS.onSecondCall().resolves({
      [source.rpmEntity]: [
        record(-1, '9000'),
        record(1, '100'),
        record(2.9, '300'),
        record(3.1, '300'),
        record(6.25, '500'),
      ],
    });
    // Detent 0: one sample but two runs, so excluded. Detent 2: only stale/spin-up readings.
    expect(
      await fetchCalibration(makeHass({}, { callWS }), source, { now, days: 1 / 24 })
    ).to.equal(null);
  });

  it('reuses persisted calibration younger than six hours and refreshes at the TTL', async () => {
    const src = { ...source, fanEntity: 'fan.persisted' };
    const key = cacheKey(src);
    const points = [
      { detent: 0, rpm: 100 },
      { detent: 2, rpm: 300 },
    ];
    localStorage.setItem(key, JSON.stringify({ at: now.getTime(), points }));
    const callWS = sinon.stub().resolves({});
    const hass = makeHass({}, { callWS });
    expect(await getCalibration(hass, src, { now })).to.deep.equal({ points });
    expect(callWS.callCount).to.equal(0);
    expect(
      await getCalibration(hass, src, { now: new Date(now.getTime() + 6 * 3600000) })
    ).to.equal(null);
    expect(callWS.callCount).to.equal(2);
  });

  it('deduplicates concurrent requests and persists successful results', async () => {
    const src = { ...source, fanEntity: 'fan.concurrent' };
    const callWS = sinon.stub();
    callWS.onFirstCall().resolves({ ...history, [src.fanEntity]: history[source.fanEntity] });
    callWS.callsFake(async () => ({
      [src.rpmEntity]: [
        record(1, '100'),
        record(15, '300'),
        record(32, '500'),
        record(37, '700'),
        record(46, '700'),
      ],
    }));
    const hass = makeHass({}, { callWS });
    const [a, b] = await Promise.all([
      getCalibration(hass, src, { now, days: 1 / 24 }),
      getCalibration(hass, src, { now, days: 1 / 24 }),
    ]);
    expect(a).to.deep.equal(b);
    expect(a).not.to.equal(null);
    expect(callWS.callCount).to.equal(2);
    const saved = JSON.parse(localStorage.getItem(cacheKey(src))!);
    expect(saved).to.deep.equal({ at: now.getTime(), points: a!.points });
    await getCalibration(hass, src, { now });
    expect(callWS.callCount).to.equal(2);
  });

  it('caches rejection for thirty minutes even with inaccessible storage', async () => {
    const src = { ...source, fanEntity: 'fan.rejected' };
    sinon.stub(Storage.prototype, 'getItem').throws(new Error('denied'));
    const callWS = sinon.stub().rejects(new Error('offline'));
    const hass = makeHass({}, { callWS });
    expect(await getCalibration(hass, src, { now })).to.equal(null);
    expect(await getCalibration(hass, src, { now })).to.equal(null);
    expect(callWS.callCount).to.equal(1);
    expect(
      await getCalibration(hass, src, {
        now: new Date(now.getTime() + 31 * 60000),
      })
    ).to.equal(null);
    expect(callWS.callCount).to.equal(2);
  });

  it('uses distinct cache and in-flight identities for presets and target geometry', async () => {
    const src = { ...source, fanEntity: 'fan.identity' };
    const variants = [
      src,
      { ...src, speedPreset: 'Auto' },
      { ...src, target: { ...src.target, kind: 'input_number' as const } },
      { ...src, target: { ...src.target, min: 0 } },
      { ...src, target: { ...src.target, max: 6 } },
      { ...src, target: { ...src.target, step: 0.5 } },
    ];
    const callWS = sinon.stub().resolves({});
    const hass = makeHass({}, { callWS });
    await Promise.all(variants.map((variant) => getCalibration(hass, variant, { now })));
    expect(callWS.callCount).to.equal(variants.length * 2);
    await Promise.all(variants.map((variant) => getCalibration(hass, variant, { now })));
    await getCalibration(hass, { ...src, speedPreset: 'FAVORITE' }, { now });
    expect(callWS.callCount).to.equal(variants.length * 2);
    for (const variant of variants) {
      expect(JSON.parse(localStorage.getItem(cacheKey(variant))!)).to.deep.equal({
        at: now.getTime(),
        points: null,
      });
    }
  });

  it('persists null results and refreshes only after thirty minutes', async () => {
    const src = { ...source, fanEntity: 'fan.empty' };
    const callWS = sinon.stub().resolves({});
    const hass = makeHass({}, { callWS });
    expect(await getCalibration(hass, src, { now })).to.equal(null);
    expect(JSON.parse(localStorage.getItem(cacheKey(src))!)).to.deep.equal({
      at: now.getTime(),
      points: null,
    });
    expect(
      await getCalibration(hass, src, {
        now: new Date(now.getTime() + 29 * 60000),
      })
    ).to.equal(null);
    expect(callWS.callCount).to.equal(2);
    expect(
      await getCalibration(hass, src, {
        now: new Date(now.getTime() + 31 * 60000),
      })
    ).to.equal(null);
    expect(callWS.callCount).to.equal(4);
  });

  it('loads persisted null results without history requests', async () => {
    const src = { ...source, fanEntity: 'fan.persisted-null' };
    localStorage.setItem(cacheKey(src), JSON.stringify({ at: now.getTime(), points: null }));
    const callWS = sinon.stub().resolves({});
    expect(await getCalibration(makeHass({}, { callWS }), src, { now })).to.equal(null);
    expect(callWS.callCount).to.equal(0);
  });

  for (const points of [
    null,
    [
      { detent: 0, rpm: 100 },
      { detent: 4, rpm: 500 },
    ],
  ]) {
    it(`force bypasses persisted and memory ${points === null ? 'null' : 'curve'} caches and deduplicates normal calls`, async () => {
      const src = { ...source, fanEntity: `fan.forced-${points === null ? 'null' : 'curve'}` };
      localStorage.setItem(cacheKey(src), JSON.stringify({ at: now.getTime(), points }));
      const callWS = sinon.stub();
      const hass = makeHass({}, { callWS });
      await getCalibration(hass, src, { now });
      expect(callWS.callCount).to.equal(0);
      callWS.onFirstCall().resolves({
        [src.fanEntity]: [record(0, 'on', { preset_mode: 'Favorite' })],
        [src.speedEntity]: [record(0, '1'), record(2, '5')],
      });
      callWS.onSecondCall().resolves({ [src.rpmEntity]: [record(1, '200'), record(3, '700')] });
      const forced = getCalibration(hass, src, { now, force: true });
      const normal = getCalibration(hass, src, { now });
      expect(normal).to.equal(forced);
      const cal = await forced;
      expect(callWS.callCount).to.equal(2);
      expect(cal).to.deep.equal({
        points: [
          { detent: 0, rpm: 200 },
          { detent: 4, rpm: 700 },
        ],
      });
      expect(await getCalibration(hass, src, { now })).to.deep.equal(cal);
      expect(JSON.parse(localStorage.getItem(cacheKey(src))!).points).to.deep.equal(cal!.points);
      // Force also bypasses storage without first warming the memory cache.
      const persisted = { ...src, fanEntity: `${src.fanEntity}-persisted` };
      localStorage.setItem(cacheKey(persisted), JSON.stringify({ at: now.getTime(), points }));
      callWS.resolves({});
      await getCalibration(hass, persisted, { now, force: true });
      expect(callWS.callCount).to.equal(4);
    });
  }

  it('shares an ongoing normal history request with a later forced request', async () => {
    const src = { ...source, fanEntity: 'fan.normal-then-force' };
    let finish!: (history: Record<string, unknown>) => void;
    const callWS = sinon.stub();
    callWS.onFirstCall().returns(
      new Promise((done) => {
        finish = done;
      })
    );
    callWS.onSecondCall().resolves({});
    const hass = makeHass({}, { callWS });
    const normal = getCalibration(hass, src, { now });
    const forced = getCalibration(hass, src, { now, force: true });
    expect(forced).to.equal(normal);
    finish({});
    expect(await forced).to.equal(null);
    expect(callWS.callCount).to.equal(2);
  });

  it('discards a fresh v2 null for the same source and learns into v3', async () => {
    const src = { ...source, fanEntity: 'fan.v2-null' };
    const oldKey = cacheKey(src).replace(':v3:', ':v2:');
    localStorage.setItem(oldKey, JSON.stringify({ at: now.getTime(), points: null }));
    const callWS = sinon.stub();
    callWS.onFirstCall().resolves({
      [src.fanEntity]: [record(0, 'on', { preset_mode: 'Favorite' })],
      [src.speedEntity]: [record(0, '1'), record(2, '5')],
    });
    callWS.onSecondCall().resolves({ [src.rpmEntity]: [record(1, '100'), record(3, '500')] });
    const cal = await getCalibration(makeHass({}, { callWS }), src, { now, days: 1 / 24 });
    expect(cal).to.deep.equal({
      points: [
        { detent: 0, rpm: 100 },
        { detent: 4, rpm: 500 },
      ],
    });
    expect(callWS.callCount).to.equal(2);
    expect(localStorage.getItem(oldKey)).to.equal(null);
    expect(JSON.parse(localStorage.getItem(cacheKey(src))!)).to.deep.equal({
      at: now.getTime(),
      points: cal!.points,
    });
  });

  it('prunes old versions and expired entries while retaining fresh and unrelated keys', async () => {
    const points = [
      { detent: 0, rpm: 100 },
      { detent: 2, rpm: 300 },
    ];
    const entries = [
      ['material-purifier-card:cal:v1:old', { at: now.getTime(), points }],
      ['material-purifier-card:cal:v2:fresh', { at: now.getTime(), points: null }],
      ['material-purifier-card:cal:legacy', { at: now.getTime(), points }],
      ['material-purifier-card:cal:v3:expired', { at: now.getTime() - 6 * 3600000, points }],
      [
        'material-purifier-card:cal:v3:expired-null',
        { at: now.getTime() - 30 * 60000, points: null },
      ],
      ['material-purifier-card:cal:v3:fresh', { at: now.getTime() - 3600000, points }],
      ['material-purifier-card:cal:v3:fresh-null', { at: now.getTime(), points: null }],
      ['unrelated', { at: 0, points }],
    ] as const;
    for (const [key, entry] of entries) localStorage.setItem(key, JSON.stringify(entry));
    await getCalibration(
      makeHass({}, { callWS: sinon.stub().resolves({}) }),
      { ...source, fanEntity: 'fan.prune' },
      { now }
    );
    for (const [key] of entries.slice(0, 5)) expect(localStorage.getItem(key)).to.equal(null);
    for (const [key] of entries.slice(5)) expect(localStorage.getItem(key)).not.to.equal(null);
  });

  it('bounds memory to sixteen entries by dropping the oldest', async () => {
    const callWS = sinon.stub().resolves({});
    const hass = makeHass({}, { callWS });
    const sources = Array.from({ length: 17 }, (_, i) => ({
      ...source,
      fanEntity: `fan.memory-${i}`,
    }));
    for (const src of sources) await getCalibration(hass, src, { now });
    expect(callWS.callCount).to.equal(34);
    localStorage.removeItem(cacheKey(sources[0]));
    localStorage.removeItem(cacheKey(sources[16]));
    await getCalibration(hass, sources[16], { now });
    expect(callWS.callCount).to.equal(34);
    await getCalibration(hass, sources[0], { now });
    expect(callWS.callCount).to.equal(36);
  });
});
