import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { createVacuumHelpers } from '../../src/setup-helpers';
import { entityState, makeHass } from '../helpers';

describe('createVacuumHelpers', () => {
  const runtimeEntity = 'sensor.purifier_motor_runtime';
  const counterEntity = 'sensor.purifier_runtime_since_vacuum';
  let api: sinon.SinonStub;
  let ws: sinon.SinonStub;
  let service: sinon.SinonStub;

  beforeEach(() => {
    api = sinon.stub();
    api.onCall(0).resolves({ type: 'form', flow_id: 'flow-1' });
    api.onCall(1).resolves({ type: 'create_entry', result: { entry_id: 'entry-1' } });
    api.onCall(2).resolves({ type: 'form', flow_id: 'flow-2' });
    api.onCall(3).resolves({ type: 'create_entry', result: { entry_id: 'entry-2' } });
    ws = sinon.stub();
    ws.onCall(0).resolves([{ entity_id: runtimeEntity, config_entry_id: 'entry-1' }]);
    ws.onCall(1).resolves([{ entity_id: counterEntity, config_entry_id: 'entry-2' }]);
    service = sinon.stub().resolves();
  });

  afterEach(() => sinon.restore());

  function hass(state = '123.45') {
    return makeHass(
      { [runtimeEntity]: entityState(runtimeEntity, state) },
      {
        callApi: api,
        callWS: ws,
        callService: service,
      }
    );
  }

  async function failure(promise: Promise<unknown>): Promise<Error> {
    try {
      await promise;
    } catch (error) {
      return error as Error;
    }
    throw new Error('Expected setup to reject');
  }

  it('creates both helpers in order with exact payloads and resets the counter', async () => {
    expect(
      await createVacuumHelpers(hass(), { rpmEntity: 'sensor.rpm', name: 'Purifier' })
    ).to.deep.equal({
      runtimeEntity,
      counterEntity,
    });
    expect(api.args).to.deep.equal([
      ['POST', 'config/config_entries/flow', { handler: 'integration' }],
      [
        'POST',
        'config/config_entries/flow/flow-1',
        {
          name: 'Purifier motor runtime',
          source: 'sensor.rpm',
          unit_time: 'h',
          method: 'left',
          round: 2,
          max_sub_interval: { hours: 0, minutes: 5, seconds: 0 },
        },
      ],
      ['POST', 'config/config_entries/flow', { handler: 'utility_meter' }],
      [
        'POST',
        'config/config_entries/flow/flow-2',
        {
          name: 'Purifier runtime since vacuum',
          source: runtimeEntity,
          cycle: 'none',
          offset: 0,
          tariffs: [],
          net_consumption: false,
          delta_values: false,
          periodically_resetting: false,
          always_available: true,
        },
      ],
    ]);
    expect(ws.args).to.deep.equal([
      [{ type: 'config/entity_registry/list' }],
      [{ type: 'config/entity_registry/list' }],
    ]);
    expect(service.args).to.deep.equal([
      [
        'utility_meter',
        'reset',
        {
          entity_id: counterEntity,
        },
      ],
    ]);
    expect(api.getCall(0).calledBefore(api.getCall(1))).to.equal(true);
    expect(api.getCall(1).calledBefore(ws.getCall(0))).to.equal(true);
    expect(ws.getCall(0).calledBefore(api.getCall(2))).to.equal(true);
    expect(api.getCall(2).calledBefore(api.getCall(3))).to.equal(true);
    expect(api.getCall(3).calledBefore(ws.getCall(1))).to.equal(true);
    expect(ws.getCall(1).calledBefore(service.getCall(0))).to.equal(true);
  });

  it('resets the counter even when the runtime state is unknown', async () => {
    await createVacuumHelpers(hass('unknown'), { rpmEntity: 'sensor.rpm', name: 'Purifier' });
    expect(service.firstCall.args).to.deep.equal([
      'utility_meter',
      'reset',
      { entity_id: counterEntity },
    ]);
  });

  it('retries when the registry lags', async () => {
    const clock = sinon.useFakeTimers();
    ws.resetBehavior();
    ws.onCall(0).resolves([]);
    ws.onCall(1).resolves([{ entity_id: runtimeEntity, config_entry_id: 'entry-1' }]);
    ws.onCall(2).resolves([]);
    ws.onCall(3).resolves([
      { entity_id: 'sensor.unrelated', config_entry_id: 'other' },
      { entity_id: 'switch.wrong_domain', config_entry_id: 'entry-2' },
      { entity_id: counterEntity, config_entry_id: 'entry-2' },
    ]);
    const result = createVacuumHelpers(hass(), { rpmEntity: 'sensor.rpm', name: 'Purifier' });
    await clock.tickAsync(299);
    expect(ws.callCount).to.equal(1);
    await clock.tickAsync(1);
    expect(ws.callCount).to.equal(3);
    expect(service.called).to.equal(false);
    await clock.tickAsync(300);
    expect(await result).to.deep.equal({ runtimeEntity, counterEntity });
    expect(ws.callCount).to.equal(4);
  });

  it('aborts a flow with form errors and reports their keys', async () => {
    api.onCall(1).resolves({ type: 'form', errors: { source: 'invalid_source', base: 'failed' } });
    api.onCall(2).resolves();
    const error = await failure(
      createVacuumHelpers(hass(), { rpmEntity: 'sensor.rpm', name: 'Purifier' })
    );
    expect(error.message).to.include('source').and.include('base');
    expect(api.thirdCall.args).to.deep.equal(['DELETE', 'config/config_entries/flow/flow-1']);
    expect(ws.called).to.equal(false);
  });

  it('explains administrator requirements for HTTP 403', async () => {
    api.onCall(0).rejects({ status: 403 });
    const error = await failure(
      createVacuumHelpers(hass(), { rpmEntity: 'sensor.rpm', name: 'Purifier' })
    );
    expect(error.message).to.equal('Setting up tracking needs an administrator account');
  });

  it('names the created sensor when utility meter creation fails without deleting it', async () => {
    api.onCall(2).rejects(new Error('meter failed'));
    const error = await failure(
      createVacuumHelpers(hass(), { rpmEntity: 'sensor.rpm', name: 'Purifier' })
    );
    expect(error.message).to.include(runtimeEntity).and.include('meter failed');
    expect(api.callCount).to.equal(3);
    expect(service.called).to.equal(false);
  });

  it('aborts utility meter form errors even if abort fails', async () => {
    api.onCall(3).resolves({ type: 'form', errors: { source: 'invalid_source', base: 'failed' } });
    api.onCall(4).rejects(new Error('abort failed'));
    const error = await failure(
      createVacuumHelpers(hass(), { rpmEntity: 'sensor.rpm', name: 'Purifier' })
    );
    expect(error.message)
      .to.include(runtimeEntity)
      .and.include('source: invalid_source')
      .and.include('base: failed');
    expect(api.getCall(4).args).to.deep.equal(['DELETE', 'config/config_entries/flow/flow-2']);
    expect(service.called).to.equal(false);
  });

  it('reports both preserved sensors when reset is forbidden', async () => {
    service.rejects({ status: 401 });
    const error = await failure(
      createVacuumHelpers(hass(), { rpmEntity: 'sensor.rpm', name: 'Purifier' })
    );
    expect(error.message)
      .to.include('Setting up tracking needs an administrator account')
      .and.include(runtimeEntity)
      .and.include(counterEntity);
    expect(api.callCount).to.equal(4);
  });

  for (const step of [0, 2]) {
    it(`rejects a missing flow id at step ${step}`, async () => {
      api.onCall(step).resolves({ type: 'form' });
      const error = await failure(
        createVacuumHelpers(hass(), { rpmEntity: 'sensor.rpm', name: 'Purifier' })
      );
      expect(error.message).to.include('did not return a flow id');
      if (step === 2) expect(error.message).to.include(runtimeEntity);
      expect(service.called).to.equal(false);
    });
    it(`rejects a missing created entry at step ${step}`, async () => {
      api.onCall(step + 1).resolves({ type: 'abort' });
      const error = await failure(
        createVacuumHelpers(hass(), { rpmEntity: 'sensor.rpm', name: 'Purifier' })
      );
      expect(error.message).to.include('did not create an entry');
      if (step === 2) expect(error.message).to.include(runtimeEntity);
      expect(service.called).to.equal(false);
    });
  }

  for (const meter of [false, true]) {
    it(`bounds registry retries for the ${meter ? 'utility meter' : 'integration'}`, async () => {
      const clock = sinon.useFakeTimers();
      ws.resetBehavior();
      ws.resolves([]);
      if (meter) ws.onCall(0).resolves([{ entity_id: runtimeEntity, config_entry_id: 'entry-1' }]);
      const result = failure(
        createVacuumHelpers(hass(), { rpmEntity: 'sensor.rpm', name: 'Purifier' })
      );
      await clock.tickAsync(2700);
      const error = await result;
      expect(error.message).to.include('not yet in the entity registry');
      expect(error.message).to.include(meter ? runtimeEntity : 'integration entry entry-1');
      expect(ws.callCount).to.equal(meter ? 11 : 10);
      expect(service.called).to.equal(false);
    });
  }
});
