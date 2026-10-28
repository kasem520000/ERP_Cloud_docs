import { Module, MiddlewareConsumer } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { FilesModule } from './modules/files/files.module.js';
import { JobsModule } from './infra/jobs/jobs.module.js';
import { RequestIdMiddleware } from './infra/observability/request-id.middleware.js';

@Module({
  imports: [HealthModule, AuditModule, FilesModule, JobsModule],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
