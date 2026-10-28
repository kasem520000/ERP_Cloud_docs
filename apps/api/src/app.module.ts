import { Module, MiddlewareConsumer } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { FilesModule } from './modules/files/files.module.js';
import { JobsModule } from './infra/jobs/jobs.module.js';
import { RequestIdMiddleware } from './infra/observability/request-id.middleware.js';
import { TenancyModule } from './modules/tenancy/tenancy.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { PartnersModule } from './modules/partners/partners.module.js';
import { ItemsModule } from './modules/items/items.module.js';

@Module({
  imports: [HealthModule, AuditModule, FilesModule, JobsModule, TenancyModule, IdentityModule, PartnersModule, ItemsModule],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
