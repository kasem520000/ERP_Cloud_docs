import { Controller, Get, Post, Param, Query, Body, Req, Headers } from '@nestjs/common';
import { RequirePermissions } from '../../identity/infrastructure/rbac.decorator.js';
import { createItem, listItems } from '../application/item-service.js';

@Controller('api/v1/items/items')
export class ItemsController {
  @Get()
  @RequirePermissions('items.view')
  async list(@Req() req: { tenantId: string }, @Query('kind') kind?: string, @Query('q') q?: string, @Query('cursor') cursor?: string): Promise<unknown> {
    return listItems(req.tenantId, { kind, q, cursor });
  }
  @Post()
  @RequirePermissions('items.create')
  async create(@Req() req: { tenantId: string }, @Body() body: { sku?: string; name: string; nameAr?: string; kind: string; uomId: string; categoryId?: string; taxCodeId?: string; costingMethod?: string; barcodes?: { code: string }[] }, @Headers('idempotency-key') _ik?: string): Promise<unknown> {
    return createItem(req.tenantId, { sku: body.sku, name: body.name, nameAr: body.nameAr, kind: body.kind as never, uomId: body.uomId, categoryId: body.categoryId, taxCodeId: body.taxCodeId, costingMethod: body.costingMethod as never, barcodes: body.barcodes });
  }
  @Get(':id')
  @RequirePermissions('items.view')
  async get(@Req() req: { tenantId: string }, @Param('id') id: string): Promise<unknown> {
    const { getPool } = await import('../../../infra/db/db.js');
    const pool = getPool();
    const r = await pool.query(`SELECT id, sku, name, name_ar, kind, uom_id, category_id, tax_code_id, status, version FROM items WHERE id=$1 AND tenant_id=$2`, [id, req.tenantId]);
    if (r.rows.length === 0) throw Object.assign(new Error('not_found'), { status: 404 });
    return r.rows[0];
  }
}
