import { Controller, Get } from '@nestjs/common';
import { getPool } from '../infra/db/db.js';
import { JobsService } from '../infra/jobs/jobs.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly jobs: JobsService) {}

  @Get('live')
  live(): { status: string; build: { version: string; timestamp: string } } {
    return {
      status: 'ok',
      build: { version: '0.1.0-phase-002', timestamp: new Date().toISOString() },
    };
  }

  @Get('ready')
  async ready(): Promise<{ status: string; checks: Record<string, { ok: boolean; error?: string }> }> {
    const checks: Record<string, { ok: boolean; error?: string }> = {};
    try {
      const pool = getPool();
      await pool.query('SELECT 1');
      try {
        const res = (await pool.query('SELECT count(*)::int as c FROM _migrations')) as { rows: { c: number }[] };
        if (!res.rows[0] || res.rows[0].c < 1) throw new Error('no migrations applied');
        checks.db = { ok: true };
      } catch (e) {
        checks.db = { ok: false, error: (e as Error).message };
      }
    } catch (e) {
      checks.db = { ok: false, error: (e as Error).message };
    }
    try {
      const healthy = await this.jobs.isHealthy();
      checks.queue = { ok: healthy };
    } catch (e) {
      checks.queue = { ok: false, error: (e as Error).message };
    }
    const allOk = Object.values(checks).every(co => co.ok);
    return { status: allOk ? 'ok' : 'degraded', checks };
  }
}
