import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import {
  autoPm25Entity,
  autoRpmEntity,
  deviceSiblings,
  displayAqi,
  loadMetric,
  metricStorageKey,
  motorFraction,
  readAqi,
  readNumber,
  saveMetric,
  resolveMetric,
  toggleMetric,
} from '../../src/entities';
import type { AqiMetric } from '../../src/types';
import { entityState, makeHass } from '../helpers';

const fan = 'fan.air_purifier';
const pm = 'sensor.air_purifier_pm2_5';
const rpm = 'sensor.air_purifier_motor_speed';

function fixture(unit = 'µg/m³') {
  return makeHass(
    {
      [fan]: entityState(fan),
      [pm]: entityState(pm, '9', { unit_of_measurement: unit }),
      [rpm]: entityState(rpm, '1100', { unit_of_measurement: ' RPM ' }),
    },
    {
      entities: {
        [fan]: { entity_id: fan, device_id: 'purifier' },
        [pm]: { entity_id: pm, device_id: 'purifier' },
        [rpm]: { entity_id: rpm, device_id: 'purifier' },
        'sensor.other': { entity_id: 'sensor.other', device_id: 'other' },
      },
    }
  );
}

describe('entity discovery', () => {
  it('returns other same-device entities in registry order', () => {
    expect(deviceSiblings(fixture(), fan)).to.deep.equal([pm, rpm]);
  });

  it('returns no siblings without a registry, entry, or device', () => {
    const hass = fixture();
    expect(deviceSiblings(hass, 'fan.missing')).to.deep.equal([]);
    delete hass.entities[fan].device_id;
    expect(deviceSiblings(hass, fan)).to.deep.equal([]);
    Reflect.deleteProperty(hass, 'entities');
    expect(deviceSiblings(hass, fan)).to.deep.equal([]);
  });

  for (const unit of ['µg/m³', 'μg/m³', 'ug/m3', ' UG/M3 ', ' ΜG/M³ ']) {
    it(`detects PM2.5 unit ${unit}`, () => {
      expect(autoPm25Entity(fixture(unit), fan)).to.equal(pm);
    });
  }

  it('detects device_class pm25 without a matching unit', () => {
    const hass = fixture('unknown');
    hass.states[pm].attributes.device_class = 'pm25';
    expect(autoPm25Entity(hass, fan)).to.equal(pm);
  });

  it('detects trimmed case-insensitive rpm', () => {
    expect(autoRpmEntity(fixture(), fan)).to.equal(rpm);
  });

  it('chooses the first sensor and skips non-sensors and missing states', () => {
    const hass = makeHass(
      {
        'number.pm': entityState('number.pm', '5', {
          device_class: 'pm25',
          unit_of_measurement: 'rpm',
        }),
        'sensor.first': entityState('sensor.first', '5', {
          device_class: 'pm25',
          unit_of_measurement: 'rpm',
        }),
        'sensor.second': entityState('sensor.second', '6', {
          device_class: 'pm25',
          unit_of_measurement: 'rpm',
        }),
      },
      {
        entities: Object.fromEntries(
          [fan, 'number.pm', 'sensor.missing', 'sensor.first', 'sensor.second'].map((entity_id) => [
            entity_id,
            { entity_id, device_id: 'purifier' },
          ])
        ),
      }
    );
    expect(autoPm25Entity(hass, fan)).to.equal('sensor.first');
    expect(autoRpmEntity(hass, fan)).to.equal('sensor.first');
  });

  it('returns undefined when no matching sensor exists', () => {
    expect(autoPm25Entity(fixture('ppm'), fan)).to.equal(undefined);
    const hass = fixture();
    hass.states[rpm].attributes.unit_of_measurement = 'Hz';
    expect(autoRpmEntity(hass, fan)).to.equal(undefined);
    expect(autoPm25Entity(makeHass(), fan)).to.equal(undefined);
    expect(autoRpmEntity(makeHass(), fan)).to.equal(undefined);
  });
});

