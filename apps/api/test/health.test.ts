import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { HealthController } from '../src/health/health.controller.js';

describe('HealthController', () => {
  it('GET /health/live returns ok', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    const controller = moduleRef.get(HealthController);
    const result = controller.live();
    expect(result.status).toBe('ok');
    expect(result.build.version).toBe('0.1.0-phase-001');
    expect(typeof result.build.timestamp).toBe('string');
  });
});
