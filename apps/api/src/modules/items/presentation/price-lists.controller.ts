import { Controller, Get, Post, Param, Body, Req } from '@nestjs/common';
import { RequirePermissions } from '../../identity/infrastructure/rbac.decorator.js';
import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';

@Controller('api/v1/items/price-lists')
export class PriceListsController {
  @Get()
  @RequirePermissions('items.view')
  async list(@Req() req: { tenantId: string }): Promise<unknown> {
    const pool = getPool();
    const r = await pool.query(`SELECT id, code, name, currency, kind FROM price_lists WHERE tenant_id=$1 ORDER BY code`, [req.tenantId]);
    return { items: r.rows };
  }
  @Post()
  @RequirePermissions('items.price_lists.manage')
  async create(@Req() req: { tenantId: string }, @Body() body: { code: string; name: string; currency?: string; kind: string }): Promise<unknown> {
    const pool = getPool();
    const id = crypto.randomUUID();
    await pool.query(`INSERT INTO price_lists (id, tenant_id, code, name, currency, kind) VALUES ($1,$2,$3,$4,$5,$6)`, [id, req.tenantId, body.code, body.name, body.currency ?? 'SAR', body.kind]);
    return { id };
  }
  @Post(':id/items')
  @RequirePermissions('items.price_lists.manage')
  async addItem(@Req() req: { tenantId: string }, @Param('id') id: string, @Body() body: { itemId: string; uomId: string; unitPrice: string; minQty?: string }): Promise<unknown> {
    if (!/^\d{1,15}(\.\d{1,6})?$/.test(body.unitPrice)) throw Object.assign(new Error('invalid_price'), { status: 400 });
    const pool = getPool();
    const pid = crypto.randomUUID();
    await pool.query(`INSERT INTO price_list_items (id, tenant_id, price_list_id, item_id, uom_id, unit_price, min_qty) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [pid, req.tenantId, id, body.itemId, body.uomId, body.unitPrice, body.minQty ?? '1']);
    return { id: pid };
  }
}
