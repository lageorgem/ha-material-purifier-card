import { expect, fixture, html, fixtureCleanup } from '@open-wc/testing';
import sinon from 'sinon';
import type { MpPurifierDial } from '../../src/dial/purifier-dial';
import '../../src/dial/purifier-dial';
import { ParticleField } from '../../src/dial/particles';

describe('mp-purifier-dial', () => {
  beforeEach(() => {
    sinon.stub(window, 'matchMedia').returns({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    } as unknown as MediaQueryList);
  });

  afterEach(() => {
    fixtureCleanup();
    sinon.restore();
  });

  async function dial(): Promise<MpPurifierDial> {
    return fixture<MpPurifierDial>(html`
      <mp-purifier-dial
        .value=${'45'}
        unit="US AQI"
        category="Good"
        status="Auto · 1 848 rpm"
      ></mp-purifier-dial>
    `);
  }

  it('renders the controlled readout and a null placeholder', async () => {
    const element = await dial();
    const text = element.shadowRoot!.textContent!;
    for (const value of ['45', 'US AQI', 'Good', 'Auto · 1 848 rpm']) {
      expect(text).to.contain(value);
    }
    element.value = null;
    await element.updateComplete;
    expect(element.shadowRoot!.querySelector('.value')!.textContent).to.equal('—');
  });

  it('cycles on click, Enter and Space with composed, bubbling empty-detail events', async () => {
    const element = await dial();
    element.allowCycle = true;
    await element.updateComplete;
    const listener = sinon.spy();
    element.addEventListener('metric-cycle', listener);
    const chip = element.shadowRoot!.querySelector<HTMLButtonElement>('button.unit')!;
    expect(chip.hasAttribute('aria-label')).to.equal(false);
    expect(chip.hasAttribute('aria-labelledby')).to.equal(false);
    expect(chip.textContent!.trim()).to.equal('US AQI');
    const description = element.shadowRoot!.getElementById(chip.getAttribute('aria-describedby')!);
    expect(description?.textContent).to.equal('Tap to change air quality metric');
    chip.click();
    for (const key of ['Enter', ' ']) {
      chip.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    }
    expect(listener.callCount).to.equal(3);
    const event = listener.firstCall.args[0] as CustomEvent;
    expect(event.detail).to.deep.equal({});
    expect(event.bubbles).to.equal(true);
    expect(event.composed).to.equal(true);
  });

  it('renders a nonfocusable span and does not cycle when allowCycle is false', async () => {
    const element = await dial();
    expect(element.allowCycle).to.equal(false);
    const listener = sinon.spy();
    element.addEventListener('metric-cycle', listener);
    const chip = element.shadowRoot!.querySelector<HTMLElement>('.unit')!;
    expect(chip.tagName).to.equal('SPAN');
    expect(chip.tabIndex).to.equal(-1);
    chip.click();
    chip.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(listener.called).to.equal(false);
  });

  it('keeps the chip name tied to the visible unit when the metric changes', async () => {
    const element = await dial();
    element.allowCycle = true;
    element.unit = 'PM2.5';
    await element.updateComplete;
    const chip = element.shadowRoot!.querySelector<HTMLButtonElement>('button.unit')!;
    expect(chip.textContent!.trim()).to.equal('PM2.5');
    expect(chip.hasAttribute('aria-label')).to.equal(false);
    expect(chip.hasAttribute('aria-labelledby')).to.equal(false);
  });

  it('keeps the off-state value fully opaque with the neutral text color and tint', async () => {
    const element = await dial();
    const value = element.shadowRoot!.querySelector<HTMLElement>('.value')!;
    const neutralColor = getComputedStyle(element).getPropertyValue('--mp-on-surface-variant');
    const reference = document.createElement('span');
    reference.style.color = neutralColor;
    element.shadowRoot!.append(reference);
    expect(getComputedStyle(value).opacity).to.equal('1');
    expect(getComputedStyle(value).color).to.equal(getComputedStyle(reference).color);
    expect(
      element
        .shadowRoot!.querySelector<HTMLElement>('.dial')!
        .style.getPropertyValue('--mp-aqi-color')
    ).to.equal('var(--mp-outline)');
  });

  it('connects, runs and reconnects without matchMedia', async () => {
    (window.matchMedia as sinon.SinonStub).restore();
    sinon.stub(window, 'matchMedia').value(undefined);
    const element = await dial();
    element.running = true;
    await element.updateComplete;
    const parent = element.parentElement!;
    element.remove();
    parent.append(element);
    await element.updateComplete;
    expect(element.shadowRoot!.querySelector('.dial')!.classList.contains('active')).to.equal(true);
  });

  it('handles legacy motion listeners and removes the same listener on disconnect', async () => {
    const addListener = sinon.spy();
    const removeListener = sinon.spy();
    const query = { matches: false, addListener, removeListener };
    (window.matchMedia as sinon.SinonStub)
      .withArgs('(prefers-reduced-motion: reduce)')
      .returns(query as unknown as MediaQueryList);
    const element = await dial();
    expect(addListener.callCount).to.equal(1);
    element.running = true;
    await element.updateComplete;
    query.matches = true;
    addListener.firstCall.args[0]();
    element.remove();
    expect(removeListener.calledOnceWithExactly(addListener.firstCall.args[0])).to.equal(true);
  });

  it('cleans up modern motion listeners symmetrically', async () => {
    const addEventListener = sinon.spy();
    const removeEventListener = sinon.spy();
    (window.matchMedia as sinon.SinonStub).withArgs('(prefers-reduced-motion: reduce)').returns({
      matches: false,
      addEventListener,
      removeEventListener,
    } as unknown as MediaQueryList);
    const element = await dial();
    element.remove();
    expect(addEventListener.callCount).to.equal(1);
    expect(
      removeEventListener.calledOnceWithExactly('change', addEventListener.firstCall.args[1])
    ).to.equal(true);
  });

  it('emits controlled power toggles and exposes both power states', async () => {
    const element = await dial();
    const listener = sinon.spy();
    element.addEventListener('power-toggle', listener);
    const power = element.shadowRoot!.querySelector<HTMLButtonElement>('.power')!;
    expect(power.getAttribute('aria-label')).to.equal('Turn on');
    expect(power.getAttribute('aria-pressed')).to.equal('false');
    power.click();
    expect(element.running).to.equal(false);
    element.running = true;
    await element.updateComplete;
    expect(power.getAttribute('aria-label')).to.equal('Turn off');
    expect(power.getAttribute('aria-pressed')).to.equal('true');
    power.click();
    expect(listener.callCount).to.equal(2);
    const event = listener.firstCall.args[0] as CustomEvent;
    expect(event.detail).to.deep.equal({});
    expect(event.bubbles && event.composed).to.equal(true);
    element.disabled = true;
    await element.updateComplete;
    expect(power.disabled).to.equal(true);
    power.click();
    expect(listener.callCount).to.equal(2);
  });

  it('draws static pollution when motion is reduced before the first birth', async () => {
    const addEventListener = sinon.spy();
    const query = { matches: false, addEventListener, removeEventListener() {} };
    (window.matchMedia as sinon.SinonStub)
      .withArgs('(prefers-reduced-motion: reduce)')
      .returns(query as unknown as MediaQueryList);
    sinon.stub(window, 'requestAnimationFrame').returns(1);
    const element = await dial();
    element.density = 5;
    await element.updateComplete;
    const canvas = element.shadowRoot!.querySelector('canvas')!;
    const fill = sinon.spy(canvas.getContext('2d')!, 'fill');
    const refresh = sinon.spy(ParticleField.prototype, 'refreshMotion');
    query.matches = true;
    addEventListener.firstCall.args[1]();
    expect(refresh.callCount).to.equal(1);
    expect(fill.callCount).to.equal(6);
  });

  it('resizes on DPR changes, re-arms the query and removes it on disconnect', async () => {
    let dpr = 1;
    sinon.stub(window, 'devicePixelRatio').get(() => dpr);
    const first = {
      matches: true,
      addEventListener: sinon.spy(),
      removeEventListener: sinon.spy(),
    };
    const second = {
      matches: true,
      addEventListener: sinon.spy(),
      removeEventListener: sinon.spy(),
    };
    const media = window.matchMedia as sinon.SinonStub;
    media.withArgs('(resolution: 1dppx)').returns(first as unknown as MediaQueryList);
    media.withArgs('(resolution: 2dppx)').returns(second as unknown as MediaQueryList);
    const element = await dial();
    const canvas = element.shadowRoot!.querySelector('canvas')!;
    const size = Number.parseFloat(canvas.style.width);
    const resize = sinon.spy(ParticleField.prototype, 'resize');
    dpr = 2;
    first.addEventListener.firstCall.args[1]();
    expect(resize.calledOnceWithExactly(size)).to.equal(true);
    expect(canvas.width).to.equal(Math.round(size * 2));
    expect(canvas.height).to.equal(Math.round(size * 2));
    expect(
      first.removeEventListener.calledOnceWithExactly(
        'change',
        first.addEventListener.firstCall.args[1]
      )
    ).to.equal(true);
    expect(second.addEventListener.callCount).to.equal(1);
    element.remove();
    expect(
      second.removeEventListener.calledOnceWithExactly(
        'change',
        second.addEventListener.firstCall.args[1]
      )
    ).to.equal(true);
  });

  it('uses null speed and neutral color when unavailable, with Unavailable status', async () => {
    const speed = sinon.spy(ParticleField.prototype, 'setSpeed');
    const density = sinon.spy(ParticleField.prototype, 'setDensity');
    const element = await dial();
    element.running = true;
    element.available = false;
    await element.updateComplete;
    expect(speed.lastCall.args[0]).to.equal(null);
    expect(density.lastCall.args[0]).to.equal(null);
    expect(element.shadowRoot!.querySelector('.status')!.textContent!.trim()).to.equal(
      'Unavailable'
    );
    expect(
      element
        .shadowRoot!.querySelector<HTMLElement>('.dial')!
        .style.getPropertyValue('--mp-aqi-color')
    ).to.equal('var(--mp-outline)');
  });

  it('uses the running fallback speed and forwards explicit speeds', async () => {
    const speed = sinon.spy(ParticleField.prototype, 'setSpeed');
    const element = await dial();
    element.running = true;
    await element.updateComplete;
    expect(speed.lastCall.args[0]).to.equal(0.35);
    element.speedFraction = 0.8;
    await element.updateComplete;
    expect(speed.lastCall.args[0]).to.equal(0.8);
    element.running = false;
    await element.updateComplete;
    expect(speed.lastCall.args[0]).to.equal(null);
  });

  it('retains the same field and canvas dimensions across power toggles', async () => {
    sinon.stub(window, 'ResizeObserver').value(undefined);
    const element = await dial();
    const resize = sinon.spy(ParticleField.prototype, 'resize');
    const dispose = sinon.spy(ParticleField.prototype, 'dispose');
    const observe = sinon.spy(ParticleField.prototype, 'observe');
    const speed = sinon.spy(ParticleField.prototype, 'setSpeed');
    for (const running of [true, false, true]) {
      element.running = running;
      await element.updateComplete;
      expect(speed.lastCall.args[0]).to.equal(running ? 0.35 : null);
    }
    expect(speed.getCalls().every((call) => call.thisValue === speed.firstCall.thisValue)).to.equal(
      true
    );
    expect(resize.called).to.equal(false);
    expect(dispose.called).to.equal(false);
    expect(observe.called).to.equal(false);
  });

  it('renders only a translucent gradient halo and a noninteractive canvas', async () => {
    const element = await dial();
    const halo = element.shadowRoot!.querySelector('.halo')!;
    expect(halo).to.be.instanceOf(SVGCircleElement);
    expect(halo.getAttribute('r')).to.equal('134');
    expect(element.shadowRoot!.querySelector('.inner')).to.equal(null);
    expect(element.shadowRoot!.querySelectorAll('circle').length).to.equal(1);
    const stops = [...element.shadowRoot!.querySelectorAll('stop')];
    expect(stops.length).to.be.at.least(4);
    const opacities = stops.map((stop) => Number(stop.getAttribute('stop-opacity')));
    expect(Math.max(...opacities)).to.be.at.most(0.32);
    expect(opacities.at(-1)).to.equal(0);
    opacities.forEach((opacity, index) => {
      if (index) expect(opacity).to.be.at.most(opacities[index - 1]);
    });
    const canvas = element.shadowRoot!.querySelector('canvas')!;
    expect(canvas).to.be.instanceOf(HTMLCanvasElement);
    expect(getComputedStyle(canvas).pointerEvents).to.equal('none');
  });

  it('exposes an optional controlled mode button with its icon, name and event', async () => {
    const element = await dial();
    expect(element.modeAvailable).to.equal(false);
    expect(element.modeIcon).to.equal('mdi:fan-auto');
    expect(element.shadowRoot!.querySelector('.mode')).to.equal(null);
    element.modeAvailable = true;
    element.modeIcon = 'mdi:weather-night';
    element.modeLabel = 'Mode: Sleep. Change mode';
    await element.updateComplete;
    const mode = element.shadowRoot!.querySelector<HTMLButtonElement>('.mode')!;
    expect(mode.getAttribute('aria-label')).to.equal(element.modeLabel);
    expect(mode.querySelector('ha-icon')!.getAttribute('icon')).to.equal(element.modeIcon);
    const listener = sinon.spy();
    element.addEventListener('mode-cycle', listener);
    mode.click();
    expect(listener.callCount).to.equal(1);
    const event = listener.firstCall.args[0] as CustomEvent;
    expect(event.detail).to.deep.equal({});
    expect(event.bubbles && event.composed).to.equal(true);
    for (const prop of ['available', 'disabled'] as const) {
      element.available = prop !== 'available';
      element.disabled = prop === 'disabled';
      await element.updateComplete;
      expect(mode.disabled).to.equal(true);
      mode.click();
    }
    expect(listener.callCount).to.equal(1);
  });

  for (const size of [200, 260, 320]) {
    it(`uses equal readout stack gaps at ${size}px`, async () => {
      const element = await dial();
      element.style.width = `${size}px`;
      element.status = 'Auto · 456 rpm';
      await element.updateComplete;
      const root = element.shadowRoot!;
      const valueElement = root.querySelector<HTMLElement>('.value')!;
      const value = valueElement.getBoundingClientRect();
      const category = root.querySelector('.category')!.getBoundingClientRect();
      const chip = root.querySelector('.unit')!.getBoundingClientRect();
      const status = root.querySelector('.status')!.getBoundingClientRect();
      const valueChipGap = chip.top - value.bottom;
      const chipStatusGap = status.top - chip.bottom;
      expect(Number.parseFloat(getComputedStyle(valueElement).lineHeight)).to.be.closeTo(
        Number.parseFloat(getComputedStyle(valueElement).fontSize),
        0.1
      );
      expect(valueChipGap).to.be.closeTo(Math.min(8, Math.max(4, size * 0.025)), 0.1);
      expect(chipStatusGap).to.be.closeTo(valueChipGap, 1);
      expect(value.top - category.bottom).to.be.closeTo(valueChipGap, 1);
      element.allowCycle = true;
      await element.updateComplete;
      const buttonChip = root.querySelector('.unit')!.getBoundingClientRect();
      expect(buttonChip.top - value.bottom).to.be.closeTo(valueChipGap, 1);
      expect(
        root.querySelector('.status')!.getBoundingClientRect().top - buttonChip.bottom
      ).to.be.closeTo(valueChipGap, 1);
    });

    it(`centers the value and separates corner controls at ${size}px`, async () => {
      const element = await dial();
      element.style.width = `${size}px`;
      element.modeAvailable = true;
      await element.updateComplete;
      const root = element.shadowRoot!;
      const bounds = root.querySelector('.dial')!.getBoundingClientRect();
      const cx = bounds.x + bounds.width / 2;
      const cy = bounds.y + bounds.height / 2;
      const value = root.querySelector('.value')!.getBoundingClientRect();
      expect(value.y + value.height / 2).to.be.closeTo(cy, 2);
      expect(value.x + value.width / 2).to.be.closeTo(cx, 2);
      for (const selector of ['.power', '.mode']) {
        const button = root.querySelector(selector)!.getBoundingClientRect();
        const x = button.x + button.width / 2;
        const y = button.y + button.height / 2;
        expect(y).to.be.greaterThan(cy);
        expect(selector === '.power' ? x < cx : x > cx).to.equal(true);
        expect(Math.hypot(x - cx, y - cy) - button.width / 2).to.be.at.least(size * 0.42 - 0.5);
        expect(button.width).to.be.closeTo(size === 320 ? 48 : 40, 0.1);
        expect(button.height).to.be.closeTo(button.width, 0.1);
        expect(button.bottom).to.be.closeTo(bounds.bottom, 0.1);
        expect(selector === '.power' ? button.left : button.right).to.be.closeTo(
          selector === '.power' ? bounds.left : bounds.right,
          0.1
        );
        for (const text of ['.value', '.unit', '.status']) {
          const box = root.querySelector(text)!.getBoundingClientRect();
          expect(
            button.right <= box.left ||
              button.left >= box.right ||
              button.bottom <= box.top ||
              button.top >= box.bottom
          ).to.equal(true);
        }
      }
      element.status = '';
      await element.updateComplete;
      expect(
        root.querySelector('.value')!.getBoundingClientRect().y + value.height / 2
      ).to.be.closeTo(cy, 2);
    });
  }

  it('forwards pollution density even while off', async () => {
    const density = sinon.spy(ParticleField.prototype, 'setDensity');
    const element = await dial();
    element.density = 75;
    await element.updateComplete;
    expect(density.lastCall.args[0]).to.equal(75);
  });

  it('resolves CSS variable colors before forwarding them and after the crossfade', async () => {
    const color = sinon.spy(ParticleField.prototype, 'setColor');
    const element = await dial();
    element.style.setProperty('--test-aqi', '#123456');
    element.color = 'var(--test-aqi)';
    element.running = true;
    await element.updateComplete;
    expect(color.lastCall.args[0]).not.to.contain('var(');
    await new Promise((resolve) => setTimeout(resolve, 650));
    expect(color.lastCall.args[0]).to.equal('rgb(18, 52, 86)');
  });

  it('disposes on disconnect and recreates the field on reconnect', async () => {
    const dispose = sinon.spy(ParticleField.prototype, 'dispose');
    const observe = sinon.spy(ParticleField.prototype, 'observe');
    const element = await dial();
    const parent = element.parentElement!;
    element.remove();
    expect(dispose.callCount).to.equal(1);
    parent.append(element);
    await element.updateComplete;
    expect(observe.callCount).to.equal(2);
    element.remove();
    expect(dispose.callCount).to.equal(2);
  });
});
