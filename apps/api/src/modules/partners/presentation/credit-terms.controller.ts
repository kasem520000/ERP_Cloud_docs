import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { RequirePermissions } from '../../identity/infrastructure/rbac.decorator.js';
import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';

@Controller('api/v1/partners/credit-terms')
export class CreditTermsController {
  @Get()
  @RequirePermissions('partners.view')
  async list(@Req() req: { tenantId: string }): Promise<unknown> {
    const pool = getPool();
    const r = await pool.query(`SELECT id, code, name, name_ar, days FROM credit_terms WHERE tenant_id=$1 ORDER BY code`, [req.tenantId]);
    return { items: r.rows };
  }
  @Post()
  @RequirePermissions('partners.credit_terms.manage')
  async create(@Req() req: { tenantId: string }, @Body() body: { code: string; name: string; days: number }): Promise<unknown> {
    const pool = getPool();
    const id = crypto.randomUUID();
    await pool.query(`INSERT INTO credit_terms (id, tenant_id, code, name, days) VALUES ($1,$2,$3,$4,$5)`, [id, req.tenantId, body.code, body.name, body.days]);
    await pool.query(`INSERT INTO audit_events (id, tenant_id, action, entity_type, entity_id, before, after) VALUES ($1,$2,'credit_terms.created','credit_term',$3,$4,$5)`,
      [crypto.randomUUID(), req.tenantId, id, null, JSON.stringify(body)]);
    return { id };
  }
}
