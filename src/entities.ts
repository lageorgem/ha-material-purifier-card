import type { HomeAssistant } from 'custom-card-helpers';
import type { AqiConfig, AqiMetric, UsAqiBreakpoints } from './types';
import { aqiLevel, convertAqi, formatAqi, inferSource } from './calc/aqi';
import type { AqiLevel } from './calc/aqi';

export function deviceSiblings(hass: HomeAssistant, entityId: string): string[] {
  const registry = (
    hass as HomeAssistant & {
      entities?: Record<string, { entity_id: string; device_id?: string | null }>;
    }
  ).entities;
  const deviceId = registry?.[entityId]?.device_id;
  if (!registry || !deviceId) return [];
  return Object.values(registry)
    .filter((entry) => entry.entity_id !== entityId && entry.device_id === deviceId)
    .map((entry) => entry.entity_id);
}

export function autoPm25Entity(hass: HomeAssistant, fanEntity: string): string | undefined {
  return deviceSiblings(hass, fanEntity).find((entityId) => {
    if (!entityId.startsWith('sensor.')) return false;
    const attributes = hass.states[entityId]?.attributes;
    if (!attributes) return false;
    const unit = String(attributes.unit_of_measurement ?? '')
      .trim()
      .toLowerCase()
      .replace(/[µμ]/g, 'u')
      .replace(/³/g, '3');
    return attributes.device_class === 'pm25' || unit === 'ug/m3';
  });
}

export function autoRpmEntity(hass: HomeAssistant, fanEntity: string): string | undefined {
  return deviceSiblings(hass, fanEntity).find(
    (entityId) =>
      entityId.startsWith('sensor.') &&
      String(hass.states[entityId]?.attributes.unit_of_measurement ?? '')
        .trim()
        .toLowerCase() === 'rpm'
  );
}

export interface AqiReading {
  value: number | null;
  source: AqiMetric;
  entity: string | null;
}

export function resolveMetric(cfg?: AqiConfig): AqiMetric {
  const scale = cfg?.scale ?? (cfg?.metric === 'cn_aqi' ? 'cn' : 'us');
  if (cfg?.metric === 'pm25') return 'pm25';
  return scale === 'cn' ? 'cn_aqi' : 'us_aqi';
}

export function toggleMetric(current: AqiMetric, cfg?: AqiConfig): AqiMetric {
  if (current !== 'pm25') return 'pm25';
  return resolveMetric({ ...cfg, metric: cfg?.metric === 'pm25' ? 'aqi' : cfg?.metric });
}

export function readAqi(hass: HomeAssistant, fanEntity: string, cfg?: AqiConfig): AqiReading {
  const entity = cfg?.entity ?? autoPm25Entity(hass, fanEntity) ?? null;
  const state = entity === null ? undefined : hass.states[entity];
  const raw = cfg?.attribute ? state?.attributes[cfg.attribute] : state?.state;
  const value = Number.parseFloat(String(raw));
  const source =
    cfg?.source ??
    inferSource(state?.attributes.unit_of_measurement, state?.attributes.device_class);
  return { value: Number.isFinite(value) ? value : null, source, entity };
}

export interface AqiDisplay {
  text: string;
  value: number | null;
  level: AqiLevel | null;
}

export function displayAqi(
  reading: AqiReading,
  metric: AqiMetric,
  rev: UsAqiBreakpoints = '2024'
): AqiDisplay {
  if (reading.value === null || !Number.isFinite(reading.value)) {
    return { text: '—', value: null, level: null };
  }
  const value = convertAqi(reading.value, reading.source, metric, rev);
  return { text: formatAqi(value, metric), value, level: aqiLevel(value, metric, rev) };
}

export function readNumber(hass: HomeAssistant, entityId?: string): number | null {
  const value = Number.parseFloat(
    entityId === undefined ? '' : (hass.states[entityId]?.state ?? '')
  );
  return Number.isFinite(value) ? value : null;
}

export function motorFraction(
  hass: HomeAssistant,
  rpmEntity: string | undefined,
  maxRpm = 2200
): number | null {
  const rpm = readNumber(hass, rpmEntity);
  if (rpm === null || maxRpm <= 0) return null;
  return Math.min(1, Math.max(0, rpm / maxRpm));
}

export function metricStorageKey(fanEntity: string): string {
  return `material-purifier-card:metric:${fanEntity}`;
}

export function loadMetric(fanEntity: string, fallback: AqiMetric): AqiMetric {
  try {
    const metric = localStorage.getItem(metricStorageKey(fanEntity));
    if (metric === 'us_aqi' || metric === 'cn_aqi' || metric === 'pm25') return metric;
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
  return fallback;
}

export function saveMetric(fanEntity: string, metric: AqiMetric): void {
  try {
    localStorage.setItem(metricStorageKey(fanEntity), metric);
  } catch {
    // Persistence is optional; blocked storage must not break the card.
  }
}
