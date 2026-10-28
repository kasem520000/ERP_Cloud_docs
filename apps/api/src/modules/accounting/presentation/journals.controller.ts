import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { postJournal } from '../application/posting-service.js';
import { reverseJournal } from '../application/reversal-service.js';
import { createDraft, submitForApproval, postManual } from '../application/journal-service.js';
import { journalRegister, trialBalance, accountStatement } from '../application/gl-queries.js';
import { upsertRate, getRate } from '../application/fx-service.js';
import { createAccount, setPurpose, archiveAccount } from '../application/coa-service.js';
import { createRecurring, runDue } from '../application/recurring-service.js';
import { importOpeningBalances } from '../application/opening-balances-service.js';

@Controller('api/v1/accounting')
export class JournalsController {
  @Post('accounts') async createAcc(@Body() b: { tenantId: string; code: string; name: string; nameAr?: string; type: string; parentId?: string; currencyCode?: string }) { return createAccount(b.tenantId, { code: b.code, name: b.name, nameAr: b.nameAr, type: b.type, parentId: b.parentId, currencyCode: b.currencyCode }); }
  @Post('account-purposes') async purpose(@Body() b: { tenantId: string; purposeKey: string; accountId: string }) { await setPurpose(b.tenantId, b.purposeKey, b.accountId); return { ok: true }; }
  @Post('accounts/:id/archive') async archive(@Param('id') id: string, @Body() b: { tenantId: string }) { await archiveAccount(b.tenantId, id); return { ok: true }; }

  @Post('journals') async post(@Body() b: { tenantId: string; baseCurrency: string; entryDate: string; description?: string; currency: string; exchangeRate?: string; lines: { accountId?: string; purpose?: string; direction: 'debit'|'credit'; amount: string; partnerId?: string; memo?: string }[]; source: { docType: string; docId: string; operation: string } }) {
    return postJournal(b.tenantId, b.baseCurrency, { entryDate: b.entryDate, description: b.description, currency: b.currency, exchangeRate: b.exchangeRate, lines: b.lines, source: b.source });
  }
  @Post('journals/:id/reverse') async reverse(@Param('id') id: string, @Body() b: { tenantId: string; reason: string }) { return reverseJournal(b.tenantId, id, b.reason); }
  @Post('journals/draft') async draft(@Body() b: { tenantId: string; entryDate: string; description?: string; currency: string; lines: { accountId: string; direction: 'debit'|'credit'; amount: string }[] }) { return createDraft(b.tenantId, null, b); }
  @Post('journals/:id/submit') async submit(@Param('id') id: string, @Body() b: { tenantId: string }) { return submitForApproval(b.tenantId, id); }
  @Post('journals/:id/post-manual') async postManual(@Param('id') id: string, @Body() b: { tenantId: string }) { return postManual(b.tenantId, id); }

  @Get('gl/trial-balance') async tb(@Query('tenantId') tenantId: string, @Query('from') from: string, @Query('to') to: string) { return trialBalance(tenantId, from, to); }
  @Get('gl/journal-register') async jr(@Query('tenantId') tenantId: string, @Query('from') from: string, @Query('to') to: string, @Query('accountId') accountId?: string) { return journalRegister(tenantId, { from, to, accountId }); }
  @Get('gl/account-statement') async st(@Query('tenantId') tenantId: string, @Query('accountId') accountId: string, @Query('from') from: string, @Query('to') to: string) { return accountStatement(tenantId, accountId, from, to); }

  @Post('exchange-rates') async rate(@Body() b: { tenantId: string; currencyCode: string; rateDate: string; rate: string }) { return upsertRate(b.tenantId, b.currencyCode, b.rateDate, b.rate); }
  @Get('exchange-rates') async getR(@Query('tenantId') tenantId: string, @Query('currency') currency: string, @Query('date') date: string) { return { rate: await getRate(tenantId, currency, date) }; }

  @Post('recurring') async rec(@Body() b: { tenantId: string; name: string; template: unknown; schedule: string; nextRunDate: string }) { return createRecurring(b.tenantId, b); }
  @Post('recurring/run-due') async runDue(@Body() b: { tenantId: string; baseCurrency: string; date: string }) { return { posted: await runDue(b.tenantId, b.baseCurrency, b.date) }; }

  @Post('opening-balances') async opening(@Body() b: { tenantId: string; baseCurrency: string; date: string; rows: { accountId?: string; partnerId?: string; amount: string; direction: 'debit'|'credit' }[] }) { return importOpeningBalances(b.tenantId, b.baseCurrency, b.date, b.rows); }
}
