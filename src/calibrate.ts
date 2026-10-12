import type { HomeAssistant } from 'custom-card-helpers';
import { setSpeed, speedPreset, type SpeedSource, type SpeedTarget } from './speed';
import type { CalibrationPoint } from './types';

export interface CalibrationProgress {
  step: number;
  total: number;
  value: number | null;
  rpm: number | null;
  stable?: boolean;
  phase: 'switching' | 'settling' | 'sampling' | 'restoring' | 'done';
}

export function calibrationSteps(target: SpeedTarget, count = 2): number[] {
  const { min, max, step } = target;
  if (target.kind === 'none' || ![min, max, step].every(Number.isFinite) || step <= 0 || max < min)
    return [];
  const intervals = (max - min) / step;
  const last = Math.ceil(intervals - 1e-9);
  const samples = Number.isFinite(count) ? Math.max(2, Math.floor(count)) : 2;
  const values = new Set<number>();
  for (let i = 0; i < Math.min(samples, last + 1); i++) {
    const index = Math.round((i * last) / (Math.min(samples, last + 1) - 1 || 1));
    values.add(index === last ? max : Number((min + index * step).toPrecision(15)));
  }
  return [...values].sort((a, b) => a - b);
}

function numeric(state: string | undefined): number | null {
  if (state === undefined || state.trim() === '') return null;
  const value = Number(state);
  return Number.isFinite(value) ? value : null;
}

