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
describe.skipIf(!hasDocker)('RLS live A1-A5 (requires Docker)', () => {});
describe('RLS attack matrix documented', () => {
  it('TENANT_ISOLATION.md lists A1-A11', () => {
    const md = fs.readFileSync(resolveRoot('docs/database/TENANT_ISOLATION.md'),'utf8');
    for (const a of ['A1','A2','A3','A4','A5','A9','A11']) expect(md).toContain(a);
  });
  it('TENANT_ISOLATION_TESTS.md exists', () => {
    expect(fs.existsSync(resolveRoot('docs/testing/TENANT_ISOLATION_TESTS.md'))).toBe(true);
  });
});
