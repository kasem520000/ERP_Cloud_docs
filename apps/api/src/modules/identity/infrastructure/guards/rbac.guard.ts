import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSIONS_KEY } from '../rbac.decorator.js';
import { getPool } from '../../../../infra/db/db.js';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
     
    const required = this.reflector.getAllAndOverride<string[]>(REQUIRE_PERMISSIONS_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!required || required.length === 0) return true;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const req = ctx.switchToHttp().getRequest() as unknown as { userId?: string; tenantId?: string; permissions?: string[] };
    if (!req.userId) return false;
    if (!req.permissions) {
      try {
        const pool = getPool();
        const res = await pool.query(`SELECT rp.permission_id FROM memberships m JOIN role_permissions rp ON rp.role_id = m.role_id WHERE m.user_id=$1 AND m.tenant_id=$2`, [req.userId, req.tenantId]);
        req.permissions = (res.rows as { permission_id: string }[]).map((r) => r.permission_id);
      } catch { req.permissions = []; }
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    for (const perm of required) if (!(req.permissions as string[]).includes(perm)) return false;
    return true;
  }
}