function median(readings: number[]): number | null {
  if (!readings.length) return null;
  const sorted = [...readings].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export async function runCalibration(
  getHass: () => HomeAssistant,
  opts: {
    fanEntity: string;
    rpmEntity: string;
    target: SpeedTarget;
    speed?: SpeedSource;
    onProgress?: (p: CalibrationProgress) => void;
    signal?: AbortSignal;
    stepTimeoutMs?: number;
    pollMs?: number;
    sleep?: (ms: number) => Promise<void>;
    now?: () => number;
  }
): Promise<CalibrationPoint[]> {
  const { fanEntity, rpmEntity, target, signal } = opts;
  const hass = getHass();
  if (numeric(hass.states[rpmEntity]?.state) === null)
    throw new Error('RPM entity must have a numeric state');
  if (target.kind === 'none' || !target.available || !target.entity)
    throw new Error('Speed target is unavailable');
  const fan = hass.states[fanEntity];
  if (!fan || !['on', 'off'].includes(fan.state)) throw new Error('Fan is unavailable');
  const steps = calibrationSteps(target);
  if (steps.length < 2) throw new Error('Speed target needs at least two levels');
  const wasOff = fan.state === 'off';
  const previousPreset: unknown = fan.attributes.preset_mode;
  const previousValue =
    target.kind === 'fan_percentage'
      ? typeof fan.attributes.percentage === 'number'
        ? fan.attributes.percentage
        : target.value
      : target.value;
  if (
    (previousValue === null || !Number.isFinite(previousValue)) &&
    !(wasOff && target.kind === 'fan_percentage')
  ) {
    throw new Error('Previous speed value is unavailable');
  }
  const pollMs = opts.pollMs ?? 500;
  const timeout = opts.stepTimeoutMs ?? 90000;
  if (!Number.isFinite(pollMs) || pollMs <= 0 || !Number.isFinite(timeout) || timeout <= 0) {
    throw new Error('Polling interval and step timeout must be positive');
  }
  const sleep = opts.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  // Use the sensor timestamps' wall-clock domain for the post-switch freshness gate.
  const now = opts.now ?? (() => Date.now());
  const checkAbort = (): void => {
    if (signal?.aborted) {
      const error = new Error('Calibration aborted');
      error.name = 'AbortError';
      throw error;
    }
  };
  let step = 0;
  let value: number | null = null;
  let rpm: number | null = null;
  let stable: boolean | undefined;
  const progress = (phase: CalibrationProgress['phase']): void => {
    opts.onProgress?.({ step, total: steps.length, value, rpm, phase, stable });
  };
  const points: CalibrationPoint[] = [];
  let presetMayHaveChanged = false;
  const reading = () => {
    const state = getHass().states[rpmEntity];
    const reported = (state as (typeof state & { last_reported?: string }) | undefined)
      ?.last_reported;
    return {
      rpm: numeric(state?.state),
      timestamp: reported ?? state?.last_updated,
      updated: state?.last_updated,
      reported: reported !== undefined,
    };
  };
  try {
    // Spin up to the highest speed first; interpolate between the two endpoints.
    for (const next of [...steps].reverse()) {
      checkAbort();
      step++;
      value = next;
      rpm = null;
      stable = undefined;
      let previousTimestamp = reading().timestamp;
      progress('switching');
      checkAbort();
      const currentHass = getHass();
      const requestedPreset = speedPreset(currentHass.states[fanEntity], opts.speed);
      // Service completion can precede HA's state update, including on a rejected call.
      if (requestedPreset !== null && requestedPreset !== previousPreset)
        presetMayHaveChanged = true;
      await setSpeed(currentHass, fanEntity, target, next, opts.speed);
      checkAbort();
      const started = now();
      progress('settling');
      while (now() - started < Math.min(2000, timeout)) {
        checkAbort();
        await sleep(Math.min(pollMs, Math.min(2000, timeout) - (now() - started)));
        checkAbort();
      }
      progress('sampling');
      const readings: number[] = [];
      stable = false;
      const gaps: number[] = [];
      let lastFresh: number | undefined;
      let previousReportedRpm: number | null = null;
      let previousPoll: ReturnType<typeof reading> | undefined;
      let unchangedSince = now();
      while (true) {
        checkAbort();
        const current = reading();
        const observed = now();
        if (current.rpm !== previousPoll?.rpm || current.updated !== previousPoll?.updated) {
          unchangedSince = observed;
        }
        previousPoll = current;
        if (current.timestamp !== previousTimestamp) {
          previousTimestamp = current.timestamp;
          const taken = Date.parse(current.timestamp ?? '');
          if (taken > started + 2000 && (lastFresh === undefined || taken > lastFresh)) {
            if (current.rpm !== null) {
              if (lastFresh !== undefined) gaps.push(taken - lastFresh);
              readings.push(current.rpm);
              stable = current.reported && previousReportedRpm === current.rpm;
              previousReportedRpm = current.reported ? current.rpm : null;
              lastFresh = taken;
            } else {
              readings.length = 0;
              gaps.length = 0;
              lastFresh = undefined;
              previousReportedRpm = null;
            }
          }
        }
        // Entity subscriptions may omit unchanged reports even on newer HA. Require
        // actual fresh readings, then a quiet window long enough for two sensor polls.
        stable ||=
          current.rpm !== null &&
          current.updated !== undefined &&
          readings.length >= 2 &&
          readings[readings.length - 1] === current.rpm &&
          observed - unchangedSince >= Math.max(6000, 2 * (median(gaps) ?? 0));
        if (stable || now() - started >= timeout) break;
        await sleep(Math.min(pollMs, timeout - (now() - started)));
      }
      rpm = stable ? (readings[readings.length - 1] ?? null) : median(readings.slice(-3));
      progress('sampling');
      if (rpm !== null) points.push({ value: next, rpm });
    }
    checkAbort();
    if (points.length < 2) throw new Error('Not enough readings');
  } finally {
    // Every restoration action is independent: one failed service must not prevent turn_off/preset.
    const restore = async (action: () => void | Promise<unknown>): Promise<void> => {
      try {
        await action();
      } catch (error) {
        console.warn('Purifier calibration restoration failed', error);
      }
    };
    await restore(() => progress('restoring'));
    if (previousValue !== null && Number.isFinite(previousValue)) {
      await restore(() =>
        target.kind === 'fan_percentage'
          ? getHass().callService('fan', 'set_percentage', {
              entity_id: fanEntity,
              percentage: previousValue,
            })
          : getHass().callService(target.kind, 'set_value', {
              entity_id: target.entity,
              value: previousValue,
            })
      );
    }
    if (wasOff) {
      await restore(() => getHass().callService('fan', 'turn_off', { entity_id: fanEntity }));
    } else if (
      typeof previousPreset === 'string' &&
      (presetMayHaveChanged ||
        getHass().states[fanEntity]?.attributes.preset_mode !== previousPreset)
    ) {
      await restore(() =>
        getHass().callService('fan', 'set_preset_mode', {
          entity_id: fanEntity,
          preset_mode: previousPreset,
        })
      );
    }
  }
  checkAbort();
  progress('done');
  return points.sort((a, b) => a.value - b.value);
}
