import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, Headers } from '@nestjs/common';
import { RequirePermissions } from '../../identity/infrastructure/rbac.decorator.js';
import { createPartner, listPartners, updatePartner, archivePartner } from '../application/partner-service.js';

@Controller('api/v1/partners/partners')
export class PartnersController {
  @Get()
  @RequirePermissions('partners.view')
  async list(@Req() req: { tenantId: string }, @Query('kind') kind?: string, @Query('q') q?: string, @Query('cursor') cursor?: string, @Query('limit') limit?: string): Promise<unknown> {
    return listPartners(req.tenantId, { kind, q, cursor, limit: limit ? Number(limit) : undefined });
  }

  @Post()
  @RequirePermissions('partners.create')
  async create(@Req() req: { tenantId: string }, @Body() body: { kind: string; code?: string; name: string; nameAr?: string; taxNumber?: string; creditLimit?: string; creditTermsId?: string; priceListId?: string }, @Headers('idempotency-key') _ik?: string): Promise<unknown> {
    return createPartner(req.tenantId, { kind: body.kind as never, code: body.code, name: body.name, nameAr: body.nameAr, taxNumber: body.taxNumber, creditLimit: body.creditLimit, creditTermsId: body.creditTermsId, priceListId: body.priceListId });
  }

  @Get(':id')
  @RequirePermissions('partners.view')
  async get(@Req() req: { tenantId: string }, @Param('id') id: string): Promise<unknown> {
    const { getPool } = await import('../../../infra/db/db.js');
    const pool = getPool();
    const r = await pool.query(`SELECT id, kind, code, name, name_ar, tax_number, credit_limit, status, version FROM partners WHERE id=$1 AND tenant_id=$2`, [id, req.tenantId]);
    if (r.rows.length === 0) throw Object.assign(new Error('not_found'), { status: 404 });
    return r.rows[0];
  }

  @Patch(':id')
  @RequirePermissions('partners.update')
  async update(@Req() req: { tenantId: string }, @Param('id') id: string, @Body() body: Record<string, unknown>, @Headers('if-match') ifMatch?: string): Promise<unknown> {
    const version = ifMatch ? Number(ifMatch.replace(/"/g, '')) : (body['version'] as number | undefined);
    const patch = body as Record<string, unknown>; (patch as Record<string, unknown>)['version'] = version; await updatePartner(req.tenantId, id, patch as never);
    return { ok: true };
  }

  @Delete(':id')
  @RequirePermissions('partners.archive')
  async archive(@Req() req: { tenantId: string }, @Param('id') id: string): Promise<unknown> {
    await archivePartner(req.tenantId, id);
    return { ok: true };
  }
}
