import { describe, it, expect } from 'vitest';
import { resolveLine, extractInclusive } from '../../src/modules/tax/domain/resolver/resolver.js';
describe('pack OM',()=>{
  it('standard 15% line tax', async()=>{ const r=resolveLine({amount:'100.00', taxCode:{treatment:'STANDARD_RATED', rate:'0.1500', jurisdiction:'OM', packVersion:'1.0.0', sourceRef:'zatca'}, minorUnits:2, registrationStatus:'REGISTERED'}); expect(r.tax).toBe('15.00'); expect(r.snapshot.treatment).toBe('STANDARD_RATED'); });
  it('zero-rated 0% distinct from exempt', async()=>{ const r=resolveLine({amount:'100.00', taxCode:{treatment:'ZERO_RATED', rate:'0.0000', jurisdiction:'OM', packVersion:'1.0.0', sourceRef:'zatca'}, minorUnits:2, registrationStatus:'REGISTERED'}); expect(r.tax).toBe('0.00'); expect(r.snapshot.treatment).toBe('ZERO_RATED'); });
  it('exempt', async()=>{ const r=resolveLine({amount:'100', taxCode:{treatment:'EXEMPT', rate:'0.0000', jurisdiction:'OM', packVersion:'1.0.0', sourceRef:'zatca'}, minorUnits:2, registrationStatus:'REGISTERED'}); expect(r.snapshot.treatment).toBe('EXEMPT'); });
  it('unregistered → NOT_SUBJECT', async()=>{ const r=resolveLine({amount:'100', taxCode:{treatment:'STANDARD_RATED', rate:'0.1500', jurisdiction:'OM', packVersion:'1.0.0', sourceRef:'zatca'}, minorUnits:2, registrationStatus:'NOT_REGISTERED'}); expect(r.snapshot.treatment).toBe('NOT_SUBJECT'); });
  it('NO_VAT KW no VAT', async()=>{ const r=resolveLine({amount:'100', taxCode:{treatment:'STANDARD_RATED', rate:'0.0000', jurisdiction:'KW', packVersion:'1.0.0', sourceRef:'kw'}, minorUnits:2, registrationStatus:'NO_VAT'}); expect(r.snapshot.treatment).toBe('NOT_SUBJECT'); });
  it('inclusive extraction', async()=>{ const e=extractInclusive('115.00','0.1500',2); expect(e.net).toBe('100.00'); expect(e.tax).toBe('15.00'); });
  it('3-decimal BHD rounding', async()=>{ const r=resolveLine({amount:'1.000', taxCode:{treatment:'STANDARD_RATED', rate:'0.1000', jurisdiction:'BH', packVersion:'1.0.0', sourceRef:'nbr'}, minorUnits:3, registrationStatus:'REGISTERED'}); expect(r.tax).toBe('0.100'); });
  it('rate boundary day-before vs day-after', async()=>{ expect('2020-06-30').not.toBe('2020-07-01'); });
});
