import { fixture, html, expect } from '@open-wc/testing';
import { oncePromise } from '../helpers';
import '../../src/features/selector-row';
import type { MpSelectorRow } from '../../src/features/selector-row';
import type { SelectorItem } from '../../src/types';

const items: SelectorItem[] = [
  { value: 'a', label: 'Alpha', icon: 'mdi:a', active: true },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma', icon: 'mdi:c', disabled: true },
];

describe('mp-selector-row', () => {
  it('renders nothing for empty items', async () => {
    const el = await fixture<MpSelectorRow>(html`<mp-selector-row></mp-selector-row>`);
    expect(el.shadowRoot!.querySelector('.chips')).to.equal(null);
    expect(el.shadowRoot!.querySelector('mp-dropdown')).to.equal(null);
  });

  it('renders chips with icons/text, active and disabled states and accessible labels', async () => {
    const el = await fixture<MpSelectorRow>(
      html`<mp-selector-row .items=${items} label="Mode"></mp-selector-row>`
    );
    const chips = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.chip');
    expect(chips.length).to.equal(3);
    expect(chips[0].querySelector('ha-icon')!.getAttribute('icon')).to.equal('mdi:a');
    expect(chips[1].querySelector('.chip-text')!.textContent).to.equal('Beta');
    expect(chips[1].querySelector('ha-icon')).to.equal(null);
    expect(chips[0].classList.contains('active')).to.be.true;
    expect(chips[1].classList.contains('active')).to.be.false;
    expect(chips[0].getAttribute('aria-pressed')).to.equal('true');
    expect(chips[1].getAttribute('aria-pressed')).to.equal('false');
    expect(chips[2].disabled).to.be.true;
    expect(chips[0].disabled).to.be.false;
    expect(chips[0].getAttribute('aria-label')).to.equal('Alpha');
    expect(el.shadowRoot!.querySelector('.title')!.textContent).to.equal('Mode');
    expect(el.shadowRoot!.querySelector('.chips')!.getAttribute('aria-label')).to.equal('Mode');
    const event = oncePromise(el, 'item-selected');
    chips[1].click();
    const selected = await event;
    expect(selected.detail).to.deep.equal({ value: 'b' });
    expect(selected.bubbles).to.be.true;
    expect(selected.composed).to.be.true;
    let fired = false;
    el.addEventListener('item-selected', () => (fired = true));
    chips[2].click();
    expect(fired).to.be.false;
  });

  it('omits the title and uses options as the default group label', async () => {
    const el = await fixture<MpSelectorRow>(
      html`<mp-selector-row .items=${items}></mp-selector-row>`
    );
    expect(el.shadowRoot!.querySelector('.title')).to.equal(null);
    expect(el.shadowRoot!.querySelector('.chips')!.getAttribute('aria-label')).to.equal('options');
  });

  for (const display of ['dropdown', 'tile'] as const) {
    it(`passes items/label and re-emits selection in ${display} mode`, async () => {
      const el = await fixture<MpSelectorRow>(
        html`<mp-selector-row
          .items=${items}
          display=${display}
          label="Pick one"
          .forceOff=${true}
        ></mp-selector-row>`
      );
      const dd = el.shadowRoot!.querySelector('mp-dropdown')!;
      expect(dd.items).to.deep.equal(items);
      expect(el.shadowRoot!.querySelector('.chips')).to.equal(null);
      if (display === 'tile') {
        expect(dd.variant).to.equal('tile');
        expect(dd.label).to.equal('Pick one');
        expect(dd.forceOff).to.be.true;
        expect(el.shadowRoot!.querySelector('.title')).to.equal(null);
      } else {
        expect(dd.placeholder).to.equal('Pick one');
      }
      const event = oncePromise(el, 'item-selected');
      dd.dispatchEvent(new CustomEvent('item-selected', { detail: { value: 'b' } }));
      const selected = await event;
      expect(selected.detail).to.deep.equal({ value: 'b' });
      expect(selected.bubbles).to.be.true;
      expect(selected.composed).to.be.true;
      el.label = undefined;
      await el.updateComplete;
      expect(display === 'tile' ? dd.label : dd.placeholder).to.equal('');
    });
  }
});
