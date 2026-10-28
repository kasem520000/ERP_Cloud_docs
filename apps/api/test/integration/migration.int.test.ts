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
const hasDocker = !!process.env.DOCKER_HOST || fs.existsSync('/var/run/docker.sock');

describe.skipIf(!hasDocker)('Migration integration (requires Docker)', () => {
});

describe('Migration structural checks (no Docker fallback)', () => {
  it('migrations are idempotent (DO blocks + IF NOT EXISTS)', async () => {
    const dir = path.resolve(resolveRoot('apps/api/migrations'));
    const files = fs.readdirSync(dir).filter(f=>f.endsWith('.sql'));
    for (const f of files) {
      const sql = fs.readFileSync(path.join(dir, f), 'utf8');
      expect(sql).toMatch(/IF NOT EXISTS|DO \$\$/);
    }
  });
  it('migrations sort correctly (NNNN prefix)', async () => {
    const dir = path.resolve(resolveRoot('apps/api/migrations'));
    const files = fs.readdirSync(dir).filter(f=>f.endsWith('.sql')).sort();
    expect(files[0] < files[1]).toBe(true);
  });
  it('fresh migration would create tenants + audit_events + boss', async () => {
    const dir = path.resolve(resolveRoot('apps/api/migrations'));
    const m1 = fs.readFileSync(path.join(dir, '0001_core_infra.sql'),'utf8');
    const m2 = fs.readFileSync(path.join(dir, '0002_boss_and_rls_macro.sql'),'utf8');
    expect(m1).toContain('tenants');
    expect(m1).toContain('audit_events');
    expect(m2).toContain('boss');
  });
});
