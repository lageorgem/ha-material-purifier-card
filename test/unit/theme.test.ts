import { expect } from '@open-wc/testing';
import {
  tokens,
  prettyLabel,
  orderValues,
  isOffValue,
  presetIcon,
  presetColor,
} from '../../src/theme';

describe('theme', () => {
  it('exposes purifier token aliases and retains Material/HA fallbacks', () => {
    expect(tokens.cssText).to.contain('--mp-primary: var(--md-sys-color-primary');
    expect(tokens.cssText).to.contain('var(--primary-color, #6750a4)');
    expect(tokens.cssText).to.contain('--mp-surface-container:');
  });

  describe('presetIcon', () => {
    const cases: [string, string][] = [
      ['auto', 'mdi:fan-auto'],
      ['Automatic', 'mdi:fan-auto'],
      ['silent', 'mdi:weather-night'],
      ['sleep', 'mdi:weather-night'],
      ['night', 'mdi:weather-night'],
      ['favorite', 'mdi:heart'],
      ['favourite', 'mdi:heart'],
      ['manual', 'mdi:fan'],
      ['turbo', 'mdi:fan-plus'],
      ['max', 'mdi:fan-plus'],
      ['boost', 'mdi:fan-plus'],
      ['high', 'mdi:fan-plus'],
      ['low', 'mdi:fan-minus'],
      ['off', 'mdi:power'],
      ['none', 'mdi:fan'],
      ['', 'mdi:fan'],
      ['custom', 'mdi:fan'],
    ];
    cases.forEach(([value, icon]) => {
      it(`${value || '(empty)'} → ${icon}, case-insensitive`, () => {
        expect(presetIcon(value)).to.equal(icon);
        expect(presetIcon(value.toUpperCase())).to.equal(icon);
      });
    });
    it('uses the specified matching priority for compound presets', () => {
      expect(presetIcon('auto silent')).to.equal('mdi:fan-auto');
      expect(presetIcon('sleep favorite')).to.equal('mdi:weather-night');
      expect(presetIcon('favorite turbo')).to.equal('mdi:heart');
      expect(presetIcon('manual high')).to.equal('mdi:fan');
      expect(presetIcon('high low')).to.equal('mdi:fan-plus');
    });
  });

  describe('presetColor', () => {
    const primary = 'var(--md-sys-color-primary, var(--primary-color, #6750a4))';
    const cases: [string, string][] = [
      ['auto', primary],
      ['automatic', primary],
      ['silent', 'var(--state-fan-silent-color, #5c7cfa)'],
      ['sleep', 'var(--state-fan-silent-color, #5c7cfa)'],
      ['night', 'var(--state-fan-silent-color, #5c7cfa)'],
      ['favorite', 'var(--md-sys-color-tertiary, #7d5260)'],
      ['favourite', 'var(--md-sys-color-tertiary, #7d5260)'],
      ['off', 'var(--state-fan-off-color, #8a8a8a)'],
      ['manual', primary],
      ['turbo', primary],
      ['max', primary],
      ['boost', primary],
      ['high', primary],
      ['low', primary],
      ['custom', primary],
      ['', primary],
    ];
    cases.forEach(([value, color]) => {
      it(`${value || '(empty)'} uses its CSS fallback chain, case-insensitive`, () => {
        expect(presetColor(value)).to.equal(color);
        expect(presetColor(value.toUpperCase())).to.equal(color);
      });
    });
  });

  describe('prettyLabel', () => {
    it('heat_cool → Heat/Cool', () => {
      expect(prettyLabel('heat_cool')).to.equal('Heat/Cool');
    });
    it('fan_only → Fan Only', () => {
      expect(prettyLabel('fan_only')).to.equal('Fan Only');
    });
    it('single word capitalization', () => {
      expect(prettyLabel('cool')).to.equal('Cool');
      expect(prettyLabel('auto')).to.equal('Auto');
    });
  });

  describe('orderValues', () => {
    it('returns the list unchanged when no order is given', () => {
      const all = ['a', 'b', 'c'];
      expect(orderValues(all)).to.deep.equal(['a', 'b', 'c']);
      expect(orderValues(all)).to.equal(all);
    });
    it('returns the list unchanged for an empty order', () => {
      const all = ['a', 'b', 'c'];
      expect(orderValues(all, [])).to.deep.equal(['a', 'b', 'c']);
      expect(orderValues(all, [])).to.equal(all);
    });
    it('moves listed values to the front (in order), rest in natural order', () => {
      expect(orderValues(['a', 'b', 'c', 'd'], ['c', 'a'])).to.deep.equal(['c', 'a', 'b', 'd']);
    });
    it('ignores order values not present in the list', () => {
      expect(orderValues(['a', 'b'], ['x', 'b'])).to.deep.equal(['b', 'a']);
    });
  });

  describe('isOffValue', () => {
    ['', 'off', 'none', 'false', 'null', '0', 'unavailable', 'unknown'].forEach((v) => {
      it(`treats "${v || '(empty)'}" as off`, () => {
        expect(isOffValue(v)).to.be.true;
      });
    });
    it('is case-insensitive and trims whitespace', () => {
      expect(isOffValue('  OFF ')).to.be.true;
      expect(isOffValue('None')).to.be.true;
      expect(isOffValue('UNAVAILABLE')).to.be.true;
    });
    it('treats any other value as "on"', () => {
      expect(isOffValue('on')).to.be.false;
      expect(isOffValue('21')).to.be.false;
      expect(isOffValue('cool')).to.be.false;
      expect(isOffValue('heat')).to.be.false;
    });
  });
});
