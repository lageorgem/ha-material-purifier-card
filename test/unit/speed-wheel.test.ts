import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import { sendKeys, sendMouse } from '@web/test-runner-commands';
import type { MpSpeedWheel } from '../../src/features/speed-wheel';
import '../../src/features/speed-wheel';

describe('mp-speed-wheel', () => {
  let element: MpSpeedWheel;
  let clock: sinon.SinonFakeTimers;

  beforeEach(async () => {
    element = await fixture<MpSpeedWheel>(html`
      <mp-speed-wheel .min=${0} .max=${14} .value=${5}></mp-speed-wheel>
    `);
    clock = sinon.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'performance',
        'requestAnimationFrame',
        'cancelAnimationFrame',
      ],
    });
  });

  afterEach(() => {
    element.remove();
    clock.restore();
    sinon.restore();
  });

  function key(key: string): void {
    element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  }

  it('fades both ends to the supplied color on light and dark surfaces', () => {
    const drum = element.shadowRoot!.querySelector<HTMLElement>('.drum')!;
    drum.style.transition = 'none';
    for (const surface of ['#eeeeee', '#343438']) {
      element.style.setProperty('--mp-surface-container-highest', surface);
      element.style.setProperty('--mp-wheel-fade', '#c8bba4');
      const gradient = getComputedStyle(drum).backgroundImage;
      expect(gradient).to.match(/^linear-gradient\(rgb\(200, 187, 164\),/);
      expect(gradient).to.match(/rgb\(200, 187, 164\)\)$/);
      expect(drum.hasAttribute('light')).to.equal(false);
    }
  });

  it('uses the inherited surface fallback without a wheel property update', () => {
    const parent = element.parentElement!;
    const originalStyle = parent.getAttribute('style');
    try {
      const drum = element.shadowRoot!.querySelector<HTMLElement>('.drum')!;
      drum.style.transition = 'none';
      for (const [surface, color] of [
        ['#f2eadc', 'rgb(242, 234, 220)'],
        ['#202020', 'rgb(32, 32, 32)'],
      ]) {
        parent.style.setProperty('--md-sys-color-surface-container-high', surface);
        const gradient = getComputedStyle(drum).backgroundImage;
        expect(gradient.startsWith(`linear-gradient(${color},`)).to.equal(true);
        expect(gradient.endsWith(`${color})`)).to.equal(true);
      }
    } finally {
      if (originalStyle === null) parent.removeAttribute('style');
      else parent.setAttribute('style', originalStyle);
    }
  });

  it('creates no theme MutationObserver or color-scheme subscription when connected', async () => {
    const observer = sinon.spy(window, 'MutationObserver');
    const media = sinon.spy(window, 'matchMedia');
    element.remove();
    document.body.append(element);
    await element.updateComplete;
    expect(observer.called).to.equal(false);
    expect(media.called).to.equal(false);
  });

  function wheel(deltaY: number, deltaMode = 1): WheelEvent {
    const event = new WheelEvent('wheel', { deltaY, deltaMode, cancelable: true });
    element.dispatchEvent(event);
    return event;
  }

  function values(name: string, reflect = name === 'value-changed'): number[] {
    const result: number[] = [];
    element.addEventListener(name, (event) => {
      const custom = event as CustomEvent<{ value: number }>;
      expect(custom.bubbles).to.equal(true);
      expect(custom.composed).to.equal(true);
      result.push(custom.detail.value);
      if (reflect) element.value = custom.detail.value;
    });
    return result;
  }

  it('steps with keys, commits immediately, and exposes slider semantics', () => {
    const changing = values('value-changing');
    const changed = values('value-changed');
    key('ArrowUp');
    expect(changing).to.deep.equal([6]);
    expect(changed).to.deep.equal([6]);
    expect(element.getAttribute('aria-valuenow')).to.equal('6');
    key('Home');
    key('End');
    expect(changed).to.deep.equal([6, 0, 14]);
    expect(element.getAttribute('role')).to.equal('slider');
    expect(element.getAttribute('aria-orientation')).to.equal('vertical');
    expect(element.getAttribute('aria-label')).to.equal('Fan speed');
  });

  it('handles direction aliases and page-size steps', () => {
    const changed = values('value-changed');
    key('ArrowRight');
    key('ArrowLeft');
    key('ArrowDown');
    key('PageUp');
    key('PageDown');
    expect(changed).to.deep.equal([6, 5, 4, 6, 4]);
  });

  it('settles wheel input after 300 ms without trapping page scroll at an end', () => {
    const changing = values('value-changing');
    const changed = values('value-changed');
    expect(wheel(-100).defaultPrevented).to.equal(true);
    expect(changing).to.deep.equal([6]);
    clock.tick(299);
    expect(changed).to.deep.equal([]);
    clock.tick(1);
    expect(changed).to.deep.equal([6]);
    key('End');
    expect(wheel(-100).defaultPrevented).to.equal(false);
  });

  it('commits an upward two-detent drag after a slow release', () => {
    const changed = values('value-changed');
    const capture = sinon.stub(element, 'setPointerCapture');
    element.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerId: 1,
        button: 0,
        clientY: 100,
      })
    );
    expect(capture.calledWith(1)).to.equal(true);
    clock.tick(500);
    element.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientY: 56 }));
    clock.tick(500);
    element.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientY: 56 }));
    clock.tick(10000);
    expect(changed).to.deep.equal([7]);
    expect(element.getAttribute('aria-valuenow')).to.equal('7');
  });

  it('accepts idle external values and ignores keyboard/wheel input when disabled', async () => {
    element.value = 9;
    element.valueText = 'Nine speeds';
    await element.updateComplete;
    expect(element.getAttribute('aria-valuenow')).to.equal('9');
    expect(element.getAttribute('aria-valuetext')).to.equal('Nine speeds');
    element.disabled = true;
    await element.updateComplete;
    const changed = values('value-changed');
    key('ArrowUp');
    expect(wheel(-100).defaultPrevented).to.equal(false);
    expect(changed).to.deep.equal([]);
    expect(element.tabIndex).to.equal(-1);
  });

  it('reconciles deferred external value at the end of pending wheel settlement', async () => {
    const changed = values('value-changed', false);
    const committedDisplay: (string | null)[] = [];
    element.addEventListener('value-changed', () => {
      committedDisplay.push(element.getAttribute('aria-valuenow'));
    });
    wheel(-100);
    element.value = 12;
    await element.updateComplete;
    expect(element.getAttribute('aria-valuenow')).to.equal('6');
    clock.tick(300);
    expect(changed).to.deep.equal([6]);
    expect(committedDisplay).to.deep.equal(['6']);
    expect(element.getAttribute('aria-valuenow')).to.equal('12');
    expect(element.value).to.equal(12);
  });

  it('reconciles the current controlled value after settlement without a parent echo', () => {
    const changed = values('value-changed', false);
    wheel(-100);
    clock.tick(300);
    expect(changed).to.deep.equal([6]);
    expect(element.getAttribute('aria-valuenow')).to.equal('5');
    expect(element.value).to.equal(5);
  });

  it('fires companion-app selection haptics on detent changes only', () => {
    values('value-changed');
    const haptic = sinon.spy();
    window.addEventListener('haptic', haptic);
    try {
      key('ArrowUp');
      expect(haptic.callCount).to.equal(1);
      expect((haptic.firstCall.args[0] as CustomEvent).detail).to.equal('selection');
      key('End');
      key('End');
      expect(haptic.callCount).to.equal(2);
    } finally {
      window.removeEventListener('haptic', haptic);
    }
  });

  it('emits decimal steps without floating-point tails', async () => {
    element.max = 1;
    element.step = 0.1;
    element.value = 0.2;
    await element.updateComplete;
    const changed = values('value-changed');
    key('ArrowUp');
    expect(changed).to.deep.equal([0.3]);
    expect(element.getAttribute('aria-valuenow')).to.equal('0.3');
  });

  it('cancels pending settlement when disconnected', () => {
    const changed = values('value-changed');
    wheel(-100);
    element.remove();
    clock.tick(1000);
    expect(changed).to.deep.equal([]);
  });

  it('snaps a reduced-motion flick to the current detent without velocity projection', () => {
    sinon.stub(window, 'matchMedia').returns({ matches: true } as MediaQueryList);
    sinon.stub(element, 'setPointerCapture');
    const changed = values('value-changed');
    element.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerId: 1,
        button: 0,
        clientY: 100,
      })
    );
    clock.tick(16);
    element.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientY: 56 }));
    element.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientY: 56 }));
    expect(changed).to.deep.equal([7]);
    expect(element.getAttribute('aria-valuenow')).to.equal('7');
    expect(clock.countTimers()).to.equal(0);
  });

  function pointer(type: string, clientY: number): void {
    element.dispatchEvent(new PointerEvent(type, { pointerId: 1, button: 0, clientY }));
  }

  function ridgeGeometry(path: SVGPathElement) {
    const coordinates = path
      .getAttribute('d')!
      .match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)!
      .map(Number);
    const scale = path.transform.baseVal.getItem(1).matrix.d;
    return {
      path,
      y: path.transform.baseVal.getItem(0).matrix.f,
      length: coordinates[4] - coordinates[0],
      // Static stroke-width is projected by scaleY; no per-frame stroke/style writes.
      thickness: Number(path.getAttribute('stroke-width')) * scale,
      curvature: coordinates[3] * scale,
      opacity: Number(path.getAttribute('opacity')),
    };
  }

  it('projects rounded SVG ridges thinner, shorter and more bowed toward both cylinder edges', () => {
    const paths = [...element.shadowRoot!.querySelectorAll<SVGPathElement>('.ridge')];
    expect(paths.length).to.be.greaterThan(0);
    paths.forEach((path) => {
      expect(path).to.be.instanceOf(SVGPathElement);
      expect(getComputedStyle(path).strokeLinecap).to.equal('round');
    });
    const visible = paths.map(ridgeGeometry).filter((ridge) => ridge.opacity > 0);
    const center = visible.reduce((a, b) => (Math.abs(a.y) < Math.abs(b.y) ? a : b));
    const top = visible.reduce((a, b) => (a.y < b.y ? a : b));
    const bottom = visible.reduce((a, b) => (a.y > b.y ? a : b));
    expect(center.thickness).to.be.closeTo(3, 0.001);
    expect(center.curvature).to.be.closeTo(0, 0.001);
    for (const edge of [top, bottom]) {
      expect(edge.thickness).to.be.at.least(0.6 - 0.0001);
      expect(edge.thickness).to.be.lessThan(center.thickness);
      expect(edge.length).to.be.lessThan(center.length);
      expect(Math.abs(edge.curvature)).to.be.greaterThan(Math.abs(center.curvature));
      expect(edge.opacity).to.be.lessThan(center.opacity);
      expect(edge.opacity).to.be.at.least(0.2);
    }
    expect(top.curvature).to.be.lessThan(0);
    expect(bottom.curvature).to.be.greaterThan(0);
    const radius = Math.max(60, element.getBoundingClientRect().height / 2);
    for (const ridge of visible) {
      const angle = Math.asin(ridge.y / radius);
      const cosine = Math.cos(angle);
      expect(ridge.length).to.be.closeTo(center.length * (0.55 + 0.45 * cosine), 0.001);
      expect(ridge.thickness).to.be.closeTo(Math.max(0.6, 3 * cosine), 0.001);
      expect(ridge.curvature / 2).to.be.closeTo((0.35 * Math.sin(angle) * ridge.length) / 2, 0.001);
    }
  });

  it('reuses the same SVG ridge pool across drag and animation frames without Lit updates', () => {
    sinon.stub(element, 'setPointerCapture');
    const update = sinon.spy(element, 'requestUpdate');
    const paths = [...element.shadowRoot!.querySelectorAll<SVGPathElement>('.ridge')];
    const initial = paths.map((path) => path.getAttribute('d'));
    pointer('pointerdown', 100);
    clock.tick(16);
    pointer('pointermove', 87);
    expect(paths.map((path) => path.getAttribute('d'))).not.to.deep.equal(initial);
    pointer('pointerup', 87);
    for (let i = 0; i < 30; i++) {
      clock.tick(16);
      const current = [...element.shadowRoot!.querySelectorAll('.ridge')];
      expect(current.length).to.equal(paths.length);
      current.forEach((path, index) => expect(path).to.equal(paths[index]));
    }
    expect(update.called).to.equal(false);
  });

  for (const height of [136, 200]) {
    it(`contains a stationary 4px dot and every SVG descendant at ${height}px`, async () => {
      element.style.height = `${height}px`;
      // ResizeObserver uses real rendering frames, not the interaction clock.
      clock.restore();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );
      const paths = [...element.shadowRoot!.querySelectorAll<SVGPathElement>('.ridge')];
      const center = paths
        .map(ridgeGeometry)
        .filter((ridge) => ridge.opacity > 0)
        .reduce((a, b) => (Math.abs(a.y) < Math.abs(b.y) ? a : b));
      const notch = element.shadowRoot!.querySelector<SVGCircleElement>('.notch')!;
      const drum = element.shadowRoot!.querySelector<HTMLElement>('.drum')!;
      const capsuleBounds = drum.getBoundingClientRect();
      const markerBounds = notch.getBoundingClientRect();
      const ridgeBounds = center.path.getBoundingClientRect();
      const matrix = center.path.getScreenCTM()!;
      const capRadius = (Number(center.path.getAttribute('stroke-width')) * Math.abs(matrix.a)) / 2;
      expect(notch).to.be.instanceOf(SVGCircleElement);
      expect(notch.getAttribute('r')).to.equal('2');
      expect(markerBounds.width).to.be.closeTo(4, 0.001);
      expect(markerBounds.height).to.be.closeTo(4, 0.001);
      expect(markerBounds.top + markerBounds.height / 2).to.be.closeTo(
        ridgeBounds.top + ridgeBounds.height / 2,
        0.5
      );
      // Path bounds exclude stroke; measure the gap from the visible round cap.
      expect(markerBounds.left - (ridgeBounds.right + capRadius)).to.be.at.least(3 - 0.001);
      expect(capsuleBounds.right - markerBounds.right).to.be.at.least(3 - 0.001);
      expect(getComputedStyle(drum).overflow).to.equal('hidden');
      const assertContained = () => {
        const bounds = drum.getBoundingClientRect();
        for (const child of element.shadowRoot!.querySelectorAll<SVGGraphicsElement>(
          'svg, svg *'
        )) {
          const box = child.getBoundingClientRect();
          expect(box.left, child.tagName).to.be.at.least(bounds.left - 0.001);
          expect(box.right, child.tagName).to.be.at.most(bounds.right + 0.001);
          expect(box.top, child.tagName).to.be.at.least(bounds.top - 0.001);
          expect(box.bottom, child.tagName).to.be.at.most(bounds.bottom + 0.001);
        }
      };
      assertContained();
      const geometry = ['cx', 'cy', 'r'].map((name) => notch.getAttribute(name));
      sinon.stub(element, 'setPointerCapture');
      pointer('pointerdown', 100);
      pointer('pointermove', 87);
      expect(['cx', 'cy', 'r'].map((name) => notch.getAttribute(name))).to.deep.equal(geometry);
      assertContained();
      pointer('pointercancel', 87);
    });
  }

  it('keeps one unshadowed capsule box through idle, hover, keyboard focus, drag and coast', async () => {
    clock.restore();
    element.style.height = '162px';
    element.style.setProperty('--md-sys-color-surface-container-highest', '#343438');
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
    const drum = element.shadowRoot!.querySelector<HTMLElement>('.drum')!;
    const initial = drum.getBoundingClientRect();
    const assertContained = () => {
      const bounds = drum.getBoundingClientRect();
      const style = getComputedStyle(drum);
      expect(style.boxShadow).to.equal('none');
      expect(style.transform).to.equal('none');
      for (const edge of ['left', 'right', 'top', 'bottom'] as const) {
        expect(bounds[edge], edge).to.be.closeTo(initial[edge], 0.5);
      }
      for (const child of drum.querySelectorAll('*')) {
        const box = child.getBoundingClientRect();
        expect(box.left, child.tagName).to.be.at.least(bounds.left - 0.5);
        expect(box.right, child.tagName).to.be.at.most(bounds.right + 0.5);
        expect(box.top, child.tagName).to.be.at.least(bounds.top - 0.5);
        expect(box.bottom, child.tagName).to.be.at.most(bounds.bottom + 0.5);
      }
    };
    assertContained();
    await sendMouse({ type: 'move', position: [initial.left + 28, initial.top + 60] });
    expect(element.matches(':hover')).to.equal(true);
    assertContained();
    const before = document.createElement('button');
    before.style.position = 'fixed';
    element.before(before);
    try {
      before.focus();
      await sendKeys({ press: 'Tab' });
      expect(element.matches(':focus-visible')).to.equal(true);
      expect(getComputedStyle(drum).outlineWidth).to.equal('2px');
      assertContained();
      sinon.stub(element, 'setPointerCapture');
      pointer('pointerdown', 100);
      pointer('pointermove', 87);
      expect(element.hasAttribute('interacting')).to.equal(true);
      assertContained();
      pointer('pointerup', 87);
      expect(element.hasAttribute('interacting')).to.equal(true);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      assertContained();
    } finally {
      before.remove();
    }
  });

  it('accumulates multi-move drag displacement from pointer start', () => {
    sinon.stub(element, 'setPointerCapture');
    const changing = values('value-changing');
    const changed = values('value-changed');
    pointer('pointerdown', 100);
    clock.tick(500);
    pointer('pointermove', 78);
    clock.tick(500);
    pointer('pointermove', 56);
    expect(changing).to.deep.equal([6, 7]);
    clock.tick(500);
    pointer('pointerup', 56);
    clock.tick(10000);
    expect(changed).to.deep.equal([7]);
  });

  it('handles multi-move drag reversal relative to pointer start', () => {
    sinon.stub(element, 'setPointerCapture');
    const changing = values('value-changing');
    const changed = values('value-changed');
    pointer('pointerdown', 100);
    pointer('pointermove', 56);
    pointer('pointermove', 78);
    pointer('pointermove', 122);
    expect(changing).to.deep.equal([7, 6, 4]);
    clock.tick(500);
    pointer('pointerup', 122);
    clock.tick(10000);
    expect(changed).to.deep.equal([4]);
  });

  for (const cancellation of ['pointercancel', 'lostpointercapture']) {
    it(`restores the pre-gesture detent on ${cancellation} without committing`, () => {
      sinon.stub(element, 'setPointerCapture');
      const changing = values('value-changing');
      const changed = values('value-changed');
      pointer('pointerdown', 100);
      clock.tick(16);
      pointer('pointermove', 56);
      pointer(cancellation, 56);
      expect(changing).to.deep.equal([7, 5]);
      expect(element.getAttribute('aria-valuenow')).to.equal('5');
      expect(element.hasAttribute('interacting')).to.equal(false);
      clock.tick(10000);
      expect(changed).to.deep.equal([]);
      expect(clock.countTimers()).to.equal(0);
    });
  }

  it('ignores lostpointercapture triggered by normal pointerup', () => {
    sinon.stub(element, 'setPointerCapture');
    sinon.stub(element, 'hasPointerCapture').returns(true);
    sinon.stub(element, 'releasePointerCapture').callsFake(() => {
      pointer('lostpointercapture', 56);
    });
    const changing = values('value-changing');
    const changed = values('value-changed');
    pointer('pointerdown', 100);
    pointer('pointermove', 56);
    clock.tick(500);
    pointer('pointerup', 56);
    clock.tick(10000);
    expect(changing).to.deep.equal([7]);
    expect(changed).to.deep.equal([7]);
  });

  for (const step of [30, 40]) {
    it(`maps non-divisible ranges with step ${step} to an exact terminal maximum`, async () => {
      element.max = 100;
      element.step = step;
      element.value = 0;
      await element.updateComplete;
      const changed = values('value-changed');
      const displayed = [Number(element.getAttribute('aria-valuenow'))];
      const expected = step === 30 ? [0, 30, 60, 90, 100] : [0, 40, 80, 100];
      for (let i = 1; i < expected.length; i++) {
        key('ArrowUp');
        displayed.push(Number(element.getAttribute('aria-valuenow')));
      }
      expect(displayed).to.deep.equal(expected);
      key('Home');
      key('End');
      expect(changed[changed.length - 1]).to.equal(100);
      expect(element.getAttribute('aria-valuenow')).to.equal('100');
      expect(element.getAttribute('aria-valuemax')).to.equal('100');
      element.value = 0;
      await element.updateComplete;
      element.value = 100;
      await element.updateComplete;
      expect(element.getAttribute('aria-valuenow')).to.equal('100');
    });
  }
});
