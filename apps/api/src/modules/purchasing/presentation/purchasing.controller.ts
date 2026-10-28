import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { createPurchaseRequest, approvePurchaseRequest } from '../application/purchase-requests.js';
import { createPurchaseOrder, approvePurchaseOrder, issuePurchaseOrder } from '../application/purchase-orders.js';
import { createGoodsReceipt, postGoodsReceipt } from '../application/goods-receipts.js';
import { previewMatch, saveMatchResult } from '../application/matching.js';
import { createSupplierInvoice, postSupplierInvoice } from '../application/supplier-invoices.js';
import { createDebitNote, postDebitNote } from '../application/debit-notes.js';
import { createPayment, postPayment, reallocatePayment } from '../application/payments.js';
import { getAging, getSupplierStatement, getGrniRegister, reconcileAp } from '../application/ap-queries.js';
import { allocateLandedCost } from '../application/landed-costs.js';

@Controller('api/v1/purchasing')
export class PurchasingController {
  @Post('purchase-requests') async cPr(@Body() b:{tenantId:string; branchId:string; requestedBy:string; lines:{itemId:string; qty:string}[]}){ return createPurchaseRequest(b.tenantId,b.branchId,b.requestedBy,b.lines); }
  @Post('purchase-requests/:id/approve') async aPr(@Param('id') id:string, @Body() b:{tenantId:string}){ await approvePurchaseRequest(b.tenantId,id); return {ok:true}; }
  @Post('purchase-orders') async cPo(@Body() b:{tenantId:string; branchId:string; supplierId:string; lines:{itemId:string; qty:string; unitPrice:string}[]; orderDate:string}){ return createPurchaseOrder(b.tenantId,b.branchId,b.supplierId,b.lines,b.orderDate); }
  @Post('purchase-orders/:id/approve') async aPo(@Param('id') id:string, @Body() b:{tenantId:string; approverId:string}){ await approvePurchaseOrder(b.tenantId,id,b.approverId); return {ok:true}; }
  @Post('purchase-orders/:id/issue') async iPo(@Param('id') id:string, @Body() b:{tenantId:string}){ await issuePurchaseOrder(b.tenantId,id); return {ok:true}; }
  @Post('goods-receipts') async cGr(@Body() b:{tenantId:string; poId?:string; warehouseId:string; lines:{itemId:string; qty:string; unitCost:string}[]; receiptDate:string; notes?:string}){ return createGoodsReceipt(b.tenantId,b); }
  @Post('goods-receipts/:id/post') async pGr(@Param('id') id:string, @Body() b:{tenantId:string}){ return postGoodsReceipt(b.tenantId,id); }
  @Post('matching/preview') async mPrev(@Body() b:{tenantId:string; poId:string; grnId:string; invoiceLines:{itemId:string; qty:string; unitPrice:string}[]}){ return previewMatch(b.tenantId,{poId:b.poId, grnId:b.grnId, invoiceLines:b.invoiceLines}); }
  @Post('supplier-invoices') async cSi(@Body() b:{tenantId:string; supplierId:string; invoiceNo:string; invoiceDate:string; dueDate:string; poId?:string; grnId?:string; lines:{itemId:string; qty:string; unitPrice:string; taxCodeId?:string; treatment?:string}[]}){ return createSupplierInvoice(b.tenantId,b); }
  @Post('supplier-invoices/:id/match') async sMatch(@Param('id') id:string, @Body() b:{tenantId:string; matchResult:unknown}){ await saveMatchResult(b.tenantId,id,b.matchResult); return {ok:true}; }
  @Post('supplier-invoices/:id/post') async pSi(@Param('id') id:string, @Body() b:{tenantId:string}){ return postSupplierInvoice(b.tenantId,id); }
  @Post('debit-notes') async cDn(@Body() b:{tenantId:string; supplierId:string; refInvoiceId:string; amount:string; taxAmount?:string}){ return createDebitNote(b.tenantId,b); }
  @Post('debit-notes/:id/post') async pDn(@Param('id') id:string, @Body() b:{tenantId:string}){ return postDebitNote(b.tenantId,id); }
  @Post('payments') async cPay(@Body() b:{tenantId:string; supplierId:string; cashAccountId:string; amount:string; allocations:{invoiceId:string; amount:string}[]; valueDate:string; currency?:string; exchangeRate?:string}){ return createPayment(b.tenantId,b); }
  @Post('payments/:id/post') async pPay(@Param('id') id:string, @Body() b:{tenantId:string}){ return postPayment(b.tenantId,id); }
  @Post('payments/:id/reallocate') async rPay(@Param('id') id:string, @Body() b:{tenantId:string; allocations:{invoiceId:string; amount:string}[]}){ await reallocatePayment(b.tenantId,id,b.allocations); return {ok:true}; }
  @Get('ap/aging') async aging(@Query('tenantId') t:string, @Query('asOf') asOf:string){ return getAging(t,asOf); }
  @Get('ap/statements/:supplierId') async stmt(@Param('supplierId') sid:string, @Query('tenantId') t:string, @Query('from') from:string, @Query('to') to:string){ return getSupplierStatement(t,sid,from,to); }
  @Get('ap/grni-register') async grni(@Query('tenantId') t:string){ return getGrniRegister(t); }
  @Get('ap/reconcile') async rec(@Query('tenantId') t:string){ return reconcileAp(t); }
  @Post('landed-costs') async lc(@Body() b:{tenantId:string; grnId:string; costType:string; amount:string; method:'value'|'quantity'}){ return allocateLandedCost(b.tenantId,b.grnId,b.costType,b.amount,b.method); }
}
