import { Controller, Post, Body, Req } from '@nestjs/common';
import { RequirePermissions } from '../../identity/infrastructure/rbac.decorator.js';
import { resolvePrice } from '../application/pricing-service.js';

@Controller('api/v1/items/resolve-price')
export class PricingController {
  @Post()
  @RequirePermissions('items.view')
  async resolve(@Req() req: { tenantId: string }, @Body() body: { partnerId: string; itemId: string; branchId?: string; uomId: string; qty?: string }): Promise<unknown> {
    return resolvePrice({ tenantId: req.tenantId, partnerId: body.partnerId, itemId: body.itemId, branchId: body.branchId, uomId: body.uomId, qty: body.qty });
  }
}
