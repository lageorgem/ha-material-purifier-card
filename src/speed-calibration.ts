import { detentIndex, type SpeedTarget } from './speed';
import type { CalibrationPoint, MaterialPurifierCardConfig } from './types';

export interface CalPoint {
  detent: number;
  rpm: number;
}

export interface RpmCalibration {
  points: CalPoint[];
}

export interface CalibrationSource {
  fanEntity: string;
  speedEntity: string;
  rpmEntity: string;
  speedPreset: string;
  target: SpeedTarget;
}

interface CalibrationOptions {
  force?: boolean;
  days?: number;
  now?: Date;
  // Legacy options retained for callers; sampling uses every run and fresh reading.
  maxSegments?: number;
  settleMs?: number;
  windowMs?: number;
}

interface CalibrationHass {
  callWS: <T>(msg: { type: string; [k: string]: unknown }) => Promise<T>;
}

interface HistoryState {
  s: string | null;
  a?: Record<string, unknown>;
  lu: number;
  lc?: number;
}

type History = Record<string, HistoryState[]>;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function buildCalibration(samples: CalPoint[]): RpmCalibration | null {
  const groups = new Map<number, number[]>();
  for (const { detent, rpm } of samples) {
    if (!Number.isFinite(detent) || detent < 0 || !Number.isFinite(rpm) || rpm <= 0) continue;
    const group = groups.get(detent) ?? [];
    group.push(rpm);
    groups.set(detent, group);
  }
  const points = [...groups]
    .sort(([a], [b]) => a - b)
    .map(([detent, values]) => ({ detent, rpm: median(values) }));
  // Equal weight per detent: long-observed levels must not dominate the curve.
  const pools: { from: number; to: number; sum: number; count: number }[] = [];
  points.forEach((point, index) => {
    pools.push({ from: index, to: index, sum: point.rpm, count: 1 });
    while (pools.length > 1) {
      const right = pools[pools.length - 1];
      const left = pools[pools.length - 2];
      if (left.sum / left.count <= right.sum / right.count) break;
      pools.splice(-2, 2, {
        from: left.from,
        to: right.to,
        sum: left.sum + right.sum,
        count: left.count + right.count,
      });
    }
  });
  for (const pool of pools) {
    for (let i = pool.from; i <= pool.to; i++) points[i].rpm = pool.sum / pool.count;
  }
  const distinct = points.filter(
    (point, index) => index === 0 || point.rpm !== points[index - 1].rpm
  );
  return distinct.length >= 2 ? { points: distinct } : null;
}

export function calibrationFromConfig(
  points: CalibrationPoint[] | undefined,
  target: SpeedTarget
): RpmCalibration | null {
  return buildCalibration(
    (points ?? [])
      .filter(({ value }) => Number.isFinite(value))
      .map(({ value, rpm }) => ({ detent: detentIndex(target, value)!, rpm }))
  );
}

export function rpmAtDetent(cal: RpmCalibration, detent: number): number | null {
  if (!Number.isFinite(detent) || cal.points.length < 2) return null;
  const points = cal.points;
  let index = 0;
  while (index < points.length - 2 && detent > points[index + 1].detent) index++;
  const left = points[index];
  const right = points[index + 1];
  if (right.detent <= left.detent) return null;
  const rpm =
    left.rpm + ((detent - left.detent) / (right.detent - left.detent)) * (right.rpm - left.rpm);
  return Number.isFinite(rpm) ? Math.max(0, rpm) : null;
}

export function maxRpmOf(cal: RpmCalibration | null): number | null {
  if (!cal || cal.points.length === 0) return null;
  const point = cal.points.reduce((highest, current) =>
    current.detent > highest.detent ? current : highest
  );
  return Number.isFinite(point.rpm) && point.rpm > 0 ? point.rpm : null;
}

export function resolveMaxRpm(card: MaterialPurifierCardConfig): number | null {
  if (card.max_rpm !== undefined && Number.isFinite(card.max_rpm) && card.max_rpm > 0) {
    return card.max_rpm;
  }
  let max = 0;
  for (const { rpm } of card.calibration ?? []) {
    if (Number.isFinite(rpm) && rpm > max) max = rpm;
  }
  return max > 0 ? max : null;
}

