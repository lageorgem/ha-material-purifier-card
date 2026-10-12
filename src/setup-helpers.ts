import type { HomeAssistant } from 'custom-card-helpers';

export interface VacuumHelpers {
  runtimeEntity: string;
  counterEntity: string;
}

interface FlowResult {
  type: string;
  flow_id?: string;
  errors?: Record<string, string>;
  result?: { entry_id: string };
}

function setupError(error: unknown): Error {
  const details = error as { status?: number; status_code?: number; code?: number | string } | null;
  if (
    [details?.status, details?.status_code, details?.code].some(
      (code) =>
        code === 401 ||
        code === 403 ||
        code === '401' ||
        code === '403' ||
        code === 'unauthorized' ||
        code === 'forbidden'
    )
  ) {
    return new Error('Setting up tracking needs an administrator account');
  }
  return error instanceof Error ? error : new Error(String(error));
}

/** Create HA-owned helpers; preserve partial successes so users can recover them. */
export async function createVacuumHelpers(
  hass: HomeAssistant,
  opts: { rpmEntity: string; name: string }
): Promise<VacuumHelpers> {
  let runtimeEntity: string | undefined;
  let entryId: string | undefined;
  let counterEntity: string | undefined;
  try {
    const flow = await hass.callApi<FlowResult>('POST', 'config/config_entries/flow', {
      handler: 'integration',
    });
    if (!flow.flow_id) throw new Error('Integration setup did not return a flow id');
    const path = `config/config_entries/flow/${flow.flow_id}`;
    const created = await hass.callApi<FlowResult>('POST', path, {
      name: `${opts.name} motor runtime`,
      source: opts.rpmEntity,
      unit_time: 'h',
      method: 'left',
      round: 2,
      max_sub_interval: { hours: 0, minutes: 5, seconds: 0 },
    });
    if (created.type === 'form') {
      // Cleanup failure must not hide the original validation errors.
      try {
        await hass.callApi('DELETE', path);
      } catch {
        /* Best-effort flow abort. */
      }
      throw new Error(
        `Integration setup failed: ${
          Object.entries(created.errors ?? {})
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ') || 'unexpected form'
        }`
      );
    }
    entryId = created.result?.entry_id;
    if (created.type !== 'create_entry' || !entryId) {
      throw new Error('Integration setup did not create an entry');
    }
    for (let attempt = 0; attempt < 10; attempt++) {
      const entries = await hass.callWS<{ entity_id: string; config_entry_id?: string }[]>({
        type: 'config/entity_registry/list',
      });
      runtimeEntity = entries.find(
        (entry) => entry.config_entry_id === entryId && entry.entity_id.startsWith('sensor.')
      )?.entity_id;
      if (runtimeEntity) break;
      if (attempt < 9) await new Promise<void>((resolve) => setTimeout(resolve, 300));
    }
    if (!runtimeEntity)
      throw new Error('Created integration sensor is not yet in the entity registry');
    const meterFlow = await hass.callApi<FlowResult>('POST', 'config/config_entries/flow', {
      handler: 'utility_meter',
    });
    if (!meterFlow.flow_id) throw new Error('Utility Meter setup did not return a flow id');
    const meterPath = `config/config_entries/flow/${meterFlow.flow_id}`;
    const meterCreated = await hass.callApi<FlowResult>('POST', meterPath, {
      name: `${opts.name} runtime since vacuum`,
      source: runtimeEntity,
      cycle: 'none',
      offset: 0,
      tariffs: [],
      net_consumption: false,
      delta_values: false,
      periodically_resetting: false,
      always_available: true,
    });
    if (meterCreated.type === 'form') {
      try {
        await hass.callApi('DELETE', meterPath);
      } catch {
        /* Best-effort flow abort. */
      }
      throw new Error(
        `Utility Meter setup failed: ${
          Object.entries(meterCreated.errors ?? {})
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ') || 'unexpected form'
        }`
      );
    }
    const meterEntryId = meterCreated.result?.entry_id;
    if (meterCreated.type !== 'create_entry' || !meterEntryId) {
      throw new Error('Utility Meter setup did not create an entry');
    }
    for (let attempt = 0; attempt < 10; attempt++) {
      const entries = await hass.callWS<{ entity_id: string; config_entry_id?: string }[]>({
        type: 'config/entity_registry/list',
      });
      counterEntity = entries.find(
        (entry) => entry.config_entry_id === meterEntryId && entry.entity_id.startsWith('sensor.')
      )?.entity_id;
      if (counterEntity) break;
      if (attempt < 9) await new Promise<void>((resolve) => setTimeout(resolve, 300));
    }
    if (!counterEntity)
      throw new Error('Created utility meter sensor is not yet in the entity registry');
    await hass.callService('utility_meter', 'reset', { entity_id: counterEntity });
    return { runtimeEntity, counterEntity };
  } catch (error) {
    const cause = setupError(error);
    const preserved = runtimeEntity ?? (entryId ? `integration entry ${entryId}` : undefined);
    if (preserved) {
      throw new Error(
        `${cause.message}. Already created ${preserved}${
          counterEntity ? ` and ${counterEntity}` : ''
        }; these helpers were not deleted.`
      );
    }
    throw cause;
  }
}
