import { expect } from '@open-wc/testing';
import {
  aqiLevel,
  cnAqiToPm25,
  convertAqi,
  formatAqi,
  inferSource,
  metricLabel,
  nextMetric,
  PM25_COLOR_TABLE,
  pm25Color,
  pm25ToCnAqi,
  pm25ToUsAqi,
  usAqiToPm25,
} from '../../src/calc/aqi';
import type { AqiMetric, UsAqiBreakpoints } from '../../src/types';

describe('AQI conversion', () => {
  it('matches EPA 2024 reference values and truncates concentration', () => {
    const references = [
      [0, 0],
      [9, 50],
      [9.1, 51],
      [12, 56],
      [35.4, 100],
      [35.5, 101],
      [55.4, 150],
      [125.4, 200],
      [225.4, 300],
      [325.4, 500],
      [9.05, 50],
    ];
    for (const [concentration, aqi] of references) {
      expect(pm25ToUsAqi(concentration)).to.equal(aqi);
      expect(pm25ToUsAqi(concentration, '2024')).to.equal(aqi);
    }
  });

  it('matches EPA 2012 reference values', () => {
    for (const [concentration, aqi] of [
      [11, 46],
      [12, 50],
      [12.1, 51],
      [35.4, 100],
      [150.4, 200],
      [250.4, 300],
      [350.4, 400],
      [500.4, 500],
    ]) {
      expect(pm25ToUsAqi(concentration, '2012')).to.equal(aqi);
    }
  });

  it('matches HJ 633-2012 reference values and rounds upward', () => {
    for (const [concentration, aqi] of [
      [0, 0],
      [11, 16],
      [35, 50],
      [36, 52],
      [75, 100],
      [115, 150],
      [150, 200],
      [250, 300],
      [350, 400],
      [500, 500],
    ]) {
      expect(pm25ToCnAqi(concentration)).to.equal(aqi);
    }
    expect(pm25ToCnAqi(0.1)).to.equal(1);
  });

  it('clamps negatives and extrapolates the final segment up to 999', () => {
    expect(pm25ToUsAqi(-10)).to.equal(0);
    expect(pm25ToUsAqi(-10, '2012')).to.equal(0);
    expect(pm25ToCnAqi(-10)).to.equal(0);
    expect(pm25ToUsAqi(425.3)).to.equal(699);
    expect(pm25ToUsAqi(650.3, '2012')).to.equal(599);
    expect(pm25ToCnAqi(650)).to.equal(600);
    expect(pm25ToUsAqi(10000)).to.equal(999);
    expect(pm25ToUsAqi(10000, '2012')).to.equal(999);
    expect(pm25ToCnAqi(10000)).to.equal(999);
  });

  it('inverts without rounding and extrapolates above the table', () => {
    expect(usAqiToPm25(50)).to.equal(9);
    expect(usAqiToPm25(51)).to.equal(9.1);
    expect(usAqiToPm25(50, '2012')).to.equal(12);
    expect(usAqiToPm25(500)).to.equal(325.4);
    expect(usAqiToPm25(500, '2012')).to.equal(500.4);
    expect(usAqiToPm25(25)).to.equal(4.5);
    expect(cnAqiToPm25(25)).to.equal(17.5);
    expect(cnAqiToPm25(600)).to.equal(650);
    expect(usAqiToPm25(699)).to.be.closeTo(425.3, 1e-9);
    expect(usAqiToPm25(-1)).to.equal(0);
    expect(cnAqiToPm25(-1)).to.equal(0);
  });

  it('round-trips AQI within one point across both EPA revisions and CN', () => {
    for (const rev of ['2024', '2012'] as UsAqiBreakpoints[]) {
      for (let aqi = 0; aqi <= 500; aqi += 7) {
        expect(Math.abs(pm25ToUsAqi(usAqiToPm25(aqi, rev), rev) - aqi)).to.be.at.most(1);
      }
    }
    for (let aqi = 0; aqi <= 500; aqi += 7) {
      expect(Math.abs(pm25ToCnAqi(cnAqiToPm25(aqi)) - aqi)).to.be.at.most(1);
    }
  });

  it('converts via PM2.5, preserves identity, and keeps concentration unrounded', () => {
    for (const metric of ['us_aqi', 'cn_aqi', 'pm25'] as AqiMetric[]) {
      expect(convertAqi(12.345, metric, metric)).to.equal(12.345);
      expect(convertAqi(-5, metric, metric)).to.equal(-5);
    }
    expect(convertAqi(25, 'us_aqi', 'pm25')).to.equal(4.5);
    expect(convertAqi(25, 'cn_aqi', 'pm25')).to.equal(17.5);
    expect(convertAqi(12, 'pm25', 'us_aqi')).to.equal(56);
    expect(convertAqi(12, 'pm25', 'us_aqi', '2012')).to.equal(50);
    expect(convertAqi(36, 'pm25', 'cn_aqi')).to.equal(52);
    expect(convertAqi(50, 'us_aqi', 'cn_aqi')).to.equal(pm25ToCnAqi(9));
    expect(convertAqi(50, 'cn_aqi', 'us_aqi')).to.equal(pm25ToUsAqi(35));
    expect(convertAqi(50, 'us_aqi', 'cn_aqi', '2012')).to.equal(pm25ToCnAqi(12));
  });
});

