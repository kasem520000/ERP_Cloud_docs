import { Module } from '@nestjs/common';
import { RegistrationController } from './presentation/public/registration.controller.js';
import { PlatformTenantsController } from './presentation/platform/platform-tenants.controller.js';
import { PlatformAuditController } from './presentation/platform/platform-audit.controller.js';
import { PlatformBillingController } from './presentation/platform/platform-billing.controller.js';
import { PublicPlansController } from './presentation/public/plans.controller.js';
@Module({ controllers: [RegistrationController, PlatformTenantsController, PlatformAuditController, PlatformBillingController, PublicPlansController] })
export class TenancyModule {}
