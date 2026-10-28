import { Controller, Get, Query } from '@nestjs/common';
import { getPool } from '../../../../infra/db/db.js';
import { RequirePermissions } from '../../../identity/infrastructure/rbac.decorator.js';
@Controller('platform/audit')
export class PlatformAuditController {
  @Get('events')
  @RequirePermissions('platform.audit.view')
  async list(@Query('tenantId') tenantId?: string): Promise<{ items: unknown[] }> {
    const pool = getPool();
    await pool.query(`SELECT set_config('erp.platform_scope','internal',true)`);
    const res = tenantId
      ? await pool.query(`SELECT * FROM audit_events WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 100`, [tenantId])
      : await pool.query(`SELECT * FROM audit_events ORDER BY created_at DESC LIMIT 100`);
    return { items: res.rows };
  }
}
