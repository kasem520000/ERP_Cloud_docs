import { Controller, Post, Body, Param } from '@nestjs/common';
import { registerTerminal, openShift, closeShift, createPosSale, enqueueOffline, syncOffline } from '../application/pos-service.js';
@Controller('api/v1/pos')
export class PosController {
  @Post('terminals') async reg(@Body() b:{tenantId:string; branchId:string; code:string; name:string; cashAccountId:string}){ return registerTerminal(b.tenantId,b.branchId,b.code,b.name,b.cashAccountId); }
  @Post('shifts/open') async open(@Body() b:{tenantId:string; terminalId:string; cashierId:string; openingCash:string}){ return openShift(b.tenantId,b.terminalId,b.cashierId,b.openingCash); }
  @Post('shifts/:id/close') async close(@Param('id') id:string, @Body() b:{tenantId:string; closingCash:string}){ return closeShift(b.tenantId,id,b.closingCash); }
  @Post('sales') async sale(@Body() b:{tenantId:string; terminalId:string; shiftId:string; total:string; lines:{itemId:string; qty:string; price:string}[]}){ return createPosSale(b.tenantId,b.terminalId,b.shiftId,b.total,b.lines); }
  @Post('offline/enqueue') async enq(@Body() b:{tenantId:string; deviceId:string; payload:unknown}){ return enqueueOffline(b.tenantId,b.deviceId,b.payload); }
  @Post('offline/sync') async sync(@Body() b:{tenantId:string; deviceId:string}){ return syncOffline(b.tenantId,b.deviceId); }
}
