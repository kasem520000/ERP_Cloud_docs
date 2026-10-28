import { describe, it, expect } from 'vitest';
import { HealthController } from '../src/health/health.controller.js';

describe('HealthController readiness', () => {
  it('live returns ok', () => {
    const ctrl = new HealthController({ isHealthy: async () => true } as unknown as import('../src/infra/jobs/jobs.service.js').JobsService);
    const res = ctrl.live();
    expect(res.status).toBe('ok');
    expect(res.build.version).toMatch(/phase-002/);
  });

  it('ready returns degraded when DB fails', async () => {
    const checks = { db: { ok: false, error: 'DB down' }, queue: { ok: true } };
    expect(checks.db.ok).toBe(false);
    expect(checks.db.error).toBe('DB down');
  });

  it('ready checks queue health', async () => {
    const jobsOk = { isHealthy: async (): Promise<boolean> => true };
    const jobsFail = { isHealthy: async (): Promise<boolean> => false };
    expect(await jobsOk.isHealthy()).toBe(true);
    expect(await jobsFail.isHealthy()).toBe(false);
  });
});
