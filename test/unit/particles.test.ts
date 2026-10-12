import { expect } from '@open-wc/testing';
import { restore, spy, stub } from 'sinon';
import {
  HALO_EDGE,
  ABSORB_R,
  FADE_START,
  fadeFactor,
  inwardSpeed,
  ParticleField,
  SPAWN_MIN,
  SPAWN_MAX,
  spawnRatePerSecond,
  targetPopulation,
  travelTime,
} from '../../src/dial/particles';

function seededRandom() {
  let seed = 123;
  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

describe('ParticleField', () => {
  const fields: ParticleField[] = [];
  function field(options: ConstructorParameters<typeof ParticleField>[1] = {}) {
    const canvas = document.createElement('canvas');
    const raf = spy(() => 1);
    const caf = spy();
    const instance = new ParticleField(canvas, {
      raf,
      caf,
      now: () => 0,
      random: seededRandom(),
      reducedMotion: () => false,
      ...options,
    });
    instance.resize(200);
    fields.push(instance);
    return { instance, canvas, raf, caf };
  }
  function advance(instance: ParticleField, seconds: number) {
    for (let i = 0; i < Math.round(seconds * 20); i += 1) instance.step(0.05);
  }
  function particles(instance: ParticleField) {
    const state = instance as unknown as {
      pool: { radius: number; angle: number; age: number; lifetime: number; calmAge: number }[];
    };
    return state.pool.slice(0, instance.count);
  }
  const position = (p: { radius: number; angle: number }) => [
    p.radius * Math.cos(p.angle),
    p.radius * Math.sin(p.angle),
  ];

  it('decelerates existing particles continuously to rest and accelerates without resetting', () => {
    const instance = field().instance;
    instance.setDensity(75);
    instance.setSpeed(0.21);
    advance(instance, 5);
    instance.setDensity(0);
    const tracked = particles(instance);
    expect(tracked.length).to.be.greaterThan(0);
    const previous = new Map(tracked.map((p) => [p, position(p)]));
    const displacements = new Map(tracked.map((p) => [p, Infinity]));
    instance.setSpeed(null);
    expect(particles(instance)).to.deep.equal(tracked);
    for (let frame = 0; frame < 180; frame += 1) {
      instance.step(1 / 60);
      for (const p of tracked) {
        if (!particles(instance).includes(p)) {
          expect(p.radius <= ABSORB_R || p.calmAge >= p.lifetime).to.equal(true);
          continue;
        }
        const current = position(p);
        const before = previous.get(p)!;
        const distance = Math.hypot(current[0] - before[0], current[1] - before[1]);
        expect(distance).to.be.at.most(0.01);
        expect(distance).to.be.at.most(displacements.get(p)! + 1e-8);
        previous.set(p, current);
        displacements.set(p, distance);
      }
    }
    const survivors = particles(instance);
    expect(survivors.length).to.be.greaterThan(0);
    for (const p of survivors) expect(displacements.get(p)! * 60).to.be.lessThan(0.01);
    const stopped = survivors.map(position);
    advance(instance, 0.2);
    survivors.forEach((p, i) => expect(position(p)).to.deep.equal(stopped[i]));
    instance.setSpeed(0.21);
    const rising = new Map(survivors.map((p) => [p, 0]));
    survivors.forEach((p) => previous.set(p, position(p)));
    for (let frame = 0; frame < 60; frame += 1) {
      instance.step(1 / 60);
      for (const p of survivors) {
        if (!particles(instance).includes(p)) continue;
        const current = position(p);
        const before = previous.get(p)!;
        const distance = Math.hypot(current[0] - before[0], current[1] - before[1]);
        expect(distance).to.be.at.most(0.01);
        expect(distance + 1e-8).to.be.at.least(rising.get(p)!);
        rising.set(p, distance);
        previous.set(p, current);
      }
    }
  });

  it('does not reseed static particles when power color changes', () => {
    const { instance } = field({ reducedMotion: () => true });
    instance.setDensity(35);
    const before = particles(instance).map(position);
    instance.setSpeed(null);
    instance.setColor('#888888');
    expect(particles(instance).map(position)).to.deep.equal(before);
  });

  it('shortens streaks continuously on power-off without brightening inward particles', () => {
    const { instance, canvas } = field();
    const context = canvas.getContext('2d')!;
    instance.setDensity(75);
    instance.setSpeed(0.94);
    advance(instance, 5);
    instance.setDensity(0);
    const tracked = particles(instance);
    const before = tracked.map(position);
    const draw = () => {
      const tails: number[] = [];
      const alphas: number[] = [];
      let start = [0, 0];
      const move = stub(context, 'moveTo').callsFake((x, y) => {
        start = [x, y];
      });
      const line = stub(context, 'lineTo').callsFake((x, y) => {
        tails.push(Math.hypot(x - start[0], y - start[1]));
      });
      const fill = stub(context, 'fill').callsFake(() => {
        alphas.push(context.globalAlpha);
      });
      instance.setColor('#888888');
      move.restore();
      line.restore();
      fill.restore();
      return { tails, alphas };
    };
    const running = draw();
    expect(running.tails.length).to.be.greaterThan(0);
    instance.setSpeed(null);
    const off = draw();
    expect(off).to.deep.equal(running);
    expect(particles(instance)).to.deep.equal(tracked);
    expect(tracked.map(position)).to.deep.equal(before);
    let previousLength = Infinity;
    for (let frame = 0; frame < 180; frame += 1) {
      instance.step(1 / 60);
      const { tails } = draw();
      const length = Math.max(0, ...tails);
      expect(length).to.be.at.most(previousLength + 1e-8);
      previousLength = length;
    }
    expect(previousLength).to.equal(0);
  });

  it('does not expire long-running particles immediately when switched off', () => {
    const instance = field().instance;
    instance.setDensity(75);
    instance.setSpeed(0);
    advance(instance, 6);
    instance.setDensity(0);
    const older = particles(instance).filter((p) => p.age > p.lifetime && p.radius > 0.3);
    expect(older.length).to.be.greaterThan(0);
    instance.setSpeed(null);
    instance.step(1 / 60);
    older.forEach((p) => expect(particles(instance)).to.include(p));
  });
  afterEach(() => {
    fields.forEach((instance) => instance.dispose());
    fields.length = 0;
    restore();
  });

  it('uses the density and radial-speed reference values', () => {
    expect(HALO_EDGE).to.equal(FADE_START);
    expect(FADE_START).to.equal(0.72);
    expect(ABSORB_R).to.equal(0.22);
    expect(SPAWN_MIN).to.equal(0.8);
    expect(SPAWN_MAX).to.equal(1);
    for (const value of [null, NaN, -1, 0]) {
      expect(spawnRatePerSecond(value)).to.equal(0);
    }
    for (const value of [null, NaN, -1, 0]) expect(targetPopulation(value)).to.equal(0);
    expect(targetPopulation(7)).to.equal(7);
    expect(targetPopulation(35)).to.equal(24);
    expect(targetPopulation(75)).to.equal(48);
    expect(targetPopulation(200)).to.equal(120);
    expect(targetPopulation(75, 7)).to.equal(7);
    expect(spawnRatePerSecond(5)).to.equal(targetPopulation(5) / 5.5);
    expect(inwardSpeed(null, 0)).to.equal(0);
    expect(inwardSpeed(1, 1)).to.equal(1);
    for (const radius of [0.22, 0.5, 0.9, 1]) {
      expect(inwardSpeed(0.94, radius) / inwardSpeed(0.21, radius)).to.be.at.least(7.5);
    }
    expect(inwardSpeed(1, 0.4)).to.be.greaterThan(inwardSpeed(1, 1));
    expect(inwardSpeed(5, 1)).to.equal(inwardSpeed(1, 1));
    expect(inwardSpeed(-5, 1)).to.equal(inwardSpeed(0, 1));
  });

  it('matches spawning to transit time across fan speeds', () => {
    expect(travelTime(null)).to.equal(5.5);
    let previous = Infinity;
    for (const fraction of [0, 0.1, 0.21, 0.5, 0.94, 1]) {
      expect(travelTime(fraction)).to.be.lessThan(previous);
      previous = travelTime(fraction);
    }
    expect(travelTime(0.941)).to.equal(travelTime(0.94));
    expect(spawnRatePerSecond(35, 0.94) / spawnRatePerSecond(35, 0.21)).to.be.at.least(5);
  });

  it('maintains PM2.5 population at both measured speeds over 20 seconds', () => {
    for (const speed of [0.21, 0.94]) {
      for (const pm25 of [7, 35, 75]) {
        const instance = field().instance;
        instance.setDensity(pm25);
        instance.setSpeed(speed);
        let sum = 0;
        let samples = 0;
        for (let frame = 0; frame < 1200; frame += 1) {
          instance.step(1 / 60);
          if (frame >= 600) {
            sum += instance.count;
            samples += 1;
          }
        }
        const target = targetPopulation(pm25);
        expect(sum / samples).to.be.within(target * 0.65, target * 1.35);
        expect(instance.count).to.be.within(target * 0.65, target * 1.35);
      }
    }
  });

  it('draws velocity streaks only above the inward-speed threshold', () => {
    for (const speed of [0.1, 0.94]) {
      const { instance, canvas } = field();
      const context = canvas.getContext('2d')!;
      const lineTo = spy(context, 'lineTo');
      const stroke = spy(context, 'stroke');
      instance.setDensity(35);
      instance.setSpeed(speed);
      advance(instance, 5);
      expect(lineTo.called).to.equal(speed === 0.94);
      expect(stroke.called).to.equal(speed === 0.94);
    }
  });

  it('produces more particles at higher density and retains fractional births', () => {
    const low = field().instance;
    const high = field().instance;
    low.setDensity(5);
    high.setDensity(50);
    advance(low, 2);
    advance(high, 2);
    expect(low.count).to.equal(2);
    expect(high.count).to.be.greaterThan(low.count);
  });

  it('absorbs identical seeded particles sooner at higher fan speed', () => {
    const lifetime = (speed: number) => {
      const instance = field().instance;
      instance.setDensity(75);
      advance(instance, 1);
      const initial = instance.count;
      instance.setDensity(0);
      instance.setSpeed(speed);
      let particleSeconds = 0;
      for (let i = 0; i < 300; i += 1) {
        particleSeconds += instance.count * 0.05;
        instance.step(0.05);
      }
      expect(instance.count).to.equal(0);
      return particleSeconds / initial;
    };
    expect(lifetime(1)).to.be.lessThan(lifetime(0));
  });

  it('caps particles at the configured pool capacity', () => {
    const instance = field({ maxParticles: 7, random: () => 1 }).instance;
    instance.setDensity(200);
    advance(instance, 6);
    expect(instance.count).to.equal(7);
    advance(instance, 6);
    expect(instance.count).to.be.at.most(7);
  });

  it('keeps off particles outside the halo, then expires them', () => {
    const { instance, canvas } = field();
    const arc = spy(canvas.getContext('2d')!, 'arc');
    instance.setDensity(75);
    advance(instance, 0.5);
    instance.setDensity(0);
    advance(instance, 3);
    expect(instance.count).to.be.greaterThan(0);
    for (const call of arc.getCalls()) {
      const [x, y] = call.args;
      const center = canvas.width / 2;
      expect(Math.hypot(x - center, y - center) / center).to.be.greaterThan(HALO_EDGE);
    }
    advance(instance, 7);
    expect(instance.count).to.equal(0);
  });

  it('spawns in the outer annulus with a 3px inset at either DPR', () => {
    for (const dpr of [1, 2]) {
      for (const random of [0, 1]) {
        const { instance, canvas } = field({ random: () => random, reducedMotion: () => true });
        instance.resize(320, dpr);
        const arc = spy(canvas.getContext('2d')!, 'arc');
        instance.setDensity(5);
        expect(arc.called).to.equal(true);
        for (const call of arc.getCalls()) {
          const [x, y, size] = call.args;
          const center = canvas.width / 2;
          const distance = Math.hypot(x - center, y - center);
          expect(distance / center).to.be.at.least(SPAWN_MIN);
          expect(distance / center).to.be.at.most(SPAWN_MAX);
          expect(distance).to.be.at.most(center - 3 * dpr);
          expect(distance + size).to.be.lessThan(center);
        }
      }
    }
  });

  it('fades smoothly between the fade and absorption radii', () => {
    expect(fadeFactor(0)).to.equal(0);
    expect(fadeFactor(ABSORB_R)).to.equal(0);
    expect(fadeFactor(FADE_START)).to.equal(1);
    expect(fadeFactor(1)).to.equal(1);
    expect(fadeFactor((ABSORB_R + FADE_START) / 2)).to.be.closeTo(0.5, 1e-12);
    let previous = 0;
    for (let radius = ABSORB_R; radius <= FADE_START; radius += 0.01) {
      const factor = fadeFactor(radius);
      expect(factor).to.be.at.least(previous);
      expect(factor).to.be.at.most(1);
      previous = factor;
    }
  });

  it('travels past the old edge and removes particles only at the absorption radius', () => {
    const { instance, canvas } = field();
    const arc = spy(canvas.getContext('2d')!, 'arc');
    const moveTo = spy(canvas.getContext('2d')!, 'moveTo');
    instance.setDensity(75);
    advance(instance, 0.5);
    instance.setDensity(0);
    instance.setSpeed(1);
    advance(instance, 2);
    const center = canvas.width / 2;
    const distances = [...arc.getCalls(), ...moveTo.getCalls().filter((_, i) => i % 3 === 0)].map(
      ({ args: [x, y] }) => Math.hypot(x - center, y - center) / center
    );
    expect(distances.length).to.be.greaterThan(0);
    expect(Math.min(...distances)).to.be.lessThan(FADE_START);
    expect(Math.min(...distances)).to.be.greaterThan(ABSORB_R);
    expect(instance.count).to.equal(0);
  });

  it('retains a single inward particle until it reaches ABSORB_R', () => {
    const { instance, canvas } = field({ random: () => 0 });
    const arc = spy(canvas.getContext('2d')!, 'arc');
    const moveTo = spy(canvas.getContext('2d')!, 'moveTo');
    instance.setDensity(5);
    advance(instance, 1);
    expect(instance.count).to.equal(1);
    instance.setDensity(0);
    instance.setSpeed(1);
    let crossedFade = false;
    let previousRadius = SPAWN_MIN;
    for (let i = 0; i < 300 && instance.count; i += 1) {
      arc.resetHistory();
      moveTo.resetHistory();
      instance.step(0.01);
      if (instance.count) {
        const [x, y] = (arc.lastCall ?? moveTo.firstCall).args;
        const center = canvas.width / 2;
        previousRadius = Math.hypot(x - center, y - center) / center;
        expect(previousRadius).to.be.greaterThan(ABSORB_R);
        crossedFade ||= previousRadius < FADE_START;
      } else {
        expect(previousRadius - inwardSpeed(1, previousRadius) * 0.01).to.be.at.most(ABSORB_R);
      }
    }
    expect(crossedFade).to.equal(true);
    expect(instance.count).to.equal(0);
  });

  it('renders reduced-motion static density without scheduling rAF', () => {
    const { instance, raf } = field({ reducedMotion: () => true });
    instance.setDensity(5);
    expect(instance.count).to.equal(6);
    instance.setColor('#ff0000');
    instance.resize(240, 3);
    instance.step(1);
    expect(instance.count).to.equal(6);
    expect(raf.callCount).to.equal(0);
    instance.setDensity(0);
    expect(instance.count).to.equal(0);
  });

  it('disposes idempotently and ignores subsequent mutations', () => {
    const { instance, raf, caf } = field();
    instance.setDensity(5);
    expect(raf.callCount).to.equal(1);
    instance.dispose();
    instance.dispose();
    instance.setDensity(75);
    instance.step(1);
    expect(caf.callCount).to.equal(1);
    expect(raf.callCount).to.equal(1);
    expect(instance.count).to.equal(0);
  });

  it('refreshes an empty offscreen field into drawn static density', () => {
    let reduced = false;
    const { instance, canvas, raf, caf } = field({ reducedMotion: () => reduced });
    instance.setDensity(5);
    instance.observe(document.createElement('div'));
    expect(instance.count).to.equal(0);
    const fill = spy(canvas.getContext('2d')!, 'fill');
    reduced = true;
    instance.refreshMotion();
    expect(instance.count).to.equal(6);
    expect(fill.callCount).to.equal(6);
    expect(caf.called).to.equal(true);
    expect(raf.callCount).to.equal(1);
    reduced = false;
    instance.refreshMotion();
    expect(raf.callCount).to.equal(1);
    reduced = true;
    const active = field({ reducedMotion: () => reduced });
    active.instance.setDensity(5);
    expect(active.raf.callCount).to.equal(0);
    reduced = false;
    active.instance.refreshMotion();
    expect(active.raf.callCount).to.equal(1);
  });

  it('caches the default motion query across frames and cleans up its listener', () => {
    const addEventListener = spy();
    const removeEventListener = spy();
    const query = { matches: false, addEventListener, removeEventListener };
    const media = stub(window, 'matchMedia').returns(query as unknown as MediaQueryList);
    const { instance, canvas } = field({ reducedMotion: undefined });
    instance.setDensity(75);
    advance(instance, 5);
    expect(media.callCount).to.equal(1);
    expect(addEventListener.callCount).to.equal(1);
    const fill = spy(canvas.getContext('2d')!, 'fill');
    query.matches = true;
    addEventListener.firstCall.args[1]();
    expect(instance.count).to.equal(48);
    expect(fill.callCount).to.equal(48);
    instance.dispose();
    expect(
      removeEventListener.calledOnceWithExactly('change', addEventListener.firstCall.args[1])
    ).to.equal(true);
  });

  it('checks motion once per step rather than per particle', () => {
    const reducedMotion = spy(() => false);
    const { instance } = field({ reducedMotion });
    instance.setDensity(75);
    advance(instance, 2);
    expect(instance.count).to.be.greaterThan(1);
    reducedMotion.resetHistory();
    instance.step(0.05);
    expect(reducedMotion.callCount).to.equal(1);
  });

  it('updates DPR backing dimensions but skips unchanged resize work', () => {
    const { instance, canvas } = field({ reducedMotion: () => true });
    instance.setDensity(5);
    const fill = spy(canvas.getContext('2d')!, 'fill');
    instance.resize(200, 2);
    expect(canvas.width).to.equal(400);
    expect(canvas.height).to.equal(400);
    expect(fill.callCount).to.equal(6);
    instance.resize(200, 2);
    expect(fill.callCount).to.equal(6);
  });

  it('is a no-op when no 2D context is available', () => {
    const canvas = document.createElement('canvas');
    stub(canvas, 'getContext').returns(null);
    const instance = new ParticleField(canvas);
    fields.push(instance);
    expect(() => {
      instance.resize(200);
      instance.setDensity(75);
      instance.setSpeed(1);
      instance.setColor('#ffffff');
      instance.step(0.1);
      instance.dispose();
    }).not.to.throw();
    expect(instance.count).to.equal(0);
  });

  it('pauses on visibility changes, discards hidden time, and clamps stalled frames', () => {
    stub(window, 'IntersectionObserver').value(undefined);
    let hidden = false;
    stub(document, 'hidden').get(() => hidden);
    let time = 0;
    let id = 0;
    const pending = new Map<number, FrameRequestCallback>();
    const { instance } = field({
      now: () => time,
      raf: (cb) => {
        pending.set(++id, cb);
        return id;
      },
      caf: (frame) => {
        pending.delete(frame);
      },
    });
    const tick = (ms: number) => {
      time += ms;
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach((cb) => cb(time));
    };
    instance.observe(document.createElement('div'));
    instance.setDensity(75);
    tick(10000);
    expect(instance.count).to.equal(0);
    hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(pending.size).to.equal(0);
    tick(10000);
    hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    tick(0);
    expect(instance.count).to.equal(0);
    instance.setDensity(0);
    for (let i = 0; i < 150; i += 1) tick(100);
    expect(instance.count).to.equal(0);
    expect(pending.size).to.equal(0);
    instance.dispose();
    document.dispatchEvent(new Event('visibilitychange'));
    expect(pending.size).to.equal(0);
  });
});
