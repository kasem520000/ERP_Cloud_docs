import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import PgBoss from 'pg-boss';

export type JobOptions = {
  id?: string;
  retryLimit?: number;
  retryDelay?: number;
  expireInHours?: number;
};

@Injectable()
export class JobsService implements OnModuleInit {
  private boss: PgBoss | undefined;
  private readonly logger = new Logger(JobsService.name);
  private started = false;

  async onModuleInit(): Promise<void> {
    if (process.env.WORKER_MODE === '1') await this.start();
  }

  async start(): Promise<void> {
    const connectionString = process.env.DATABASE_URL || 'postgresql://erp_app:erp_app@localhost:5432/erp_dev';
    this.boss = new PgBoss({ connectionString, schema: 'boss' });
    this.boss.on('error', (err: Error) => this.logger.error('pg-boss error', err.stack ?? String(err)));
    await this.boss.start();
    this.started = true;
    this.logger.log('pg-boss started (schema: boss)');
  }

  async stop(): Promise<void> {
    if (this.boss && this.started) {
      await this.boss.stop({ graceful: true });
      this.started = false;
    }
  }

  isStarted(): boolean { return this.started; }

  async publish<T extends object>(queue: string, data: T, opts: JobOptions = {}): Promise<string | null> {
    if (!this.boss) {
      const connectionString = process.env.DATABASE_URL || 'postgresql://erp_app:erp_app@localhost:5432/erp_dev';
      this.boss = new PgBoss({ connectionString, schema: 'boss' });
      await this.boss.start();
      this.started = true;
    }
    const publishResult = await this.boss.publish(queue, data as object, {
      id: opts.id,
      retryLimit: opts.retryLimit ?? 3,
      retryDelay: opts.retryDelay ?? 30,
      expireInHours: opts.expireInHours ?? 24,
    });
    return (publishResult as unknown as string | null) ?? null;
  }

  async subscribe<T>(queue: string, handler: (job: { id: string; data: T }) => Promise<void>): Promise<string> {
    if (!this.boss) throw new Error('JobsService not started — call start() first');
    return this.boss.work<T>(queue, async (jobs: PgBoss.Job<T>[]) => {
      for (const job of jobs) await handler({ id: job.id, data: job.data });
    });
  }

  isHealthy(): Promise<boolean> {
    return Promise.resolve(this.boss ? this.started : true);
  }
}
