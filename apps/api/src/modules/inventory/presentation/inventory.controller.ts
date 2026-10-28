import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { createWarehouse, listWarehouses } from '../application/warehouse-service.js';
import { receiveStock, issueStock, postAdjustment } from '../application/movement-service.js';
import { postOpeningStock } from '../application/opening-stock.js';
import { createTransfer, dispatchTransfer, receiveTransfer } from '../application/transfers.js';
import { createCount, submitCounts, approveCount } from '../application/counts.js';
import { getAvailability } from '../application/availability.js';
import { reserveStock } from '../application/reservations.js';
import { switchMethod } from '../application/method-switch.js';
import { checkInv010 } from '../application/reconciliation.js';
import { checkReorder } from '../application/reorder-job.js';
@Controller('api/v1/inventory')
export class InventoryController {
  @Post('warehouses') async cWh(@Body() b:{tenantId:string; branchId:string; code:string; name:string}){ return createWarehouse(b.tenantId,b.branchId,b); }
  @Get('warehouses') async lWh(@Query('tenantId') t:string, @Query('branchId') br?:string){ return listWarehouses(t,br); }
  @Post('receipts') async rec(@Body() b:{tenantId:string; itemId:string; warehouseId:string; qty:string; unitCost:string}){ return receiveStock(b.tenantId,{ itemId:b.itemId, warehouseId:b.warehouseId, qty:b.qty, unitCost:b.unitCost, sourceType:'manual_receipt', sourceId: b.tenantId }); }
  @Post('issues') async iss(@Body() b:{tenantId:string; itemId:string; warehouseId:string; qty:string}){ return issueStock(b.tenantId,{ itemId:b.itemId, warehouseId:b.warehouseId, qty:b.qty, sourceType:'manual_issue', sourceId: b.tenantId }); }
  @Post('adjustments') async adj(@Body() b:{tenantId:string; itemId:string; warehouseId:string; qtyDiff:string; reason:string; valueDate:string}){ return postAdjustment(b.tenantId,b); }
  @Post('opening-stock') async op(@Body() b:{tenantId:string; warehouseId:string; lines:{itemId:string; qty:string; unitCost:string}[]; valueDate:string}){ return postOpeningStock(b.tenantId,b.warehouseId,b.lines,b.valueDate); }
  @Post('transfers') async cTr(@Body() b:{tenantId:string; fromWarehouseId:string; toWarehouseId:string; lines:{itemId:string; qty:string}[]}){ return createTransfer(b.tenantId,b.fromWarehouseId,b.toWarehouseId,b.lines); }
  @Post('transfers/:id/dispatch') async dTr(@Param('id') id:string, @Body() b:{tenantId:string}){ await dispatchTransfer(b.tenantId,id); return {ok:true}; }
  @Post('transfers/:id/receive') async rTr(@Param('id') id:string, @Body() b:{tenantId:string}){ await receiveTransfer(b.tenantId,id); return {ok:true}; }
  @Post('counts') async cCo(@Body() b:{tenantId:string; warehouseId:string; isBlind?:boolean}){ return createCount(b.tenantId,b.warehouseId,b.isBlind); }
  @Post('counts/:id/submit') async sCo(@Param('id') id:string, @Body() b:{tenantId:string; lines:{itemId:string; countedQty:string}[]}){ await submitCounts(b.tenantId,id,b.lines); return {ok:true}; }
  @Post('counts/:id/approve') async aCo(@Param('id') id:string, @Body() b:{tenantId:string; periodDate:string}){ await approveCount(b.tenantId,id,b.periodDate); return {ok:true}; }
  @Get('availability') async av(@Query('tenantId') t:string, @Query('itemId') i:string, @Query('warehouseId') w:string){ return getAvailability(t,i,w); }
  @Post('reservations') async resv(@Body() b:{tenantId:string; itemId:string; warehouseId:string; qty:string; holderType:string; holderId:string}){ return reserveStock(b.tenantId,b); }
  @Post('items/:id/method-switch') async sw(@Param('id') id:string, @Body() b:{tenantId:string; newMethod:'wac'|'fifo'; valueDate:string}){ return switchMethod(b.tenantId,id,b.newMethod,b.valueDate); }
  @Get('reconciliation/inv-010') async rec010(@Query('tenantId') t:string){ return checkInv010(t); }
  @Post('reorder/check') async reord(){ return checkReorder(); }
}
