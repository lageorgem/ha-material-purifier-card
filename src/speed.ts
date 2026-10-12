import type { HomeAssistant } from 'custom-card-helpers';
import type { HassEntity } from 'home-assistant-js-websocket';
import type { MaterialPurifierCardConfig } from './types';

export interface SpeedSource {
  entity?: string;
  preset?: string | false;
  display?: 'percent' | 'level';
  estimate_auto?: boolean;
  show_coverage?: boolean;
}

export function speedSource(card: MaterialPurifierCardConfig): SpeedSource {
  const feature = card.features?.find((item) => item.type === 'speed-wheel');
  const source: SpeedSource = {};
  for (const key of ['entity', 'preset', 'display', 'estimate_auto', 'show_coverage'] as const) {
    const value = feature?.[key] ?? (key === 'show_coverage' ? undefined : card.speed?.[key]);
    if (value !== undefined) Object.assign(source, { [key]: value });
  }
  return source;
}

export type SpeedKind = 'number' | 'input_number' | 'fan_percentage' | 'none';

export interface SpeedTarget {
  kind: SpeedKind;
  entity: string | null;
  available: boolean;
  min: number;
  max: number;
  step: number;
  value: number | null;
  unit: string;
}

export function coverageRange(airflowM3h: number | null): [number, number] | null {
  if (airflowM3h === null || !Number.isFinite(airflowM3h) || airflowM3h <= 0) return null;
  return [Math.round(0.07 * airflowM3h), Math.round(0.12 * airflowM3h)];
}

export function formatCoverage(r: [number, number] | null): string | null {
  return r === null ? null : `${r[0]}–${r[1]} m²`;
}

export function detentCount(min: number, max: number, step: number): number {
  if (
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    !Number.isFinite(step) ||
    step <= 0 ||
    max < min
  ) {
    return 1;
  }
  const intervals = (max - min) / step;
  const fullIntervals = Math.floor(intervals + 1e-9);
  return fullIntervals + 1 + (intervals - fullIntervals > 1e-9 ? 1 : 0);
}

export function detentIndex(target: SpeedTarget, value: number | null): number | null {
  if (value === null) return null;
  const count = detentCount(target.min, target.max, target.step);
  if (!Number.isFinite(value) || target.step <= 0 || count === 1) return 0;
  // Match the wheel: compare the nearest regular detent with the terminal maximum.
  const regular = Math.max(0, Math.min(count - 2, Math.round((value - target.min) / target.step)));
  const regularValue = target.min + regular * target.step;
  return Math.abs(value - target.max) <= Math.abs(value - regularValue) ? count - 1 : regular;
}

export function speedPercent(target: SpeedTarget, value: number | null): number | null {
  if (value === null) return null;
  if (target.kind === 'fan_percentage') return value;
  const index = detentIndex(target, value);
  if (index === null) return null;
  return Math.round(((index + 1) / detentCount(target.min, target.max, target.step)) * 100);
}

export function resolveSpeedTarget(
  hass: HomeAssistant,
  fanEntity: string,
  cfg?: SpeedSource,
  overrideEntity?: string
): SpeedTarget {
  const entity = overrideEntity ?? cfg?.entity;
  const none: SpeedTarget = {
    kind: 'none',
    entity: entity ?? null,
    available: false,
    min: 0,
    max: 0,
    step: 1,
    value: null,
    unit: '',
  };
  if (entity !== undefined) {
    const domain = entity.split('.')[0];
    const state = hass.states[entity];
    if (!state || (domain !== 'number' && domain !== 'input_number')) return none;
    const parsed = parseFloat(state.state);
    return {
      kind: domain,
      entity,
      available: !['unavailable', 'unknown'].includes(state.state),
      min: state.attributes.min ?? 0,
      max: state.attributes.max ?? 100,
      step: state.attributes.step ?? 1,
      value: Number.isNaN(parsed) ? null : parsed,
      unit: state.attributes.unit_of_measurement ?? '',
    };
  }

  const fan = hass.states[fanEntity];
  if (!fan || !((fan.attributes.supported_features ?? 0) & 1)) return none;
  const step = fan.attributes.percentage_step ?? 1;
  return {
    kind: 'fan_percentage',
    entity: fanEntity,
    available: !['unavailable', 'unknown'].includes(fan.state),
    min: step,
    max: 100,
    step,
    value: fan.state === 'on' ? (fan.attributes.percentage ?? null) : null,
    unit: '%',
  };
}

export function speedPreset(fan: HassEntity | undefined, cfg?: SpeedSource): string | null {
  if (cfg?.preset === false) return null;
  if (typeof cfg?.preset === 'string') return cfg.preset;
  return (
    fan?.attributes.preset_modes?.find((mode: string) => /favou?rite|manual/i.test(mode)) ?? null
  );
}

function decimalPlaces(value: number): number {
  const [mantissa, exponent] = value.toString().split('e');
  return Math.max(0, (mantissa.split('.')[1]?.length ?? 0) - Number(exponent ?? 0));
}

export async function setSpeed(
  hass: HomeAssistant,
  fanEntity: string,
  target: SpeedTarget,
  value: number,
  cfg?: SpeedSource
): Promise<void> {
  if (!target.available || target.kind === 'none') return;

  const clamped = Math.min(target.max, Math.max(target.min, value));
  const rounded = target.min + Math.round((clamped - target.min) / target.step) * target.step;
  // Preserve both the lattice anchor and step, including scientific notation.
  const precision = Math.min(100, Math.max(decimalPlaces(target.min), decimalPlaces(target.step)));
  const epsilon = Number.EPSILON * Math.max(1, Math.abs(target.max)) * 8;
  const normalized =
    value >= target.max - epsilon
      ? target.max
      : Math.min(target.max, Math.max(target.min, Number(rounded.toFixed(precision))));

  const fan = hass.states[fanEntity];
  const preset = speedPreset(fan, cfg);
  if (preset && (fan?.state !== 'on' || fan.attributes.preset_mode !== preset)) {
    await hass.callService('fan', 'set_preset_mode', { entity_id: fanEntity, preset_mode: preset });
  } else if (fan?.state !== 'on' && target.kind !== 'fan_percentage') {
    await hass.callService('fan', 'turn_on', { entity_id: fanEntity });
  }

  if (target.kind === 'fan_percentage') {
    await hass.callService('fan', 'set_percentage', {
      entity_id: fanEntity,
      percentage: normalized,
    });
  } else {
    await hass.callService(target.kind, 'set_value', {
      entity_id: target.entity,
      value: normalized,
    });
  }
}

export function speedFraction(target: SpeedTarget, value?: number | null): number | null {
  const v = value === undefined ? target.value : value;
  if (v === null || target.max <= target.min) return null;
  return Math.min(1, Math.max(0, (v - target.min) / (target.max - target.min)));
}

export function formatSpeed(
  target: SpeedTarget,
  value: number | null,
  display: 'percent' | 'level' = 'percent'
): string {
  if (value === null) return '—';
  if (display === 'percent') return `${speedPercent(target, value)}%`;
  if (target.kind === 'fan_percentage') return `${value}%`;
  return target.unit === '' ? `Level ${value}` : `${value} ${target.unit}`;
}
