import type { HomeAssistant } from 'custom-card-helpers';

/** A recorded `hass.callService` invocation. */
export interface ServiceCall {
  domain: string;
  service: string;
  data?: Record<string, unknown>;
  target?: unknown;
}

export type FiredEvent = CustomEvent<unknown>;

export interface EntityRegistryEntry {
  entity_id: string;
  device_id?: string;
  platform?: string;
}

export interface TestHass extends HomeAssistant {
  __calls: ServiceCall[];
  entities: Record<string, EntityRegistryEntry>;
}

/** Minimal fake hass; overrides can supply registry entries or replace callWS. */
export function makeHass(
  states: Record<string, any> = {},
  overrides: Partial<Omit<TestHass, 'entities'>> & {
    entities?: Record<string, EntityRegistryEntry>;
  } = {}
): TestHass {
  const calls: ServiceCall[] = [];
  const hass = {
    states,
    config: { unit_system: { temperature: '°C' } },
    themes: {},
    language: 'en',
    localize: (k: string) => k,
    callService: (domain: string, service: string, data?: any, target?: any) => {
      calls.push({ domain, service, data, target });
      return Promise.resolve();
    },
    callWS: async () => ({}),
    entities: {},
    __calls: calls,
  } as unknown as TestHass;
  return Object.assign(hass, overrides) as TestHass;
}

export function fanState(entityId = 'fan.test', state = 'on', attrs: Record<string, any> = {}) {
  return {
    entity_id: entityId,
    state,
    attributes: {
      friendly_name: 'Test Purifier',
      preset_modes: ['Auto', 'Silent', 'Favorite'],
      preset_mode: 'Auto',
      supported_features: 56,
      ...attrs,
    },
  };
}

export function entityState(entity_id: string, state = 'on', attributes: Record<string, any> = {}) {
  return { entity_id, state, attributes: { ...attributes } };
}

export function oncePromise<T = any>(el: EventTarget, type: string): Promise<CustomEvent<T>> {
  return new Promise((resolve) => {
    el.addEventListener(type, (e) => resolve(e as CustomEvent<T>), { once: true });
  });
}

export function captureEvents(type: string): { events: FiredEvent[]; stop: () => void } {
  const events: FiredEvent[] = [];
  const handler = (e: Event): void => {
    events.push(e as FiredEvent);
  };
  document.addEventListener(type, handler);
  return { events, stop: () => document.removeEventListener(type, handler) };
}
