import { Controller, Get, Post, Param, Query, Req } from '@nestjs/common';
import { getPool } from '../../../../infra/db/db.js';
import { RequirePermissions } from '../../../identity/infrastructure/rbac.decorator.js';
import { suspendTenant, restoreTenant } from '../../application/lifecycle-service.js';
import crypto from 'node:crypto';
@Controller('platform/tenants')
export class PlatformTenantsController {
  @Get()
  @RequirePermissions('platform.tenants.view')
  async list(@Query('q') q?: string, @Query('cursor') _cursor?: string): Promise<{ items: unknown[]; nextCursor?: string }> {
    const pool = getPool();
    // PlatformScope: set GUC internal
    await pool.query(`SELECT set_config('erp.platform_scope','internal',true)`);
    const res = await pool.query(`SELECT id, name, status, country_code, base_currency FROM tenants WHERE ($1::text IS NULL OR name ILIKE '%'||$1||'%') ORDER BY created_at DESC LIMIT 50`, [q ?? null]);
    // audit per-use
    await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$3,'platform.tenants.viewed','tenant',$2,$4)`, [crypto.randomUUID(), '00000000-0000-0000-0000-000000000000', null, JSON.stringify({ q, via_platform_admin: true })]);
    return { items: res.rows };
  }
  @Post(':id/suspend')
  @RequirePermissions('platform.tenants.suspend')
  async suspend(@Param('id') id: string, @Req() req: { userId?: string }, @Query('reason') reason?: string): Promise<{ ok: boolean }> {
    await suspendTenant(id, req.userId ?? '00000000-0000-0000-0000-000000000000', reason ?? 'admin');
    return { ok: true };
  }
  @Post(':id/restore')
  @RequirePermissions('platform.tenants.restore')
  async restore(@Param('id') id: string, @Req() req: { userId?: string }): Promise<{ ok: boolean }> {
    await restoreTenant(id, req.userId ?? '00000000-0000-0000-0000-000000000000');
    return { ok: true };
  }
}