describe('AQI presentation', () => {
  it('uses AirNow colors at truncated EPA 2024 PM2.5 boundaries', () => {
    expect(PM25_COLOR_TABLE).to.deep.equal([
      { max: 9.0, color: '#00E400', key: 'good' },
      { max: 35.4, color: '#FFFF00', key: 'moderate' },
      { max: 55.4, color: '#FF7E00', key: 'sensitive' },
      { max: 125.4, color: '#FF0000', key: 'unhealthy' },
      { max: 225.4, color: '#8F3F97', key: 'very_unhealthy' },
      { max: Infinity, color: '#7E0023', key: 'hazardous' },
    ]);
    for (const [concentration, color] of [
      [-1, '#00E400'],
      [9.0, '#00E400'],
      [9.05, '#00E400'],
      [9.1, '#FFFF00'],
      [35.4, '#FFFF00'],
      [35.5, '#FF7E00'],
      [55.4, '#FF7E00'],
      [55.5, '#FF0000'],
      [125.4, '#FF0000'],
      [125.5, '#8F3F97'],
      [225.4, '#8F3F97'],
      [225.5, '#7E0023'],
      [1000, '#7E0023'],
      [null, null],
      [NaN, null],
    ] as const) {
      expect(pm25Color(concentration), String(concentration)).to.equal(color);
    }
  });

  it('classifies all band boundaries with keys, indices, labels, and colors', () => {
    const keys = ['good', 'moderate', 'sensitive', 'unhealthy', 'very_unhealthy', 'hazardous'];
    const usLabels = [
      'Good',
      'Moderate',
      'Unhealthy for sensitive groups',
      'Unhealthy',
      'Very unhealthy',
      'Hazardous',
    ];
    const cnLabels = [
      'Excellent',
      'Good',
      'Lightly polluted',
      'Moderately polluted',
      'Heavily polluted',
      'Severely polluted',
    ];
    const colors = ['#00E400', '#FFFF00', '#FF7E00', '#FF0000', '#8F3F97', '#7E0023'];
    const bands = [
      [0, 50],
      [51, 100],
      [101, 150],
      [151, 200],
      [201, 300],
      [301, 999],
    ];
    bands.forEach((values, index) => {
      for (const value of values) {
        expect(aqiLevel(value, 'us_aqi')).to.deep.equal({
          index,
          key: keys[index],
          label: usLabels[index],
          color: colors[index],
        });
        expect(aqiLevel(value, 'cn_aqi')).to.deep.equal({
          index,
          key: keys[index],
          label: cnLabels[index],
          color: colors[index],
        });
      }
    });
    expect(aqiLevel(45, 'us_aqi').key).to.equal('good');
    expect(aqiLevel(101, 'us_aqi').key).to.equal('sensitive');
    expect(aqiLevel(60, 'cn_aqi').label).to.equal('Good');
    expect(aqiLevel(36, 'pm25', '2024').key).to.equal('sensitive');
    expect(aqiLevel(11, 'pm25').label).to.equal('Moderate');
    expect(aqiLevel(11, 'pm25', '2012').label).to.equal('Good');
    expect(aqiLevel(-1, 'us_aqi').key).to.equal('good');
  });

  it('labels and cycles metrics', () => {
    expect(metricLabel('us_aqi')).to.equal('AQI');
    expect(metricLabel('cn_aqi')).to.equal('AQI');
    expect(metricLabel('pm25')).to.equal('µg/m³');
    expect(nextMetric('us_aqi')).to.equal('cn_aqi');
    expect(nextMetric('cn_aqi')).to.equal('pm25');
    expect(nextMetric('pm25')).to.equal('us_aqi');
  });

  it('infers source units including both micro signs and ASCII notation', () => {
    for (const unit of ['µg/m³', 'μg/m³', 'ug/m3', ' UG/M3 ', ' ΜG/M³ ']) {
      expect(inferSource(unit)).to.equal('pm25');
    }
    expect(inferSource('AQI')).to.equal('us_aqi');
    expect(inferSource(' aQi ')).to.equal('us_aqi');
    expect(inferSource('AQI', 'pm25')).to.equal('pm25');
    expect(inferSource(undefined, 'pm25')).to.equal('pm25');
    expect(inferSource()).to.equal('pm25');
    expect(inferSource('unknown', 'unknown')).to.equal('pm25');
  });

  it('formats integers for AQI and compact decimals for small concentrations', () => {
    expect(formatAqi(56.4, 'us_aqi')).to.equal('56');
    expect(formatAqi(56.6, 'cn_aqi')).to.equal('57');
    expect(formatAqi(12.6, 'pm25')).to.equal('13');
    expect(formatAqi(10, 'pm25')).to.equal('10');
    expect(formatAqi(9.14, 'pm25')).to.equal('9.1');
    expect(formatAqi(9.96, 'pm25')).to.equal('10');
    expect(formatAqi(9, 'pm25')).to.equal('9');
    expect(formatAqi(0, 'pm25')).to.equal('0');
  });
});
