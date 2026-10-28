import { Controller, Get, Post, Param, Body, Req } from '@nestjs/common';
import { RequirePermissions } from '../../identity/infrastructure/rbac.decorator.js';
import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';

@Controller('api/v1/partners/partners/:partnerId/contacts')
export class PartnersContactsController {
  @Get()
  @RequirePermissions('partners.view')
  async list(@Req() req: { tenantId: string }, @Param('partnerId') partnerId: string): Promise<unknown> {
    const pool = getPool();
    const r = await pool.query(`SELECT id, name, phone, email, role FROM partner_contacts WHERE partner_id=$1 AND tenant_id=$2`, [partnerId, req.tenantId]);
    return { items: r.rows };
  }
  @Post()
  @RequirePermissions('partners.update')
  async create(@Req() req: { tenantId: string }, @Param('partnerId') partnerId: string, @Body() body: { name: string; phone?: string; email?: string; role?: string }): Promise<unknown> {
    const pool = getPool();
    const chk = await pool.query(`SELECT id FROM partners WHERE id=$1 AND tenant_id=$2`, [partnerId, req.tenantId]);
    if (chk.rows.length === 0) throw Object.assign(new Error('partner_not_found'), { status: 404 });
    const id = crypto.randomUUID();
    await pool.query(`INSERT INTO partner_contacts (id, tenant_id, partner_id, name, phone, email, role) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [id, req.tenantId, partnerId, body.name, body.phone ?? null, body.email ?? null, body.role ?? null]);
    return { id };
  }
}
