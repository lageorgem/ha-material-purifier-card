import { fixture, html, expect } from '@open-wc/testing';
import { oncePromise, captureEvents } from '../helpers';
import '../../src/features/dropdown';
import type { MpDropdown } from '../../src/features/dropdown';
import type { SelectorItem } from '../../src/types';

const items: SelectorItem[] = [
  { value: 'a', label: 'Alpha', icon: 'mdi:a', active: true },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma', icon: 'mdi:c' },
];

function trigger(el: MpDropdown): HTMLButtonElement {
  return el.shadowRoot!.querySelector('.trigger, .tile') as HTMLButtonElement;
}

describe('mp-dropdown', () => {
  it('shows the active item icon and label', async () => {
    const el = await fixture<MpDropdown>(html`<mp-dropdown .items=${items}></mp-dropdown>`);
    expect(el.shadowRoot!.querySelector('.lead')!.getAttribute('icon')).to.equal('mdi:a');
    expect(el.shadowRoot!.querySelector('.label')!.textContent).to.equal('Alpha');
    expect(el.shadowRoot!.querySelector('.chev')).to.not.equal(null);
  });

  it('falls back to the first item, or placeholder and dot for an empty list', async () => {
    const el = await fixture<MpDropdown>(html`<mp-dropdown placeholder="Choose"></mp-dropdown>`);
    expect(el.shadowRoot!.querySelector('.label')!.textContent).to.equal('Choose');
    expect(el.shadowRoot!.querySelector('.dot')).to.not.equal(null);
    el.items = [{ value: 'b', label: 'Beta' }];
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.label')!.textContent).to.equal('Beta');
    expect(el.shadowRoot!.querySelector('.lead')).to.equal(null);
  });

  it('opens and closes; emits the coordination event only when opening', async () => {
    const el = await fixture<MpDropdown>(html`<mp-dropdown .items=${items}></mp-dropdown>`);
    const cap = captureEvents('mt-dropdown-open');
    expect(trigger(el).getAttribute('aria-expanded')).to.equal('false');
    trigger(el).click();
    await el.updateComplete;
    expect(trigger(el).getAttribute('aria-expanded')).to.equal('true');
    expect(cap.events.length).to.equal(1);
    expect(cap.events[0].detail).to.equal(el);
    const opts = el.shadowRoot!.querySelectorAll('.opt');
    expect(opts.length).to.equal(3);
    expect(opts[0].getAttribute('aria-selected')).to.equal('true');
    expect(opts[0].querySelector('.check')).to.not.equal(null);
    expect(opts[1].querySelector('.dot')).to.not.equal(null);
    expect(opts[1].getAttribute('aria-selected')).to.equal('false');
    trigger(el).click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.menu')).to.equal(null);
    expect(cap.events.length).to.equal(1);
    cap.stop();
  });

  it('selects with a non-bubbling item-selected event and closes', async () => {
    const el = await fixture<MpDropdown>(html`<mp-dropdown .items=${items}></mp-dropdown>`);
    trigger(el).click();
    await el.updateComplete;
    const event = oncePromise(el, 'item-selected');
    (el.shadowRoot!.querySelectorAll('.opt')[2] as HTMLButtonElement).click();
    const selected = await event;
    expect(selected.detail).to.deep.equal({ value: 'c' });
    expect(selected.bubbles).to.be.false;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.menu')).to.equal(null);
  });

  it('closes on an outside click or another dropdown opening, not its own event', async () => {
    const el = await fixture<MpDropdown>(html`<mp-dropdown .items=${items}></mp-dropdown>`);
    trigger(el).click();
    await el.updateComplete;
    document.dispatchEvent(new CustomEvent('mt-dropdown-open', { detail: el }));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.menu')).to.not.equal(null);
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.menu')).to.equal(null);
    trigger(el).click();
    await el.updateComplete;
    document.dispatchEvent(new CustomEvent('mt-dropdown-open', { detail: {} }));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.menu')).to.equal(null);
  });

  it('renders the tile title, value, icon and accent; forceOff suppresses on', async () => {
    const el = await fixture<MpDropdown>(
      html`<mp-dropdown
        variant="tile"
        label="Mode"
        .items=${[{ ...items[0], color: '#ff8100' }]}
      ></mp-dropdown>`
    );
    expect(el.shadowRoot!.querySelector('.trigger')).to.equal(null);
    expect(trigger(el).querySelector('.title')!.textContent).to.equal('Mode');
    expect(trigger(el).querySelector('.value')!.textContent).to.equal('Alpha');
    expect(trigger(el).querySelector('ha-icon')!.getAttribute('icon')).to.equal('mdi:a');
    expect(trigger(el).getAttribute('style')).to.contain('--mp-tile-accent: #ff8100');
    expect(trigger(el).classList.contains('on')).to.be.true;
    el.forceOff = true;
    await el.updateComplete;
    expect(trigger(el).classList.contains('on')).to.be.false;
  });

  for (const value of ['off', 'None']) {
    it(`does not mark ${value} as on`, async () => {
      const el = await fixture<MpDropdown>(
        html`<mp-dropdown
          variant="tile"
          .items=${[{ value, label: value, active: true }]}
        ></mp-dropdown>`
      );
      expect(trigger(el).classList.contains('on')).to.be.false;
      expect(trigger(el).querySelector('.title')).to.equal(null);
      expect(trigger(el).querySelector('.dot')).to.not.equal(null);
      expect(trigger(el).getAttribute('style') ?? '').to.not.contain('--mp-tile-accent');
    });
  }

  it('uses the tile placeholder or first item without marking inactive items on', async () => {
    const el = await fixture<MpDropdown>(
      html`<mp-dropdown variant="tile" placeholder="Pick"></mp-dropdown>`
    );
    expect(trigger(el).querySelector('.value')!.textContent).to.equal('Pick');
    el.items = [{ value: 'a', label: 'Alpha' }];
    await el.updateComplete;
    expect(trigger(el).querySelector('.value')!.textContent).to.equal('Alpha');
    expect(trigger(el).classList.contains('on')).to.be.false;
    trigger(el).click();
    await el.updateComplete;
    const event = oncePromise(el, 'item-selected');
    (el.shadowRoot!.querySelector('.opt') as HTMLButtonElement).click();
    expect((await event).detail).to.deep.equal({ value: 'a' });
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.menu')).to.equal(null);
  });

  for (const far of [false, true]) {
    it(`aligns ${far ? 'right/up' : 'left/down'} to the viewport`, async () => {
      const el = await fixture<MpDropdown>(html`<mp-dropdown .items=${items}></mp-dropdown>`);
      el.getBoundingClientRect = () =>
        ({
          left: far ? window.innerWidth * 0.9 : 0,
          bottom: far ? window.innerHeight * 0.9 : 0,
          width: 10,
        }) as DOMRect;
      trigger(el).click();
      await el.updateComplete;
      const menu = el.shadowRoot!.querySelector('.menu')!;
      expect(menu.classList.contains('right')).to.equal(far);
      expect(menu.classList.contains('up')).to.equal(far);
    });
  }
});
