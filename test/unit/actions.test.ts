import { fixture, html, expect } from '@open-wc/testing';
import sinon from 'sinon';
import type { ActionConfig } from 'custom-card-helpers';
import { pressOrToggle, performTap } from '../../src/actions';
import { makeHass, captureEvents } from '../helpers';

describe('actions', () => {
  let node: HTMLElement;

  beforeEach(async () => {
    node = await fixture(html`<div></div>`);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('pressOrToggle', () => {
    it('button → button.press', () => {
      const hass = makeHass();
      pressOrToggle(node, hass, 'button.x');
      expect(hass.__calls).to.deep.equal([
        { domain: 'button', service: 'press', data: { entity_id: 'button.x' }, target: undefined },
      ]);
    });
    it('input_button → input_button.press', () => {
      const hass = makeHass();
      pressOrToggle(node, hass, 'input_button.x');
      expect(hass.__calls[0]).to.include({ domain: 'input_button', service: 'press' });
      expect(hass.__calls[0].data).to.deep.equal({ entity_id: 'input_button.x' });
    });
    ['scene', 'script'].forEach((domain) => {
      it(`${domain} → ${domain}.turn_on`, () => {
        const hass = makeHass();
        pressOrToggle(node, hass, `${domain}.x`);
        expect(hass.__calls[0]).to.include({ domain, service: 'turn_on' });
      });
    });
    ['switch', 'light', 'fan', 'input_boolean'].forEach((domain) => {
      it(`${domain} → homeassistant.toggle`, () => {
        const hass = makeHass();
        pressOrToggle(node, hass, `${domain}.x`);
        expect(hass.__calls[0]).to.include({ domain: 'homeassistant', service: 'toggle' });
        expect(hass.__calls[0].data).to.deep.equal({ entity_id: `${domain}.x` });
      });
    });
    it('unknown domain → hass-more-info bubbling composed event', () => {
      const hass = makeHass();
      const cap = captureEvents('hass-more-info');
      pressOrToggle(node, hass, 'sensor.x');
      cap.stop();
      expect(hass.__calls).to.have.length(0);
      expect(cap.events).to.have.length(1);
      expect((cap.events[0].detail as { entityId: string }).entityId).to.equal('sensor.x');
      expect(cap.events[0].bubbles).to.equal(true);
      expect(cap.events[0].composed).to.equal(true);
    });
  });

  describe('performTap', () => {
    it('undefined action → default → pressOrToggle', () => {
      const hass = makeHass();
      performTap(node, hass, 'switch.x');
      expect(hass.__calls[0]).to.include({ domain: 'homeassistant', service: 'toggle' });
    });
    it('explicit default action string → pressOrToggle', () => {
      const hass = makeHass();
      performTap(node, hass, 'button.x', { action: 'default' } as unknown as ActionConfig);
      expect(hass.__calls[0]).to.include({ domain: 'button', service: 'press' });
    });
    it("{action:'none'} → no call", () => {
      const hass = makeHass();
      const cap = captureEvents('hass-more-info');
      performTap(node, hass, 'switch.x', { action: 'none' });
      cap.stop();
      expect(hass.__calls).to.have.length(0);
      expect(cap.events).to.have.length(0);
    });
    it("{action:'more-info'} → hass-more-info with entity", () => {
      const hass = makeHass();
      const cap = captureEvents('hass-more-info');
      performTap(node, hass, 'switch.x', { action: 'more-info' });
      cap.stop();
      expect(cap.events).to.have.length(1);
      expect((cap.events[0].detail as { entityId: string }).entityId).to.equal('switch.x');
    });
    it("{action:'more-info'} with cfg.entity override", () => {
      const hass = makeHass();
      const cap = captureEvents('hass-more-info');
      performTap(node, hass, 'switch.x', {
        action: 'more-info',
        entity: 'light.override',
      } as unknown as ActionConfig);
      cap.stop();
      expect((cap.events[0].detail as { entityId: string }).entityId).to.equal('light.override');
    });
    it("{action:'toggle'} → homeassistant.toggle", () => {
      const hass = makeHass();
      performTap(node, hass, 'fan.x', { action: 'toggle' });
      expect(hass.__calls[0]).to.include({ domain: 'homeassistant', service: 'toggle' });
      expect(hass.__calls[0].data).to.deep.equal({ entity_id: 'fan.x' });
    });
    it("{action:'url', url_path} → window.open", () => {
      const hass = makeHass();
      const open = sinon.stub(window, 'open');
      performTap(node, hass, 'switch.x', { action: 'url', url_path: 'https://example.com' });
      expect(open.calledOnceWithExactly('https://example.com')).to.equal(true);
    });
    it("{action:'url'} without url_path → no window.open", () => {
      const open = sinon.stub(window, 'open');
      performTap(node, makeHass(), 'switch.x', { action: 'url' } as ActionConfig);
      expect(open.called).to.equal(false);
    });
    it("{action:'navigate', navigation_path} → pushState + location-changed", () => {
      const push = sinon.stub(window.history, 'pushState');
      const cap = captureEvents('location-changed');
      performTap(node, makeHass(), 'switch.x', {
        action: 'navigate',
        navigation_path: '/lovelace/0',
      });
      cap.stop();
      expect(push.calledOnceWithExactly(null, '', '/lovelace/0')).to.equal(true);
      expect(cap.events).to.have.length(1);
      expect((cap.events[0].detail as { replace: boolean }).replace).to.equal(false);
    });
    it("{action:'navigate'} without navigation_path → no pushState/event", () => {
      const push = sinon.stub(window.history, 'pushState');
      const cap = captureEvents('location-changed');
      performTap(node, makeHass(), 'switch.x', { action: 'navigate' } as ActionConfig);
      cap.stop();
      expect(push.called).to.equal(false);
      expect(cap.events).to.have.length(0);
    });
    it("{action:'call-service', service, data} → callService parsed", () => {
      const hass = makeHass();
      performTap(node, hass, 'switch.x', {
        action: 'call-service',
        service: 'light.turn_on',
        data: { brightness: 50 },
      } as unknown as ActionConfig);
      expect(hass.__calls).to.have.length(1);
      expect(hass.__calls[0]).to.include({ domain: 'light', service: 'turn_on' });
      expect(hass.__calls[0].data).to.deep.equal({ brightness: 50 });
    });
    it("{action:'call-service'} uses service_data fallback when data absent", () => {
      const hass = makeHass();
      performTap(node, hass, 'switch.x', {
        action: 'call-service',
        service: 'light.turn_on',
        service_data: { color_temp: 300 },
      } as unknown as ActionConfig);
      expect(hass.__calls[0].data).to.deep.equal({ color_temp: 300 });
    });
    it("{action:'perform-action', perform_action, target} → callService parsed", () => {
      const hass = makeHass();
      performTap(node, hass, 'switch.x', {
        action: 'perform-action',
        perform_action: 'scene.turn_on',
        target: { entity_id: 'scene.movie' },
      } as unknown as ActionConfig);
      expect(hass.__calls).to.have.length(1);
      expect(hass.__calls[0]).to.include({ domain: 'scene', service: 'turn_on' });
      expect(hass.__calls[0].target).to.deep.equal({ entity_id: 'scene.movie' });
      expect(hass.__calls[0].data).to.deep.equal({});
    });
    it('call-service with no service → no call', () => {
      const hass = makeHass();
      performTap(node, hass, 'switch.x', { action: 'call-service' } as ActionConfig);
      expect(hass.__calls).to.have.length(0);
    });
    it('call-service with service lacking a dot → no call', () => {
      const hass = makeHass();
      performTap(node, hass, 'switch.x', { action: 'call-service', service: 'nodot' });
      expect(hass.__calls).to.have.length(0);
    });
    it('unknown/default action string → pressOrToggle', () => {
      const hass = makeHass();
      performTap(node, hass, 'switch.x', { action: 'totally-unknown' } as unknown as ActionConfig);
      expect(hass.__calls[0]).to.include({ domain: 'homeassistant', service: 'toggle' });
    });
  });
});
