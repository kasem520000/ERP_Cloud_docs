import { describe, it, expect } from 'vitest';
import { computeWac, wacWithinBounds } from '../../src/modules/inventory/domain/valuation/wac.js';
import { consumeFifo, sumLayerQty } from '../../src/modules/inventory/domain/valuation/fifo.js';

describe('INV-017 WAC moving average 6dp half-up', () => {
  it('newAvg = (qtyOnHand*oldAvg + qtyIn*unitCost)/(qtyOnHand+qtyIn) 6dp', () => {
    // Example: 10 @ 5.000000 + 10 @ 7.000000 = 6.000000
    expect(computeWac('10', '5.000000', '10', '7.000000')).toBe('6.000000');
  });
  it('zero stock returns inCost', () => {
    expect(computeWac('0', '0.000000', '5', '12.345678')).toBe('12.345678');
  });
  it('both zero returns 0.000000', () => {
    expect(computeWac('0', '0.000000', '0', '0.000000')).toBe('0.000000');
  });
  it('half-up rounding to 6dp', () => {
    // 1 unit @ 0.000000 + 2 @ 0.0000005 => avg 0.000000333... -> 0.000000? let's force half-up case
    // (0*0 + 3*1.0000005)/3 = 1.0000005 -> 6dp half-up = 1.000001
    expect(computeWac('0', '0.000000', '3', '1.0000005')).toBe('1.000001');
  });
  it('within bounds property: newAvg in [min(oldAvg,inCost), max(...)]', () => {
    const cases: [string, string, string, string][] = [
      ['10', '5.000000', '10', '7.000000'],
      ['100', '10.000000', '50', '8.000000'],
      ['0', '0.000000', '10', '3.500000'],
    ];
    for (const [oq, oa, iq, ic] of cases) {
      const na = computeWac(oq, oa, iq, ic);
      expect(wacWithinBounds(oa, ic, na)).toBe(true);
    }
  });
  it('per-item method lock: wac differs from fifo cost', () => {
    // wac avg 6.0 vs fifo first layer 5.0 -> revaluation preview non-zero
    const wac = computeWac('10', '5.000000', '10', '7.000000');
    expect(wac).not.toBe('5.000000');
  });
});

describe('FIFO oldest-first', () => {
  it('consumeFifo oldest-first', () => {
    const layers = [
      { id: 'l1', remainingQty: '5', unitCost: '10.000000', createdAt: '2026-01-01' },
      { id: 'l2', remainingQty: '10', unitCost: '12.000000', createdAt: '2026-01-02' },
    ];
    const { consumed } = consumeFifo(layers, '8');
    expect(consumed[0].layerId).toBe('l1');
    expect(consumed[0].qty).toBe('5');
    expect(consumed[1].layerId).toBe('l2');
    expect(consumed[1].qty).toBe('3');
  });
  it('sumLayerQty equals onHand', () => {
    const layers = [
      { id: 'l1', remainingQty: '3', unitCost: '1', createdAt: '2026-01-01' },
      { id: 'l2', remainingQty: '7', unitCost: '2', createdAt: '2026-01-02' },
    ];
    expect(sumLayerQty(layers)).toBe('10.0000');
  });
  it('Σremaining after consume + consumed = original onHand', () => {
    const orig = [
      { id: 'l1', remainingQty: '10', unitCost: '5', createdAt: '2026-01-01' },
      { id: 'l2', remainingQty: '10', unitCost: '7', createdAt: '2026-01-02' },
    ];
    const before = Number(sumLayerQty(orig));
    const { consumed, remaining } = consumeFifo(orig.map(l => ({ ...l })), '12');
    const consumedSum = consumed.reduce((a, c) => a + Number(c.qty), 0);
    const remainSum = Number(sumLayerQty(remaining));
    expect(consumedSum + remainSum).toBeCloseTo(before, 4);
  });
});
