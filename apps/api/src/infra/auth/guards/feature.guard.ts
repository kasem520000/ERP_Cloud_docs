import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_FEATURE_KEY } from '../require-feature.js';
import { hasFeature } from '../../../modules/tenancy/application/entitlements-service.js';
@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const feature = this.reflector.getAllAndOverride(REQUIRE_FEATURE_KEY, [ctx.getHandler(), ctx.getClass()]) as unknown as string;
    if (!feature) return true;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const req = ctx.switchToHttp().getRequest() as unknown as { tenantId?: string };
    if (!req.tenantId) return false;
    try { return await hasFeature(req.tenantId, feature); } catch { return false; }
  }
}
