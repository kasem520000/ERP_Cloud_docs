import { Controller, Post, Body, Req } from '@nestjs/common';
import { RequirePermissions } from '../../identity/infrastructure/rbac.decorator.js';
import { checkCredit } from '../application/credit-check-service.js';

@Controller('api/v1/partners/credit-check')
export class CreditCheckController {
  @Post()
  @RequirePermissions('partners.view')
  async check(@Req() req: { tenantId: string }, @Body() body: { partnerId: string; amountDelta: string }): Promise<unknown> {
    return checkCredit(req.tenantId, body.partnerId, body.amountDelta);
  }
}
