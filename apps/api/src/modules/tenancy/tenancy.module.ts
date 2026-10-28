import { Module } from '@nestjs/common';
import { RegistrationController } from './presentation/public/registration.controller.js';
import { PlatformTenantsController } from './presentation/platform/platform-tenants.controller.js';
import { PlatformAuditController } from './presentation/platform/platform-audit.controller.js';
@Module({ controllers: [RegistrationController, PlatformTenantsController, PlatformAuditController] })
export class TenancyModule {}
