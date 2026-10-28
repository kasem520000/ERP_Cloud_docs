import { describe, it, expect } from 'vitest'; import fs from 'node:fs';
describe('PHASE-018 Manufacturing',()=>{
  it('BOMs + work_orders RLS + food_manufacturing template',()=>{
    const s=fs.readFileSync('migrations/0019_manufacturing.sql','utf8');
    expect(s).toContain('manufacturing_boms'); expect(s).toContain('work_orders');
    expect(s).toContain('industry.food_manufacturing'); expect(s).toContain('tenant_isolation');
  });
});
describe('PHASE-019 CRM Projects',()=>{
  it('leads + projects RLS + professional_services template',()=>{
    const s=fs.readFileSync('migrations/0020_crm_projects.sql','utf8');
    expect(s).toContain('crm_leads'); expect(s).toContain('projects');
    expect(s).toContain('industry.professional_services'); expect(s).toContain('tenant_isolation');
  });
});
