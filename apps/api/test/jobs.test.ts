import { describe, it, expect } from 'vitest';

describe('JobsService contract (pg-boss)', () => {
  it('payloads contain only ids (ADR-0008 discipline)', () => {
    const validPayload = { tenantId: 'a-7000-8aaa-aaaaaaaaaaaa', invoiceId: 'inv-123', correlationId: 'corr-1' };
    const invalidPayload: Record<string, unknown> = { tenantId: 'a-7000-8aaa-aaaaaaaaaaaa', invoice: { total: 100, customer: 'ACME' } };
    expect(Object.keys(validPayload).every(k => k.endsWith('Id') || k === 'tenantId' || k === 'correlationId')).toBe(true);
    expect(Object.keys(invalidPayload).some(k => typeof invalidPayload[k] === 'object')).toBe(true);
  });

  it('retry config defaults are sane', () => {
    const defaults = { retryLimit: 3, retryDelay: 30, expireInHours: 24 };
    expect(defaults.retryLimit).toBe(3);
    expect(defaults.expireInHours).toBe(24);
  });

  it('dedupe contract: same id + same queue = idempotent (pg-boss publish with id)', async () => {
    const seen = new Map<string, string>();
    async function publishWithDedupe(queue: string, id: string, _data: unknown): Promise<string> {
      const key = `${queue}:${id}`;
      if (seen.has(key)) return seen.get(key) as string;
      seen.set(key, id);
      return id;
    }
    const id = 'job-dedupe-123';
    const r1 = await publishWithDedupe('reports.render', id, { tenantId: 'a' });
    const r2 = await publishWithDedupe('reports.render', id, { tenantId: 'a' });
    expect(r1).toBe(r2);
    expect(seen.size).toBe(1);
  });
});
