import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";

import { HealthController } from "./health/health.controller";
import { ReadinessService } from "./health/readiness.service";
import { InfrastructureModule } from "./infra/infra.module";
import { RequestIdMiddleware } from "./infra/observability/request-id.middleware";
import { SessionMiddleware } from "./infra/auth/session.middleware";
import { PermissionsGuard } from "./infra/auth/permissions.guard";
import { TenantContextInterceptor } from "./infra/context/tenant-context.interceptor";
import { ErrorModelFilter } from "./infra/http/error.filter";
import { IdempotencyKeyGuard } from "./infra/http/idempotency.guard";
import { AuditModule } from "./modules/audit/audit.module";
import { FilesModule } from "./modules/files/files.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ConfigurationModule } from "./modules/configuration/configuration.module";
import { TenancyModule } from "./modules/tenancy/tenancy.module";
import { AuditEventsController } from "./modules/audit/presentation/audit-events.controller";
import { FeatureEntitlementsGuard } from "./infra/auth/feature-entitlements.guard";

/**
 * PHASE-004 module graph: PHASE-002 infrastructure (db + jobs + audit +
 * files) + the PHASE-003 identity trust substrate + the PHASE-004
 * configuration skeleton (feature catalog, settings schema, §9 events) +
 * the tenancy module (registration, onboarding, branches, entitlements,
 * lifecycle, support access, platform console). Global plumbing adds the
 * FeatureEntitlementsGuard (BR-039) after the permission guard, and the
 * tenant-context interceptor now routes @PlatformScope() handlers into
 * the platform GUC envelope.
 */
@Module({
  imports: [
    InfrastructureModule,
    AuditModule,
    FilesModule,
    IdentityModule,
    NotificationsModule,
    ConfigurationModule,
    TenancyModule,
  ],
  controllers: [HealthController, AuditEventsController],
  providers: [
    ReadinessService,
    { provide: APP_FILTER, useClass: ErrorModelFilter },
    { provide: APP_GUARD, useClass: IdempotencyKeyGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: FeatureEntitlementsGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("*").apply(SessionMiddleware).forRoutes("*");
  }
}
