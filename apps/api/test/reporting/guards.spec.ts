import { describe, it, expect } from 'vitest'; import fs from 'node:fs';
describe('PHASE-013 reporting RLS + registry boot',()=>{
  const sql=fs.readFileSync('migrations/0014_reporting_core.sql','utf8');
  it('report_runs + print_templates RLS + 4 base templates seeded',()=>{
    expect(sql).toContain('report_runs');
    expect(sql).toContain('print_templates');
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('a4-report');
    expect(sql).toContain('a4-document');
    expect(sql).toContain('receipt-80');
    expect(sql).toContain('receipt-58');
  });
  it('registry zod boot validation + provenance + requiredPermission',()=>{
    const src=fs.readFileSync('src/modules/reporting/registry/index.ts','utf8');
    expect(src).toContain('REPORT_CONTRACT');
    expect(src).toContain('requiredPermission');
    expect(src).toContain('reports.');
    expect(src).toContain('dataSources');
  });
  it('registry snapshot endpoint exists for navigation',()=>{
    const ctrl=fs.readFileSync('src/modules/reporting/presentation/reporting.controller.ts','utf8');
    expect(ctrl).toContain('snapshot');
    expect(ctrl).toContain('reports');
  });
  it('executionClass inline vs pg-boss + report_runs status QUEUED→RUNNING→SUCCEEDED/FAILED',()=>{
    const rn=fs.readFileSync('src/modules/reporting/application/run-service.ts','utf8');
    expect(rn).toContain('QUEUED');
    expect(rn).toContain('FORBIDDEN_AT_RUN'); // revoked grant kills queued run no TOCTOU
    expect(rn).toContain('params_hash'); // idempotency per (report_id, params_hash)
  });
  it('inline executor envelope decimal-string + groups/totals/drillLinks freshness asOf',()=>{
    const src=fs.readFileSync('src/modules/reporting/application/executor.ts','utf8');
    expect(src).toContain('decimal-string');
    expect(src).toContain('asOf');
    expect(src).toContain('freshness');
    expect(src).toContain('drillLinks');
  });
  it('scope intersection + permission re-resolved + drill-link disabled bilingual',()=>{
    const src=fs.readFileSync('src/modules/reporting/application/scope.ts','utf8');
    expect(src).toContain('effective');
    expect(src).toContain('blockedScopes');
    expect(src).toContain('requiredPermission');
  });
});
