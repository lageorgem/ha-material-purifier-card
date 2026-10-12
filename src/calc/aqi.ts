import type { AqiMetric, UsAqiBreakpoints } from '../types';

export type AqiLevelKey =
  'good' | 'moderate' | 'sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';

export interface AqiLevel {
  index: 0 | 1 | 2 | 3 | 4 | 5;
  key: AqiLevelKey;
  label: string;
  color: string;
}

/** AirNow colors indexed by EPA 2024 PM2.5 concentration (µg/m³). */
export const PM25_COLOR_TABLE: ReadonlyArray<{ max: number; color: string; key: AqiLevelKey }> = [
  { max: 9.0, color: '#00E400', key: 'good' },
  { max: 35.4, color: '#FFFF00', key: 'moderate' },
  { max: 55.4, color: '#FF7E00', key: 'sensitive' },
  { max: 125.4, color: '#FF0000', key: 'unhealthy' },
  { max: 225.4, color: '#8F3F97', key: 'very_unhealthy' },
  { max: Infinity, color: '#7E0023', key: 'hazardous' },
];

/** Color is independent of the displayed AQI scale or EPA revision. */
export function pm25Color(c: number | null): string | null {
  if (c === null || Number.isNaN(c)) return null;
  const concentration = Math.floor(Math.max(0, c) * 10) / 10;
  return PM25_COLOR_TABLE.find(({ max }) => concentration <= max)?.color ?? null;
}

type Breakpoint = readonly [number, number, number, number];
type BreakpointTable = readonly [Breakpoint, ...Breakpoint[]];

const US_BREAKPOINTS: Record<UsAqiBreakpoints, BreakpointTable> = {
  '2024': [
    [0, 9.0, 0, 50],
    [9.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 125.4, 151, 200],
    [125.5, 225.4, 201, 300],
    [225.5, 325.4, 301, 500],
  ],
  '2012': [
    [0, 12.0, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 350.4, 301, 400],
    [350.5, 500.4, 401, 500],
  ],
};

const CN_BREAKPOINTS: BreakpointTable = [
  [0, 35, 0, 50],
  [35, 75, 50, 100],
  [75, 115, 100, 150],
  [115, 150, 150, 200],
  [150, 250, 200, 300],
  [250, 350, 300, 400],
  [350, 500, 400, 500],
];

/** Select the containing segment, or the last one for above-range extrapolation. */
function interpolate(value: number, table: BreakpointTable, inverse = false): number {
  let segment = table[0];
  for (const candidate of table) {
    segment = candidate;
    if (value <= candidate[inverse ? 3 : 1]) break;
  }
  const [cLow, cHigh, iLow, iHigh] = segment;
  if (inverse) {
    return ((cHigh - cLow) / (iHigh - iLow)) * (value - iLow) + cLow;
  }
  return ((iHigh - iLow) / (cHigh - cLow)) * (value - cLow) + iLow;
}

/** EPA PM2.5 AQI: truncate concentration to tenths, then round the index. */
export function pm25ToUsAqi(c: number, rev: UsAqiBreakpoints = '2024'): number {
  const concentration = Math.floor(Math.max(0, c) * 10) / 10;
  return Math.min(999, Math.round(interpolate(concentration, US_BREAKPOINTS[rev])));
}

/** Invert the selected EPA revision without rounding concentration. */
export function usAqiToPm25(aqi: number, rev: UsAqiBreakpoints = '2024'): number {
  return Math.max(0, interpolate(Math.max(0, aqi), US_BREAKPOINTS[rev], true));
}

/** HJ 633-2012 PM2.5 24-hour IAQI: interpolate, then round upward. */
export function pm25ToCnAqi(c: number): number {
  return Math.min(999, Math.ceil(interpolate(Math.max(0, c), CN_BREAKPOINTS)));
}

export function cnAqiToPm25(aqi: number): number {
  return Math.max(0, interpolate(Math.max(0, aqi), CN_BREAKPOINTS, true));
}

export function convertAqi(
  value: number,
  from: AqiMetric,
  to: AqiMetric,
  rev: UsAqiBreakpoints = '2024'
): number {
  if (from === to) return value;
  const concentration =
    from === 'us_aqi' ? usAqiToPm25(value, rev) : from === 'cn_aqi' ? cnAqiToPm25(value) : value;
  if (to === 'us_aqi') return pm25ToUsAqi(concentration, rev);
  if (to === 'cn_aqi') return pm25ToCnAqi(concentration);
  return concentration;
}

const LEVELS = [
  { index: 0, key: 'good', label: 'Good', color: '#00E400' },
  { index: 1, key: 'moderate', label: 'Moderate', color: '#FFFF00' },
  { index: 2, key: 'sensitive', label: 'Unhealthy for sensitive groups', color: '#FF7E00' },
  { index: 3, key: 'unhealthy', label: 'Unhealthy', color: '#FF0000' },
  { index: 4, key: 'very_unhealthy', label: 'Very unhealthy', color: '#8F3F97' },
  { index: 5, key: 'hazardous', label: 'Hazardous', color: '#7E0023' },
] as const;

const CN_LABELS = [
  'Excellent',
  'Good',
  'Lightly polluted',
  'Moderately polluted',
  'Heavily polluted',
  'Severely polluted',
] as const;

export function aqiLevel(
  value: number,
  metric: AqiMetric,
  rev: UsAqiBreakpoints = '2024'
): AqiLevel {
  const aqi = metric === 'pm25' ? pm25ToUsAqi(value, rev) : value;
  const index =
    aqi <= 50 ? 0 : aqi <= 100 ? 1 : aqi <= 150 ? 2 : aqi <= 200 ? 3 : aqi <= 300 ? 4 : 5;
  const level = LEVELS[index];
  // Return a copy so callers cannot mutate subsequent classifications.
  return { ...level, label: metric === 'cn_aqi' ? CN_LABELS[index] : level.label };
}

export function metricLabel(m: AqiMetric): string {
  return m === 'pm25' ? 'µg/m³' : 'AQI';
}

export function nextMetric(m: AqiMetric): AqiMetric {
  return m === 'us_aqi' ? 'cn_aqi' : m === 'cn_aqi' ? 'pm25' : 'us_aqi';
}

export function inferSource(unit?: string, deviceClass?: string): AqiMetric {
  const normalized = (unit ?? '').trim().toLowerCase().replace(/[µμ]/g, 'u').replace(/³/g, '3');
  if (deviceClass === 'pm25' || normalized === 'ug/m3') return 'pm25';
  return normalized === 'aqi' ? 'us_aqi' : 'pm25';
}

export function formatAqi(value: number, metric: AqiMetric): string {
  if (metric !== 'pm25' || value >= 10) return Math.round(value).toString();
  return value.toFixed(1).replace(/\.0$/, '');
}
