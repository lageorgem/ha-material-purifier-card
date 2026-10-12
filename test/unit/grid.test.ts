import { expect } from '@open-wc/testing';
import {
  WIDTH_STEP,
  MIN_WIDTH_PCT,
  MAX_WIDTH_PCT,
  GRID_COLUMNS,
  TILE_DEFAULT_PCT,
  DIAL_MAX_PX,
  DIAL_MIN_PX,
  WIDE_MIN_PX,
  CARD_PADDING_X,
  pctToSpan,
} from '../../src/grid';

describe('grid', () => {
  it('layout constants satisfy the grid invariants the layout math relies on', () => {
    expect(GRID_COLUMNS * WIDTH_STEP).to.equal(MAX_WIDTH_PCT);
    expect(MIN_WIDTH_PCT).to.equal(WIDTH_STEP);
    expect(MAX_WIDTH_PCT % WIDTH_STEP).to.equal(0);
    expect(TILE_DEFAULT_PCT % WIDTH_STEP).to.equal(0);
    expect(TILE_DEFAULT_PCT).to.be.within(MIN_WIDTH_PCT, MAX_WIDTH_PCT);
    expect(DIAL_MIN_PX).to.be.lessThan(DIAL_MAX_PX);
    expect(DIAL_MAX_PX).to.be.lessThan(WIDE_MIN_PX);
    expect(CARD_PADDING_X).to.be.greaterThan(0);
  });
  it('pctToSpan maps percentage to a 10-column span', () => {
    expect(pctToSpan(100)).to.equal(10);
    expect(pctToSpan(50)).to.equal(5);
    expect(pctToSpan(30)).to.equal(3);
    expect(pctToSpan(5)).to.equal(1);
    expect(pctToSpan(999)).to.equal(10);
    expect(pctToSpan(44)).to.equal(4);
    expect(pctToSpan(45)).to.equal(5);
  });
});
