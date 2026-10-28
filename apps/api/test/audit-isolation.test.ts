import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
function resolveRoot(p: string): string {
  if (fs.existsSync(p)) return p;
  const alt = path.join('..','..', p);
  if (fs.existsSync(alt)) return alt;
  if (p.startsWith('apps/api/') && fs.existsSync(p.replace('apps/api/',''))) return p.replace('apps/api/','');
  return p;
}
describe('Audit isolation (T2 guard)', () => {
  const dir = path.resolve(resolveRoot('apps/api/migrations'));
  const sql = fs.readFileSync(path.join(dir, '0001_core_infra.sql'),'utf8');
  it('audit_events has BEFORE UPDATE OR DELETE guard trigger', () => { expect(sql).toMatch(/BEFORE UPDATE OR DELETE ON audit_events/); });
  it('guard raises exception (append-only)', () => { expect(sql).toMatch(/RAISE EXCEPTION.*append-only/); });
  it('audit_events has RLS tenant_isolation', () => { expect(sql).toMatch(/CREATE POLICY tenant_isolation ON audit_events/); });
  it('audit module skeleton exists', () => {
    expect(fs.existsSync(resolveRoot('apps/api/src/modules/audit/audit.service.ts'))).toBe(true);
    expect(fs.existsSync(resolveRoot('apps/api/src/modules/audit/audit.module.ts'))).toBe(true);
  });
});
