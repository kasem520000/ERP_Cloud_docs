import { Controller, Get, Post, Body, Query, Req } from '@nestjs/common';
import { RequirePermissions } from '../../identity/infrastructure/rbac.decorator.js';
import { createOpeningDraft, listOpeningDrafts } from '../application/opening-balances-service.js';

@Controller('api/v1/partners/opening-balances')
export class OpeningBalancesController {
  @Get()
  @RequirePermissions('partners.view')
  async list(@Req() req: { tenantId: string }, @Query('kind') kind?: string): Promise<unknown> {
    return { items: await listOpeningDrafts(req.tenantId, { kind }) };
  }
  @Post()
  @RequirePermissions('partners.create')
  async create(@Req() req: { tenantId: string }, @Body() body: { kind: string; partnerId?: string; accountId?: string; itemId?: string; amount: string; currency?: string }): Promise<unknown> {
    return createOpeningDraft(req.tenantId, { kind: body.kind as never, partnerId: body.partnerId, accountId: body.accountId, itemId: body.itemId, amount: body.amount, currency: body.currency });
  }
}
