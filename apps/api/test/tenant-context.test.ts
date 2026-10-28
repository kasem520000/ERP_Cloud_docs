import { describe, it, expect } from 'vitest';
import { tenantContextStorage, getTenantContext, runWithTenant, MissingTenantContextError } from '../src/infra/db/tenant-context.js';

describe('tenant-context', () => {
  it('throws without context', () => {
    expect(() => getTenantContext()).toThrow(MissingTenantContextError);
  });

  it('returns context inside runWithTenant', async () => {
    const ctx = { tenantId: '0192a6a0-1234-7000-8123-456789abc012', correlationId: 'test-corr' };
    await runWithTenant(ctx, async () => {
      expect(getTenantContext().tenantId).toBe(ctx.tenantId);
      expect(getTenantContext().correlationId).toBe('test-corr');
    });
  });

  it('is isolated across async boundaries', async () => {
    const ctxA = { tenantId: 'aaaaaaaa-aaaa-7000-8aaa-aaaaaaaaaaaa' };
    const ctxB = { tenantId: 'bbbbbbbb-bbbb-7000-8bbb-bbbbbbbbbbbb' };
    let seenA: string | undefined;
    let seenB: string | undefined;
    await Promise.all([
      runWithTenant(ctxA, async () => {
        await new Promise(r => setTimeout(r, 5));
        seenA = getTenantContext().tenantId;
      }),
      runWithTenant(ctxB, async () => {
        await new Promise(r => setTimeout(r, 2));
        seenB = getTenantContext().tenantId;
      }),
    ]);
    expect(seenA).toBe(ctxA.tenantId);
    expect(seenB).toBe(ctxB.tenantId);
  });

  it('restores previous context after nested run', async () => {
    const outer = { tenantId: 'outer-0000-0000-7000-8aaa-aaaaaaaaaaaa' };
    const inner = { tenantId: 'inner-1111-1111-7000-8bbb-bbbbbbbbbbbb' };
    await runWithTenant(outer, async () => {
      expect(getTenantContext().tenantId).toBe(outer.tenantId);
      await runWithTenant(inner, async () => {
        expect(getTenantContext().tenantId).toBe(inner.tenantId);
      });
      expect(getTenantContext().tenantId).toBe(outer.tenantId);
    });
  });

  it('is empty after run completes', async () => {
    await runWithTenant({ tenantId: 'x-0000-0000-7000-8aaa-aaaaaaaaaaaa' }, async () => {});
    expect(() => getTenantContext()).toThrow();
  });

  it('storage is AsyncLocalStorage instance', () => {
    expect(tenantContextStorage).toBeDefined();
  });
});
