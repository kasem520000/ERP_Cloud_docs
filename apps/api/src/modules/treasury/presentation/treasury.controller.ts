import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { openAccount, closeAccount, getBalance } from '../application/account-service.js';
import { createReceipt, postReceipt } from '../application/receipt-service.js';
import { createPayment, postPayment } from '../application/payment-service.js';
import { allocate, suggestFifo } from '../application/allocation-service.js';
import { createTransfer, postTransfer } from '../application/transfer-service.js';
import { createCategory, createExpense, postExpense } from '../application/expense-service.js';
import { openShift, closeShift } from '../application/shift-service.js';
import { importStatement, autoMatch, reconcile } from '../application/bank-rec-service.js';
import { checkPettyLimit } from '../application/petty-cash-service.js';
@Controller('api/v1/treasury')
export class TreasuryController {
  @Post('cash-accounts') async open(@Body() b:{tenantId:string; code:string; name:string; type:'CASH'|'BANK'|'PETTY'; accountId:string}){ return openAccount(b.tenantId, b); }
  @Post('cash-accounts/:id/close') async close(@Param('id') id:string, @Body() b:{tenantId:string}){ await closeAccount(b.tenantId,id); return {ok:true}; }
  @Get('cash-accounts/:id/balance') async bal(@Param('id') id:string, @Query('tenantId') t:string){ return {balance: await getBalance(t,id)}; }
  @Post('receipts') async cRec(@Body() b:{tenantId:string; cashAccountId:string; partnerId?:string; amount:string; valueDate:string}){ return createReceipt(b.tenantId, b); }
  @Post('receipts/:id/post') async pRec(@Param('id') id:string, @Body() b:{tenantId:string}){ return postReceipt(b.tenantId,id); }
  @Post('payments') async cPay(@Body() b:{tenantId:string; cashAccountId:string; partnerId?:string; amount:string; valueDate:string}){ return createPayment(b.tenantId, b); }
  @Post('payments/:id/post') async pPay(@Param('id') id:string, @Body() b:{tenantId:string}){ return postPayment(b.tenantId,id); }
  @Post('allocations') async alloc(@Body() b:{tenantId:string; sourceType:'receipt'|'payment'; sourceId:string; openItemId:string; amount:string}){ return allocate(b.tenantId, b); }
  @Get('allocations/suggest') async sugg(@Query('tenantId') t:string, @Query('partnerId') p:string){ return suggestFifo(t,p); }
  @Post('transfers') async cTr(@Body() b:{tenantId:string; fromAccountId:string; toAccountId:string; amount:string; feeAmount?:string; valueDate:string}){ return createTransfer(b.tenantId,b); }
  @Post('transfers/:id/post') async pTr(@Param('id') id:string, @Body() b:{tenantId:string}){ return postTransfer(b.tenantId,id); }
  @Post('expense-categories') async cCat(@Body() b:{tenantId:string; code:string; name:string; accountId:string}){ return createCategory(b.tenantId,b); }
  @Post('expenses') async cExp(@Body() b:{tenantId:string; categoryId:string; cashAccountId:string; amount:string}){ return createExpense(b.tenantId,b); }
  @Post('expenses/:id/post') async pExp(@Param('id') id:string, @Body() b:{tenantId:string}){ return postExpense(b.tenantId,id); }
  @Post('shifts') async oSh(@Body() b:{tenantId:string; cashAccountId:string; openingFloat:string}){ return openShift(b.tenantId,b); }
  @Post('shifts/:id/close') async cSh(@Param('id') id:string, @Body() b:{tenantId:string; countedAmount:string; expectedAmount:string; supervisorPin?:string; reason?:string}){ return closeShift(b.tenantId,id,b); }
  @Post('bank-statements/import') async imp(@Body() b:{tenantId:string; cashAccountId:string; fileHash:string; fileName:string; lines:{valueDate:string; amount:string; reference?:string}[]}){ return importStatement(b.tenantId,b.cashAccountId,b.fileHash,b.fileName,b.lines); }
  @Post('bank-statements/:id/auto-match') async am(@Param('id') id:string, @Body() b:{tenantId:string}){ return autoMatch(b.tenantId,id); }
  @Post('bank-statements/:id/reconcile') async rec(@Param('id') id:string, @Body() b:{tenantId:string}){ await reconcile(b.tenantId,id); return {ok:true}; }
  @Post('petty/check') async petty(@Body() b:{tenantId:string; cashAccountId:string; amount:string}){ await checkPettyLimit(b.tenantId,b.cashAccountId,b.amount); return {ok:true}; }
}