describe('AQI readings and display', () => {
  it('resolves defaults, legacy metrics, and explicit scale overrides', () => {
    expect(resolveMetric()).to.equal('us_aqi');
    expect(resolveMetric({ metric: 'aqi', scale: 'cn' })).to.equal('cn_aqi');
    expect(resolveMetric({ metric: 'cn_aqi' })).to.equal('cn_aqi');
    expect(resolveMetric({ metric: 'us_aqi' })).to.equal('us_aqi');
    expect(resolveMetric({ metric: 'cn_aqi', scale: 'us' })).to.equal('us_aqi');
    expect(resolveMetric({ metric: 'us_aqi', scale: 'cn' })).to.equal('cn_aqi');
    expect(resolveMetric({ metric: 'pm25', scale: 'cn' })).to.equal('pm25');
  });

  it('toggles only concentration and the configured AQI scale', () => {
    expect(toggleMetric('pm25')).to.equal('us_aqi');
    expect(toggleMetric('pm25', { metric: 'cn_aqi' })).to.equal('cn_aqi');
    expect(toggleMetric('pm25', { metric: 'pm25', scale: 'cn' })).to.equal('cn_aqi');
    expect(toggleMetric('pm25', { metric: 'cn_aqi', scale: 'us' })).to.equal('us_aqi');
    expect(toggleMetric('us_aqi', { scale: 'cn' })).to.equal('pm25');
    expect(toggleMetric('cn_aqi')).to.equal('pm25');
  });

  it('reads the auto-detected PM2.5 state', () => {
    expect(readAqi(fixture(), fan)).to.deep.equal({ value: 9, source: 'pm25', entity: pm });
  });

  it('uses the configured entity, attribute, and explicit source', () => {
    const hass = fixture();
    hass.states[fan].attributes.air_quality = '35.5 extra';
    expect(
      readAqi(hass, fan, { entity: fan, attribute: 'air_quality', source: 'cn_aqi' })
    ).to.deep.equal({ value: 35.5, source: 'cn_aqi', entity: fan });
  });

  it('infers AQI source from the selected entity metadata', () => {
    expect(readAqi(fixture(' AQI '), fan, { entity: pm }).source).to.equal('us_aqi');
    const hass = fixture('AQI');
    hass.states[pm].attributes.device_class = 'pm25';
    expect(readAqi(hass, fan, { entity: pm }).source).to.equal('pm25');
  });

  it('uses configured attributes on auto-detected entities', () => {
    const hass = fixture();
    hass.states[pm].attributes.reading = 12.3;
    expect(readAqi(hass, fan, { attribute: 'reading' }).value).to.equal(12.3);
  });

  it('handles absent entities and attributes without fallback to another entity', () => {
    expect(readAqi(makeHass(), fan)).to.deep.equal({ value: null, source: 'pm25', entity: null });
    expect(readAqi(fixture(), fan, { entity: 'sensor.missing' })).to.deep.equal({
      value: null,
      source: 'pm25',
      entity: 'sensor.missing',
    });
    expect(readAqi(fixture(), fan, { attribute: 'missing' }).value).to.equal(null);
    expect(readAqi(makeHass(), fan, { source: 'cn_aqi' }).source).to.equal('cn_aqi');
  });

  for (const state of ['unavailable', 'unknown', 'NaN', 'Infinity', '-Infinity', '']) {
    it(`returns null for ${JSON.stringify(state)} readings`, () => {
      const hass = fixture();
      hass.states[pm].state = state;
      expect(readAqi(hass, fan).value).to.equal(null);
      expect(readNumber(hass, pm)).to.equal(null);
    });
  }

  it('converts and classifies using the default 2024 revision', () => {
    const result = displayAqi({ value: 9, source: 'pm25', entity: pm }, 'us_aqi');
    expect(result.text).to.equal('50');
    expect(result.value).to.equal(50);
    expect(result.level?.key).to.equal('good');
  });

  it('passes an explicit revision to conversion and PM2.5 classification', () => {
    expect(displayAqi({ value: 12, source: 'pm25', entity: pm }, 'us_aqi', '2012').value).to.equal(
      50
    );
    expect(
      displayAqi({ value: 12, source: 'pm25', entity: pm }, 'pm25', '2012').level?.key
    ).to.equal('good');
    expect(displayAqi({ value: 12, source: 'pm25', entity: pm }, 'pm25').level?.key).to.equal(
      'moderate'
    );
  });

  it('formats PM2.5 fractions and converts CN AQI', () => {
    expect(displayAqi({ value: 2.25, source: 'pm25', entity: pm }, 'pm25').text).to.equal('2.3');
    const cn = displayAqi({ value: 35, source: 'pm25', entity: pm }, 'cn_aqi');
    expect(cn.value).to.equal(50);
    expect(cn.text).to.equal('50');
    expect(cn.level?.label).to.equal('Excellent');
  });

  for (const value of [null, NaN, Infinity, -Infinity]) {
    it(`guards invalid display input ${value}`, () => {
      for (const metric of ['pm25', 'us_aqi', 'cn_aqi'] as const) {
        expect(displayAqi({ value, source: 'pm25', entity: pm }, metric)).to.deep.equal({
          text: '—',
          value: null,
          level: null,
        });
      }
    });
  }
});