export function airflowAt(card: MaterialPurifierCardConfig, rpm: number | null): number | null {
  const maxRpm = resolveMaxRpm(card);
  const cadr = card.cadr;
  if (
    rpm === null ||
    !Number.isFinite(rpm) ||
    maxRpm === null ||
    cadr === undefined ||
    !Number.isFinite(cadr) ||
    cadr <= 0
  )
    return null;
  return cadr * Math.max(0, Math.min(1, rpm / maxRpm));
}

export function detentFromRpm(cal: RpmCalibration, rpm: number, maxDetent: number): number | null {
  if (
    !Number.isFinite(rpm) ||
    rpm <= 0 ||
    !Number.isFinite(maxDetent) ||
    maxDetent < 0 ||
    cal.points.length < 2
  ) {
    return null;
  }
  const points = cal.points;
  let index = 0;
  while (index < points.length - 2 && rpm > points[index + 1].rpm) index++;
  const left = points[index];
  const right = points[index + 1];
  if (right.rpm <= left.rpm) return null;
  const detent =
    left.detent + ((rpm - left.rpm) / (right.rpm - left.rpm)) * (right.detent - left.detent);
  return Math.max(0, Math.min(maxDetent, detent));
}

function numeric(state: string | null | undefined): number | null {
  if (typeof state !== 'string' || state.trim() === '') return null;
  const value = parseFloat(state);
  return Number.isFinite(value) ? value : null;
}

export async function fetchCalibration(
  hass: CalibrationHass,
  src: CalibrationSource,
  opts: CalibrationOptions = {}
): Promise<RpmCalibration | null> {
  const end = (opts.now ?? new Date()).getTime();
  const start = end - (opts.days ?? 30) * 86400000;
  const settleMs = opts.settleMs ?? 15000;
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start >= end ||
    !Number.isFinite(settleMs) ||
    settleMs < 0
  ) {
    return null;
  }
  const history = await hass.callWS<History>({
    type: 'history/history_during_period',
    start_time: new Date(start).toISOString(),
    end_time: new Date(end).toISOString(),
    entity_ids: [src.fanEntity, src.speedEntity],
    minimal_response: false,
    no_attributes: false,
    significant_changes_only: false,
  });
  const rpmHistory = await hass.callWS<History>({
    type: 'history/history_during_period',
    start_time: new Date(start).toISOString(),
    end_time: new Date(end).toISOString(),
    entity_ids: [src.rpmEntity],
    minimal_response: true,
    no_attributes: true,
    significant_changes_only: false,
  });
  const events = [
    ...(history[src.fanEntity] ?? []).map((state) => ({ state, fan: true })),
    ...(history[src.speedEntity] ?? []).map((state) => ({ state, fan: false })),
  ]
    .filter(({ state }) => Number.isFinite(state.lu) && state.lu * 1000 <= end)
    .sort((a, b) => a.state.lu - b.state.lu);
  let fanState: string | null | undefined;
  let attributes: Record<string, unknown> = {};
  let speed: number | null = null;
  let active: { start: number; value: number } | null = null;
  const segments: { start: number; end: number; value: number }[] = [];
  for (let i = 0; i < events.length;) {
    const time = events[i].state.lu * 1000;
    // Apply all simultaneous updates before determining the new steady state.
    do {
      const event = events[i++];
      if (event.fan) {
        fanState = event.state.s;
        if (event.state.a !== undefined) attributes = event.state.a;
      } else {
        speed = numeric(event.state.s);
      }
    } while (i < events.length && events[i].state.lu * 1000 === time);
    const eligible =
      fanState === 'on' &&
      typeof attributes.preset_mode === 'string' &&
      attributes.preset_mode.toLowerCase() === src.speedPreset.toLowerCase();
    const value = eligible ? speed : null;
    if (active && value !== active.value) {
      segments.push({ ...active, end: Math.max(start, time) });
      active = null;
    }
    if (value !== null && !active) active = { start: Math.max(start, time), value };
  }
  if (active) segments.push({ ...active, end });
  const states = (rpmHistory[src.rpmEntity] ?? [])
    .filter((state) => Number.isFinite(state.lu))
    .sort((a, b) => a.lu - b.lu);
  const points: CalPoint[] = [];
  const runs = new Map<number, number>();
  let stateIndex = 0;
  for (const segment of segments) {
    const trimmedStart = segment.start + settleMs;
    const detent = detentIndex(src.target, segment.value);
    if (detent === null) continue;
    runs.set(detent, (runs.get(detent) ?? 0) + 1);
    // Only fresh readings after spin-up; never carry a pre-run value forward.
    while (stateIndex < states.length && states[stateIndex].lu * 1000 < trimmedStart) stateIndex++;
    while (stateIndex < states.length && states[stateIndex].lu * 1000 <= segment.end) {
      const rpm = numeric(states[stateIndex++].s);
      if (rpm !== null && rpm > 0) points.push({ detent, rpm });
    }
  }
  const counts = new Map<number, number>();
  for (const point of points) counts.set(point.detent, (counts.get(point.detent) ?? 0) + 1);
  return buildCalibration(
    points.filter(({ detent }) => counts.get(detent)! >= 2 || runs.get(detent) === 1)
  );
}

