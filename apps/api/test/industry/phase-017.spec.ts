import { describe, it, expect } from 'vitest'; import fs from 'node:fs';
describe('PHASE-017 — Automotive & Distribution templates',()=>{
  it('migration seeds 2 templates with RLS tables',()=>{
    const sql=fs.readFileSync('migrations/0018_industry_automotive_distribution.sql','utf8');
    expect(sql).toContain('industry.automotive'); expect(sql).toContain('industry.distribution');
    expect(sql).toContain('service_orders'); expect(sql).toContain('distribution_settlements');
    expect(sql).toContain('tenant_isolation');
    expect(sql).toContain('crm.service_orders'); expect(sql).toContain('distribution.settlements');
  });
  it('manifests have nav/terminology/series/pins',()=>{
    const sql=fs.readFileSync('migrations/0018_industry_automotive_distribution.sql','utf8');
    expect(sql).toContain('أوامر الصيانة'); expect(sql).toContain('التسويات');
    expect(sql).toContain('numbering_series'); expect(sql).toContain('report_pins');
  });
});
