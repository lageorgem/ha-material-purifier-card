import { expect } from '@open-wc/testing';
import { WheelPhysics } from '../../src/features/wheel-physics.js';

describe('WheelPhysics', () => {
  it('drags upward two detents and snaps on a slow release', () => {
    const wheel = new WheelPhysics({ count: 15 });
    wheel.setDetent(3);
    wheel.dragStart(0);
    wheel.dragMove(-44, 200);
    expect(wheel.position).to.equal(5);
    wheel.dragEnd(400);
    expect(wheel.phase).to.equal('snapping');
    expect(wheel.position).to.equal(5);
    expect(wheel.tick(400)).to.equal(false);
    expect(wheel.phase).to.equal('idle');
  });

  it('coasts a fast upward flick to the upper bound without overshooting', () => {
    const wheel = new WheelPhysics({ count: 15 });
    wheel.setDetent(3);
    wheel.dragStart(0);
    wheel.dragMove(-120, 60);
    wheel.dragEnd(60);
    expect(wheel.phase).to.equal('coasting');
    const releasedPosition = wheel.position;
    let previous = releasedPosition;
    for (let time = 76; time <= 4060; time += 16) {
      wheel.tick(time);
      expect(wheel.position).to.be.at.least(previous);
      expect(wheel.position).to.be.at.most(14);
      previous = wheel.position;
    }
    expect(wheel.position - releasedPosition).to.be.greaterThan(2);
    expect(wheel.position).to.equal(14);
    expect(wheel.detent).to.equal(14);
    expect(wheel.phase).to.equal('idle');
    expect(wheel.tick(5000)).to.equal(false);
  });

  it('uses only recent samples, not an old fast movement, for release velocity', () => {
    const wheel = new WheelPhysics({ count: 15 });
    wheel.setDetent(5);
    wheel.dragStart(0);
    wheel.dragMove(-60, 30);
    wheel.dragMove(-61, 200);
    wheel.dragMove(-62, 260);
    wheel.dragEnd(260);
    expect(wheel.phase).to.equal('snapping');
    wheel.tick(2000);
    expect(wheel.position).to.equal(8);
  });

  it('rubber-bands three extra detents and snaps back to zero', () => {
    const wheel = new WheelPhysics({ count: 15, rubberBand: 0.25 });
    wheel.dragStart(0);
    wheel.dragMove(66, 200);
    expect(wheel.position).to.equal(-0.75);
    expect(wheel.position).to.be.greaterThan(-1);
    expect(wheel.detent).to.equal(0);
    wheel.dragEnd(400);
    expect(wheel.phase).to.equal('snapping');
    expect(wheel.tick(520)).to.equal(true);
    wheel.tick(2000);
    expect(wheel.position).to.equal(0);
    expect(wheel.tick(2100)).to.equal(false);
  });

  it('uses the default linear resistance past both ends', () => {
    const wheel = new WheelPhysics({ count: 4 });
    wheel.dragStart(0);
    wheel.dragMove(22, 50);
    expect(wheel.position).to.be.closeTo(-0.35, 0.000001);
    wheel.setDetent(3);
    wheel.dragStart(100);
    wheel.dragMove(-22, 150);
    expect(wheel.position).to.be.closeTo(3.35, 0.000001);
    expect(wheel.detent).to.equal(3);
  });

  it('steps exactly once per line or page event regardless of magnitude', () => {
    const wheel = new WheelPhysics({ count: 15 });
    wheel.setDetent(3);
    expect(wheel.wheel(-3, 1)).to.equal(1);
    expect(wheel.detent).to.equal(4);
    expect(wheel.wheel(20, 2)).to.equal(-1);
    expect(wheel.detent).to.equal(3);
    expect(wheel.wheel(0, 1)).to.equal(0);
    expect(wheel.phase).to.equal('idle');
  });

  it('accumulates pixel deltas and keeps the residual', () => {
    const wheel = new WheelPhysics({ count: 15 });
    expect(wheel.wheel(-25, 0)).to.equal(0);
    expect(wheel.wheel(-25, 0)).to.equal(0);
    expect(wheel.wheel(-25, 0)).to.equal(1);
    expect(wheel.detent).to.equal(1);
    expect(wheel.wheel(-45, 0)).to.equal(1);
    expect(wheel.detent).to.equal(2);
  });

  it('resets the pixel residual when direction flips', () => {
    const wheel = new WheelPhysics({ count: 15 });
    wheel.setDetent(5);
    wheel.wheel(-50, 0);
    expect(wheel.wheel(25, 0)).to.equal(0);
    expect(wheel.wheel(35, 0)).to.equal(-1);
    expect(wheel.detent).to.equal(4);
  });

  it('returns only the wheel delta actually applied at the ends', () => {
    const wheel = new WheelPhysics({ count: 3 });
    expect(wheel.wheel(120, 0)).to.equal(0);
    wheel.setDetent(2);
    expect(wheel.wheel(-3, 1)).to.equal(0);
    expect(wheel.wheel(-120, 0)).to.equal(0);
    expect(wheel.wheel(180, 0)).to.equal(-2);
    expect(wheel.detent).to.equal(0);
  });

  it('clamps keyboard steps, count changes, and direct jumps', () => {
    const wheel = new WheelPhysics({ count: 15 });
    wheel.step(-1);
    expect(wheel.detent).to.equal(0);
    wheel.step(1);
    expect(wheel.detent).to.equal(1);
    wheel.setDetent(100);
    expect(wheel.position).to.equal(14);
    wheel.step(1);
    expect(wheel.detent).to.equal(14);
    wheel.setCount(4);
    expect(wheel.position).to.equal(3);
    wheel.setDetent(1.6);
    expect(wheel.position).to.equal(2);
    wheel.setDetent(-10);
    expect(wheel.position).to.equal(0);
    expect(wheel.phase).to.equal('idle');
  });

  it('does nothing on idle or dragging ticks', () => {
    const wheel = new WheelPhysics({ count: 1 });
    expect(wheel.tick(0)).to.equal(false);
    wheel.dragStart(10);
    wheel.dragMove(-22, 30);
    const position = wheel.position;
    expect(wheel.tick(100)).to.equal(false);
    expect(wheel.position).to.equal(position);
    expect(wheel.phase).to.equal('dragging');
    expect(wheel.detent).to.equal(0);
  });

  it('cancels animation on jumps, steps, count changes, and wheel input', () => {
    for (const interrupt of [
      (wheel: WheelPhysics) => wheel.setDetent(2),
      (wheel: WheelPhysics) => wheel.step(1),
      (wheel: WheelPhysics) => wheel.setCount(3),
      (wheel: WheelPhysics) => wheel.wheel(-60, 0),
    ]) {
      const wheel = new WheelPhysics({ count: 15 });
      wheel.dragStart(0);
      wheel.dragMove(-60, 30);
      wheel.dragEnd(30);
      interrupt(wheel);
      const position = wheel.position;
      expect(wheel.phase).to.equal('idle');
      expect(wheel.tick(2000)).to.equal(false);
      expect(wheel.position).to.equal(position);
    }
  });
});
