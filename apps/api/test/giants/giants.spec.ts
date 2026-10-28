import { describe, it, expect } from 'vitest'; import fs from 'node:fs';
describe('Giants 026-034',()=>{
  it('fixed_assets/employees RLS',()=>{ const s=fs.readFileSync('migrations/0024_giants_core.sql','utf8'); expect(s).toContain('fixed_assets'); expect(s).toContain('employees'); expect(s).toContain('tenant_isolation'); });
  it('industries 028-033 tables RLS',()=>{ const s=fs.readFileSync('migrations/0025_giants_industries.sql','utf8'); expect(s).toContain('wholesale_prices'); expect(s).toContain('warranty_claims'); expect(s).toContain('patients'); expect(s).toContain('students'); expect(s).toContain('farms'); });
  it('034 consolidation RLS',()=>{ const s=fs.readFileSync('migrations/0026_group_consolidation.sql','utf8'); expect(s).toContain('consolidation_groups'); });
});
