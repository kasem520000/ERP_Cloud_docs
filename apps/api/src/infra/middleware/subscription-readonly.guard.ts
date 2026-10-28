import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { enforceNotReadOnly } from '../../modules/tenancy/application/subscription-lifecycle.js';

// Read-only grace: POST/PUT/PATCH/DELETE → 403 subscription_read_only with resolving action; GET/HEAD/OPTIONS pass; exports/print/reports pass per spec
const READ_ONLY_BLOCKED = new Set(['POST','PUT','PATCH','DELETE']);

@Injectable()
export class SubscriptionReadOnlyGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req=ctx.switchToHttp().getRequest<{method:string; tenantId?:string; headers:Record<string,string>}>();
    if(!READ_ONLY_BLOCKED.has(req.method)) return true;
    // allow exports/print/reports even in grace (they are GET anyway, but extra safety for POST exports)
    const url=(req as unknown as {url?:string}).url ?? '';
    if(url.includes('/exports') || url.includes('/print') || url.includes('/reports')) return true;
    const tenantId=req.tenantId ?? req.headers['x-tenant-id'];
    if(!tenantId) return true; // public routes
    await enforceNotReadOnly(String(tenantId));
    return true;
  }
}
