import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { RequirePermissions } from '../../identity/infrastructure/rbac.decorator.js';
import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';

@Controller('api/v1/items/uoms')
export class UomsController {
  @Get()
  @RequirePermissions('items.view')
  async list(@Req() req: { tenantId: string }): Promise<unknown> {
    const pool = getPool();
    const r = await pool.query(`SELECT id, code, name, name_ar FROM uoms WHERE tenant_id IS NULL OR tenant_id=$1 ORDER BY code`, [req.tenantId]);
    return { items: r.rows };
  }
  @Post()
  @RequirePermissions('items.create')
  async create(@Req() req: { tenantId: string }, @Body() body: { code: string; name: string; nameAr?: string }): Promise<unknown> {
    const pool = getPool();
    const id = crypto.randomUUID();
    await pool.query(`INSERT INTO uoms (id, tenant_id, code, name, name_ar) VALUES ($1,$2,$3,$4,$5)`, [id, req.tenantId, body.code, body.name, body.nameAr ?? null]);
    return { id };
  }
}

@Controller('api/v1/items/uom-conversions')
export class UomConversionsController {
  @Post()
  @RequirePermissions('items.create')
  async create(@Req() req: { tenantId: string }, @Body() body: { fromUomId: string; toUomId: string; factor: string }): Promise<unknown> {
    const { validateFactor } = await import('../application/uom-service.js');
    validateFactor(body.factor);
    const pool = getPool();
    const id = crypto.randomUUID();
    await pool.query(`INSERT INTO uom_conversions (id, tenant_id, from_uom_id, to_uom_id, factor) VALUES ($1,$2,$3,$4,$5)`, [id, req.tenantId, body.fromUomId, body.toUomId, body.factor]);
    return { id };
  }
}
