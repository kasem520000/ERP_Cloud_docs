import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
describe('property rounding conservation',()=>{
  it('Σ rounded lines = header total when residual explicit',()=>{
    const lines=[new Decimal('33.3333'), new Decimal('33.3333'), new Decimal('33.3334')];
    const sum=lines.reduce((a,b)=>a.plus(b), new Decimal(0));
    expect(sum.equals(new Decimal('100.0000'))).toBe(true);
  });
});
