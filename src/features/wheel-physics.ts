export interface WheelPhysicsOptions {
  count: number;
  pxPerDetent?: number;
  timeConstantMs?: number;
  minFlickVelocity?: number;
  wheelPxPerDetent?: number;
  rubberBand?: number;
}

export type WheelPhase = 'idle' | 'dragging' | 'coasting' | 'snapping';

interface DragSample {
  time: number;
  dy: number;
}

/** DOM-independent wheel state. All timestamps are monotonic milliseconds. */
export class WheelPhysics {
  private count: number;

  private readonly pxPerDetent: number;

  private readonly timeConstantMs: number;

  private readonly minFlickVelocity: number;

  private readonly wheelPxPerDetent: number;

  private readonly rubberBand: number;

  private positionValue = 0;

  private phaseValue: WheelPhase = 'idle';

  private startPosition = 0;

  private samples: DragSample[] = [];

  private wheelResidual = 0;

  private animationStart = 0;

  private animationPosition = 0;

  private animationTarget = 0;

  private animationTimeConstant = 120;

  constructor(opts: WheelPhysicsOptions) {
    WheelPhysics.validateCount(opts.count);
    this.count = opts.count;
    this.pxPerDetent = opts.pxPerDetent ?? 22;
    this.timeConstantMs = opts.timeConstantMs ?? 325;
    this.minFlickVelocity = opts.minFlickVelocity ?? 0.25;
    this.wheelPxPerDetent = opts.wheelPxPerDetent ?? 60;
    this.rubberBand = opts.rubberBand ?? 0.35;
  }

  get position(): number {
    return this.positionValue;
  }

  get detent(): number {
    return this.clamp(Math.round(this.positionValue));
  }

  get phase(): WheelPhase {
    return this.phaseValue;
  }

  setCount(count: number): void {
    WheelPhysics.validateCount(count);
    this.count = count;
    this.positionValue = this.clamp(this.positionValue);
    this.cancel();
  }

  setDetent(i: number): void {
    this.positionValue = this.clamp(Math.round(i));
    this.cancel();
  }

  dragStart(t: number): void {
    this.tick(t);
    this.startPosition = this.positionValue;
    this.samples = [{ time: t, dy: 0 }];
    this.wheelResidual = 0;
    this.phaseValue = 'dragging';
  }

  dragMove(dyPx: number, t: number): void {
    if (this.phaseValue !== 'dragging') return;
    const rawPosition = this.startPosition - dyPx / this.pxPerDetent;
    const boundedPosition = this.clamp(rawPosition);
    this.positionValue = boundedPosition + (rawPosition - boundedPosition) * this.rubberBand;
    this.recordSample(dyPx, t);
  }

  dragEnd(t: number): void {
    if (this.phaseValue !== 'dragging') return;
    const last = this.samples[this.samples.length - 1];
    // Include the stationary interval before release so a paused drag is not a flick.
    this.recordSample(last.dy, t);
    const first = this.samples[0];
    const elapsed = t - first.time;
    const velocity = elapsed > 0 ? (last.dy - first.dy) / elapsed : 0;
    const flick = Math.abs(velocity) >= this.minFlickVelocity;
    const projected = flick
      ? this.positionValue - (velocity * this.timeConstantMs) / this.pxPerDetent
      : this.clamp(this.positionValue);
    this.animationTarget = this.clamp(Math.round(projected));
    this.animationPosition = this.positionValue;
    this.animationStart = t;
    this.animationTimeConstant = flick ? this.timeConstantMs : 120;
    this.phaseValue = flick ? 'coasting' : 'snapping';
    this.samples = [];
  }

  wheel(deltaY: number, deltaMode: 0 | 1 | 2): number {
    const previous = this.detent;
    let delta = 0;
    if (deltaMode === 0) {
      if (deltaY !== 0 && this.wheelResidual * deltaY < 0) {
        this.wheelResidual = 0;
      }
      this.wheelResidual += deltaY;
      const steps = Math.trunc(this.wheelResidual / this.wheelPxPerDetent);
      this.wheelResidual -= steps * this.wheelPxPerDetent;
      delta = -steps;
    } else {
      this.wheelResidual = 0;
      delta = -Math.sign(deltaY);
    }
    this.positionValue = this.clamp(previous + delta);
    this.phaseValue = 'idle';
    this.samples = [];
    return this.detent - previous;
  }

  step(n: number): void {
    this.setDetent(this.detent + n);
  }

  tick(t: number): boolean {
    if (this.phaseValue !== 'coasting' && this.phaseValue !== 'snapping') {
      return false;
    }
    const elapsed = Math.max(0, t - this.animationStart);
    this.positionValue =
      this.animationTarget -
      (this.animationTarget - this.animationPosition) *
        Math.exp(-elapsed / this.animationTimeConstant);
    if (Math.abs(this.animationTarget - this.positionValue) < 0.01) {
      this.positionValue = this.animationTarget;
      this.phaseValue = 'idle';
      return false;
    }
    return true;
  }

  private recordSample(dy: number, time: number): void {
    this.samples = this.samples.filter((sample) => sample.time >= time - 100);
    const last = this.samples[this.samples.length - 1];
    if (last?.time === time) {
      last.dy = dy;
    } else {
      this.samples.push({ time, dy });
    }
  }

  private clamp(position: number): number {
    return Math.max(0, Math.min(this.count - 1, position));
  }

  private cancel(): void {
    this.phaseValue = 'idle';
    this.samples = [];
    this.wheelResidual = 0;
  }

  private static validateCount(count: number): void {
    if (!Number.isInteger(count) || count < 1) {
      throw new RangeError('Wheel detent count must be a positive integer.');
    }
  }
}
