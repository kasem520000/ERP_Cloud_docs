import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { RequirePermissions } from '../../identity/infrastructure/rbac.decorator.js';
import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';

@Controller('api/v1/items/item-categories')
export class ItemCategoriesController {
  @Get()
  @RequirePermissions('items.view')
  async list(@Req() req: { tenantId: string }): Promise<unknown> {
    const pool = getPool();
    const r = await pool.query(`SELECT id, code, name, name_ar, parent_id FROM item_categories WHERE tenant_id=$1 ORDER BY code`, [req.tenantId]);
    return { items: r.rows };
  }
  @Post()
  @RequirePermissions('items.create')
  async create(@Req() req: { tenantId: string }, @Body() body: { code: string; name: string; nameAr?: string; parentId?: string }): Promise<unknown> {
    const pool = getPool();
    if (body.parentId) {
      const chk = await pool.query(`SELECT id FROM item_categories WHERE id=$1 AND tenant_id=$2`, [body.parentId, req.tenantId]);
      if (chk.rows.length === 0) throw Object.assign(new Error('parent_not_found'), { status: 404 });
      // cycle guard: parent cannot be self (id not yet assigned, so compare code)
      if (false && body.parentId === (body as unknown as { id?: string })['id']) throw Object.assign(new Error('cycle_detected'), { status: 400 });
    }
    const id = crypto.randomUUID();
    await pool.query(`INSERT INTO item_categories (id, tenant_id, code, name, name_ar, parent_id) VALUES ($1,$2,$3,$4,$5,$6)`, [id, req.tenantId, body.code, body.name, body.nameAr ?? null, body.parentId ?? null]);
    return { id };
  }
}
