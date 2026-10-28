import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { createQuotation, sendQuotation, acceptQuotation, convertQuotation } from '../application/quotations.js';
import { createSalesOrder, approveSalesOrder } from '../application/orders.js';
import { createDeliveryNote, postDeliveryNote, convertToInvoice } from '../application/deliveries.js';
import { createSalesInvoice, approveSalesInvoice, postSalesInvoice } from '../application/invoices.js';
import { createCreditNote, postCreditNote } from '../application/credit-notes.js';
import { createReceipt, postReceipt } from '../application/receipts.js';
import { getAging, getCustomerStatement, reconcileAr } from '../application/ar-queries.js';
import { suggestFifo, reallocateReceipt } from '../application/allocations.js';
import { createSalesRep, listReps } from '../application/reps.js';

@Controller('api/v1/sales')
export class SalesController {
  @Post('quotations') async cQ(@Body() b:{tenantId:string; branchId:string; customerId:string; lines:{itemId:string; qty:string; unitPrice:string}[]}){ return createQuotation(b.tenantId,b.branchId,b.customerId,b.lines); }
  @Post('quotations/:id/send') async sQ(@Param('id') id:string, @Body() b:{tenantId:string}){ await sendQuotation(b.tenantId,id); return {ok:true}; }
  @Post('quotations/:id/accept') async aQ(@Param('id') id:string, @Body() b:{tenantId:string}){ await acceptQuotation(b.tenantId,id); return {ok:true}; }
  @Post('quotations/:id/convert') async convQ(@Param('id') id:string, @Body() b:{tenantId:string}){ return convertQuotation(b.tenantId,id); }
  @Post('orders') async cO(@Body() b:{tenantId:string; branchId:string; customerId:string; warehouseId:string; lines:{itemId:string; qty:string; unitPrice:string}[]; repId?:string}){ return createSalesOrder(b.tenantId,b.branchId,b.customerId,b.warehouseId,b.lines,b.repId); }
  @Post('orders/:id/approve') async aO(@Param('id') id:string, @Body() b:{tenantId:string}){ await approveSalesOrder(b.tenantId,id); return {ok:true}; }
  @Post('delivery-notes') async cD(@Body() b:{tenantId:string; orderId:string; warehouseId:string; lines:{itemId:string; qty:string}[]}){ return createDeliveryNote(b.tenantId,b.orderId,b.warehouseId,b.lines); }
  @Post('delivery-notes/:id/post') async pD(@Param('id') id:string, @Body() b:{tenantId:string}){ return postDeliveryNote(b.tenantId,id); }
  @Post('delivery-notes/:id/convert-to-invoice') async convD(@Param('id') id:string, @Body() b:{tenantId:string; kind:'CREDIT'|'CASH'; dueDate:string}){ return convertToInvoice(b.tenantId,id,b.kind,b.dueDate); }
  @Post('invoices') async cI(@Body() b:{tenantId:string; branchId:string; customerId:string; kind:'CREDIT'|'CASH'; dueDate:string; lines:{itemId:string; qty:string; unitPrice:string; taxCodeId?:string}[]; warehouseId?:string; invoiceDate?:string; repId?:string}){ return createSalesInvoice(b.tenantId,b); }
  @Post('invoices/:id/approve') async aI(@Param('id') id:string, @Body() b:{tenantId:string}){ await approveSalesInvoice(b.tenantId,id); return {ok:true}; }
  @Post('invoices/:id/post') async pI(@Param('id') id:string, @Body() b:{tenantId:string}){ return postSalesInvoice(b.tenantId,id); }
  @Post('credit-notes') async cC(@Body() b:{tenantId:string; customerId:string; refInvoiceId:string; lines:{itemId:string; qty:string; unitPrice:string}[]; returnStock?:boolean}){ return createCreditNote(b.tenantId,b); }
  @Post('credit-notes/:id/post') async pC(@Param('id') id:string, @Body() b:{tenantId:string}){ return postCreditNote(b.tenantId,id); }
  @Post('receipts') async cR(@Body() b:{tenantId:string; customerId:string; cashAccountId:string; amount:string; allocations:{invoiceId:string; amount:string}[]; valueDate:string; currency?:string; exchangeRate?:string}){ return createReceipt(b.tenantId,b); }
  @Post('receipts/:id/post') async pR(@Param('id') id:string, @Body() b:{tenantId:string}){ return postReceipt(b.tenantId,id); }
  @Get('ar/aging') async aging(@Query('tenantId') t:string, @Query('asOf') asOf:string){ return getAging(t,asOf); }
  @Get('ar/statements/:customerId') async stmt(@Param('customerId') c:string, @Query('tenantId') t:string, @Query('from') f:string, @Query('to') to:string){ return getCustomerStatement(t,c,f,to); }
  @Get('ar/reconcile') async rec(@Query('tenantId') t:string){ return reconcileAr(t); }
  @Get('ar/allocations/suggest') async sug(@Query('tenantId') t:string, @Query('customerId') c:string){ return suggestFifo(t,c); }
  @Post('receipts/:id/reallocate') async re(@Param('id') id:string, @Body() b:{tenantId:string; allocations:{invoiceId:string; amount:string}[]}){ await reallocateReceipt(b.tenantId,id,b.allocations); return {ok:true}; }
  @Post('reps') async cRep(@Body() b:{tenantId:string; userId:string; code:string; name:string}){ return createSalesRep(b.tenantId,b.userId,b.code,b.name); }
  @Get('reps') async lRep(@Query('tenantId') t:string){ return listReps(t); }
}
