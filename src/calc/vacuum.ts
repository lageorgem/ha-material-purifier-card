import type { DustLevel } from '../types';

export const DEFAULT_THRESHOLDS: Readonly<Record<DustLevel, number>> = {
  low: 250000,
  medium: 125000,
  high: 62500,
};

export function resolveDustLevel(
  state: string | undefined | null,
  fallback: DustLevel = 'medium'
): DustLevel {
  switch (state?.trim().toLowerCase()) {
    case 'low':
    case 'light':
      return 'low';
    case 'medium':
    case 'med':
    case 'moderate':
    case 'normal':
      return 'medium';
    case 'high':
    case 'heavy':
      return 'high';
    default:
      return fallback;
  }
}

export function thresholdFor(
  level: DustLevel,
  overrides?: Partial<Record<DustLevel, number>>
): number {
  const override = overrides?.[level];
  return typeof override === 'number' && Number.isFinite(override) && override > 0
    ? override
    : DEFAULT_THRESHOLDS[level];
}

export interface VacuumProgress {
  /** Clamped to 0..1. */
  fraction: number;
  rawFraction: number;
  /** Non-negative volume remaining until the next vacuum. */
  remainingM3: number;
  due: boolean;
}

export function vacuumProgress(volumeM3: number, thresholdM3: number): VacuumProgress {
  const volume = Number.isNaN(volumeM3) ? 0 : Math.max(0, volumeM3);
  const rawFraction = volume / thresholdM3;
  return {
    fraction: Math.min(1, Math.max(0, rawFraction)),
    rawFraction,
    remainingM3: Math.max(0, thresholdM3 - volume),
    due: volume >= thresholdM3,
  };
}

/** Convert the resettable counter's rpm·h since the last vacuum to m³. */
export function volumeFromRuntime(
  rpmh: number | null,
  cadr: number | null,
  maxRpm: number | null
): number | null {
  if (rpmh === null || !Number.isFinite(rpmh)) return null;
  if (
    cadr === null ||
    maxRpm === null ||
    !Number.isFinite(cadr) ||
    !Number.isFinite(maxRpm) ||
    cadr <= 0 ||
    maxRpm <= 0
  )
    return null;
  return (Math.max(0, rpmh) * cadr) / maxRpm;
}

/** Average rpm·h per elapsed hour, including time spent off. */
export function runtimeRatePerHour(
  hourlyChanges: { start: number; change: number }[],
  now: number,
  counter: number | null,
  lastReset: number | null
): number | null {
  if (lastReset !== null && Number.isFinite(lastReset) && Number.isFinite(now)) {
    const hours = (now - lastReset) / 3600000;
    if (hours >= 0.25 && counter !== null && Number.isFinite(counter) && counter >= 0)
      return counter / hours;
  }
  const valid = hourlyChanges.filter(
    ({ start, change }) => Number.isFinite(start) && Number.isFinite(change)
  );
  if (valid.length === 0) return null;
  const first = valid.reduce((start, row) => Math.min(start, row.start), Infinity);
  const last = valid.reduce((start, row) => Math.max(start, row.start), -Infinity);
  const coveredHours = (last + 3600000 - first) / 3600000;
  if (coveredHours < 1) return null;
  return valid.reduce((sum, row) => sum + Math.max(0, row.change), 0) / coveredHours;
}

export function etaDays(remainingM3: number, dailyM3: number | null): number | null {
  if (dailyM3 === null || !Number.isFinite(dailyM3) || dailyM3 <= 0) return null;
  return remainingM3 <= 0 ? 0 : remainingM3 / dailyM3;
}

/** Recorder may be unavailable or contain rows without numeric changes/start times. */
export async function fetchHourlyChanges(
  hass: { callWS: <T>(msg: { type: string; [k: string]: unknown }) => Promise<T> },
  entityId: string,
  days = 14,
  now: Date = new Date()
): Promise<{ start: number; change: number }[]> {
  try {
    const result = await hass.callWS<Record<string, { start?: unknown; change?: unknown }[]>>({
      type: 'recorder/statistics_during_period',
      start_time: new Date(now.getTime() - days * 86400000).toISOString(),
      statistic_ids: [entityId],
      period: 'hour',
      types: ['change'],
    });
    const entries = result?.[entityId];
    if (!Array.isArray(entries)) return [];
    return entries
      .filter(
        (entry): entry is { start: number; change: number } =>
          typeof entry?.start === 'number' &&
          Number.isFinite(entry.start) &&
          typeof entry?.change === 'number' &&
          Number.isFinite(entry.change)
      )
      .map(({ start, change }) => ({ start, change }));
  } catch {
    return [];
  }
}

export function formatEta(days: number | null): string {
  if (days === null) return 'No estimate yet';
  if (days <= 0) return 'Due now';
  if (days < 1) return 'Due today';
  if (days < 1.5) return 'In 1 day';
  if (days < 14) return `In ${Math.round(days)} days`;
  if (days <= 28) return `In ${Math.round(days / 7)} weeks`;
  const months = Math.max(1, Math.round(days / 30.44));
  return months === 1 ? 'In 1 month' : `In ${months} months`;
}