describe('numeric readings and motor fraction', () => {
  it('uses parseFloat and handles missing entities', () => {
    const hass = fixture();
    hass.states[rpm].state = '123.5 rpm';
    expect(readNumber(hass, rpm)).to.equal(123.5);
    expect(readNumber(hass)).to.equal(null);
    expect(readNumber(hass, 'sensor.missing')).to.equal(null);
  });

  it('defaults max rpm to 2200 and accepts an override', () => {
    expect(motorFraction(fixture(), rpm)).to.equal(0.5);
    expect(motorFraction(fixture(), rpm, 4400)).to.equal(0.25);
  });

  it('clamps negative and excessive rpm', () => {
    const hass = fixture();
    hass.states[rpm].state = '-20';
    expect(motorFraction(hass, rpm)).to.equal(0);
    hass.states[rpm].state = '5000';
    expect(motorFraction(hass, rpm)).to.equal(1);
  });

  it('returns null for missing rpm, unavailable rpm, and nonpositive maximum', () => {
    expect(motorFraction(fixture(), undefined)).to.equal(null);
    expect(motorFraction(fixture(), 'sensor.missing')).to.equal(null);
    const hass = fixture();
    hass.states[rpm].state = 'unavailable';
    expect(motorFraction(hass, rpm)).to.equal(null);
    expect(motorFraction(fixture(), rpm, 0)).to.equal(null);
    expect(motorFraction(fixture(), rpm, -1)).to.equal(null);
  });
});

describe('metric persistence', () => {
  afterEach(() => sinon.restore());

  it('namespaces keys by fan entity', () => {
    expect(metricStorageKey(fan)).to.equal(`material-purifier-card:metric:${fan}`);
    expect(metricStorageKey('fan.other')).not.to.equal(metricStorageKey(fan));
  });

  for (const metric of ['us_aqi', 'cn_aqi', 'pm25'] as const) {
    it(`loads and saves ${metric}`, () => {
      const get = sinon.stub(Storage.prototype, 'getItem').returns(metric);
      const set = sinon.stub(Storage.prototype, 'setItem');
      expect(loadMetric(fan, 'pm25')).to.equal(metric);
      expect(get.calledOnceWithExactly(metricStorageKey(fan))).to.equal(true);
      saveMetric(fan, metric);
      expect(set.calledOnceWithExactly(metricStorageKey(fan), metric)).to.equal(true);
    });
  }

  for (const stored of [null, '', 'AQI', 'invalid', ' us_aqi ']) {
    it(`falls back for invalid stored value ${JSON.stringify(stored)}`, () => {
      sinon.stub(Storage.prototype, 'getItem').returns(stored);
      for (const fallback of ['us_aqi', 'cn_aqi', 'pm25'] as AqiMetric[]) {
        expect(loadMetric(fan, fallback)).to.equal(fallback);
      }
    });
  }

  it('falls back on storage read exceptions and swallows write exceptions', () => {
    sinon.stub(Storage.prototype, 'getItem').throws(new Error('Storage blocked'));
    sinon.stub(Storage.prototype, 'setItem').throws(new Error('Quota exceeded'));
    expect(loadMetric(fan, 'cn_aqi')).to.equal('cn_aqi');
    expect(() => saveMetric(fan, 'pm25')).not.to.throw();
  });
});
