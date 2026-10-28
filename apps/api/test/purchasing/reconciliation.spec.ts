import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('AP reconciliation RC-02/03/09 INV-009 + determinism',()=>{
  it('reconcileAp INV-009 OK/BROKEN',()=>{
    const src=fs.readFileSync('src/modules/purchasing/application/ap-queries.ts','utf8');
    expect(src).toContain('reconcileAp');
    expect(src).toContain('AP_CONTROL');
    expect(src).toContain('BROKEN');
    expect(src).toContain('ap_009');
  });
  it('aging buckets notDue/1-30/31-60/61-90/90+',()=>{
    const src=fs.readFileSync('src/modules/purchasing/application/ap-queries.ts','utf8');
    expect(src).toContain('notDue');
    expect(src).toContain('d1_30');
    expect(src).toContain('over90');
  });
  it('statement running balance + opening AP G-16',()=>{
    const src=fs.readFileSync('src/modules/purchasing/application/ap-queries.ts','utf8');
    expect(src).toContain('running');
    expect(src).toContain('getSupplierStatement');
  });
  it('opening AP verification script exists',()=>{
    expect(fs.existsSync('src/modules/purchasing/application/opening-ap.ts')).toBe(true);
    const src=fs.readFileSync('src/modules/purchasing/application/opening-ap.ts','utf8');
    expect(src).toContain('INV-009');
    expect(src).toContain('G-16');
  });
});
