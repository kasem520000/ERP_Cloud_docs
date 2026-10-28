import { describe, it, expect } from 'vitest';
import { HealthController } from '../src/health/health.controller.js';

describe('HealthController', () => {
  it('GET /health/live returns ok', () => {
    const ctrl = new HealthController({ isHealthy: async () => true } as unknown as import('../src/infra/jobs/jobs.service.js').JobsService);
    const result = ctrl.live();
    expect(result.status).toBe('ok');
    expect(result.build.version).toMatch(/0\.1\.0-phase-00/);
    expect(typeof result.build.timestamp).toBe('string');
  });
});
