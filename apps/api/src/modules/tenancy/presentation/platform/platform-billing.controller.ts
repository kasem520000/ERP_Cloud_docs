import { Controller, Post, Body, Param, Headers } from '@nestjs/common';
import { createCheckoutSession, recordManualPayment } from '../../application/billing-service.js';
import { handleWebhook, suspendFromGrace, restoreFromSuspend } from '../../application/subscription-lifecycle.js';
@Controller('api/v1/platform/billing')
export class PlatformBillingController {
  @Post('checkout-session') async checkout(@Body() b:{tenantId:string; planKey:string}){ return createCheckoutSession(b.tenantId, b.planKey); }
  @Post('webhook') async webhook(@Body() b:{eventId:string; tenantId:string; planKey:string}, @Headers('x-signature') sig?:string){ return handleWebhook(b.eventId, b.tenantId, b.planKey, sig==='valid'); }
  @Post('manual-payment') async manual(@Body() b:{tenantId:string; actorId:string; amount:string; method:string; reason:string}){ return recordManualPayment(b.tenantId, b.actorId, b.amount, b.method, b.reason); }
  @Post(':tenantId/suspend') async suspend(@Param('tenantId') tid:string, @Body() b:{actorId:string; reason:string}){ await suspendFromGrace(tid, b.reason); return {ok:true}; }
  @Post(':tenantId/restore') async restore(@Param('tenantId') tid:string){ await restoreFromSuspend(tid); return {ok:true}; }
}