interface CacheEntry {
  at: number;
  points: CalPoint[] | null;
}

const prefix = 'material-purifier-card:cal:';
const versionPrefix = `${prefix}v3:`;
const memory = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<RpmCalibration | null>>();
const ttl = 6 * 3600000;
const negativeTtl = 30 * 60000;

function fresh(entry: CacheEntry, now: number): boolean {
  return (
    Number.isFinite(entry.at) &&
    now >= entry.at &&
    now - entry.at < (entry.points === null ? negativeTtl : ttl)
  );
}

function remember(key: string, entry: CacheEntry): void {
  memory.set(key, entry);
  while (memory.size > 16) memory.delete(memory.keys().next().value!);
}

function pruneStorage(now: number): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key?.startsWith(prefix)) continue;
      let keep = false;
      if (key.startsWith(versionPrefix)) {
        try {
          const entry = JSON.parse(localStorage.getItem(key) ?? 'null');
          keep =
            entry !== null &&
            typeof entry === 'object' &&
            (entry.points === null || Array.isArray(entry.points)) &&
            fresh(entry, now);
        } catch {
          // Corrupt entries are disposable, just like expired entries.
        }
      }
      if (!keep) localStorage.removeItem(key);
    }
  } catch {
    // Storage is optional (private browsing, quota limits, corrupt data).
  }
}

export function getCalibration(
  hass: CalibrationHass,
  src: CalibrationSource,
  opts: CalibrationOptions = {}
): Promise<RpmCalibration | null> {
  const now = (opts.now ?? new Date()).getTime();
  pruneStorage(now);
  for (const [storedKey, entry] of memory) {
    if (!fresh(entry, now)) memory.delete(storedKey);
  }
  const key = `${versionPrefix}${JSON.stringify({
    fanEntity: src.fanEntity,
    speedEntity: src.speedEntity,
    rpmEntity: src.rpmEntity,
    speedPreset: src.speedPreset.toLowerCase(),
    kind: src.target.kind,
    min: src.target.min,
    max: src.target.max,
    step: src.target.step,
  })}`;
  const pending = inFlight.get(key);
  if (pending) return pending;
  const task = (async (): Promise<RpmCalibration | null> => {
    let cached = opts.force ? undefined : memory.get(key);
    if (!cached && !opts.force) {
      try {
        const raw: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
        if (
          raw &&
          typeof raw === 'object' &&
          'at' in raw &&
          'points' in raw &&
          typeof raw.at === 'number' &&
          (raw.points === null || Array.isArray(raw.points))
        ) {
          const points = raw.points?.filter(
            (point): point is CalPoint =>
              point !== null &&
              typeof point === 'object' &&
              typeof point.detent === 'number' &&
              typeof point.rpm === 'number'
          );
          const cal = points ? buildCalibration(points) : null;
          if (raw.points === null || cal) cached = { at: raw.at, points: cal?.points ?? null };
        }
      } catch {
        // Storage is optional (private browsing, quota limits, corrupt data).
      }
    }
    if (cached && fresh(cached, now)) {
      remember(key, cached);
      return cached.points === null ? null : { points: cached.points };
    }
    let cal: RpmCalibration | null;
    try {
      cal = await fetchCalibration(hass, src, opts);
    } catch {
      cal = null;
    }
    const entry = { at: now, points: cal?.points ?? null };
    remember(key, entry);
    try {
      localStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // Retain the memory cache even when persistence is unavailable.
    }
    return cal;
  })();
  inFlight.set(key, task);
  void task.finally(() => inFlight.delete(key));
  return task;
}
