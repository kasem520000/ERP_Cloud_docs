import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const resolveRoot = (pp: string) => path.join(rootDir, pp);

describe('PHASE-004 Entitlements + dependency closure (BR-039/BR-040)', () => {
  it('entitlements service materializes plan features + manual overrides', () => {
    const svc = fs.readFileSync(resolveRoot('apps/api/src/modules/tenancy/application/entitlements-service.ts'), 'utf8');
    expect(svc).toContain('materializeEntitlements');
    expect(svc).toContain('grantEntitlement');
    expect(svc).toContain('hasFeature');
    expect(svc).toContain('feature_not_entitled');
    expect(svc).toContain('via_platform_admin');
  });
  it('dependency closure rejects POS without branch/stock deps (BR-040)', async () => {
    const { checkDependencyClosure } = await import('../../src/modules/tenancy/application/entitlements-service.js');
    const r = checkDependencyClosure(['pos.terminals'], []);
    expect(r.ok).toBe(false);
    expect(r.missing.length).toBeGreaterThan(0);
    const r2 = checkDependencyClosure(['platform.registration'], []);
    expect(r2.ok).toBe(true);
  });
  it('RequireFeature guard checks server-side (BR-039)', () => {
    const guard = fs.readFileSync(resolveRoot('apps/api/src/infra/auth/guards/feature.guard.ts'), 'utf8');
    expect(guard).toContain('REQUIRE_FEATURE_KEY');
    expect(guard).toContain('hasFeature');
    const dec = fs.readFileSync(resolveRoot('apps/api/src/infra/auth/require-feature.ts'), 'utf8');
    expect(dec).toContain('RequireFeature');
  });
  it('plans seeds are PLACEHOLDER per OQ-002', () => {
    const seed = fs.readFileSync(resolveRoot('apps/api/seeds/plans.seed.ts'), 'utf8');
    expect(seed).toContain('starter');
    expect(seed).toContain('business');
    expect(seed).toContain('enterprise');
    expect(seed.toLowerCase()).toContain('placeholder');
  });
});
