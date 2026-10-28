import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
function resolveRoot(p: string): string {
  if (fs.existsSync(p)) return p;
  const alt = path.join('..','..', p);
  if (fs.existsSync(alt)) return alt;
  return p;
}
const hasDocker = fs.existsSync('/var/run/docker.sock');
describe.skipIf(!hasDocker)('pg-boss dedupe (requires Docker)', () => {});
describe('pg-boss contract documented', () => {
  it('boss schema is in 0002', () => {
    const dir = path.resolve(resolveRoot('apps/api/migrations'));
    const m2 = fs.readFileSync(path.join(dir, '0002_boss_and_rls_macro.sql'),'utf8');
    expect(m2).toContain('boss');
    expect(m2).toContain('apply_tenant_policy');
  });
});
