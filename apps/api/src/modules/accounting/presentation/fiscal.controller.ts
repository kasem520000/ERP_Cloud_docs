import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { createFiscalYear, softClosePeriod, lockPeriod, reopenPeriod } from '../application/period-service.js';
import { createApprovalPolicy } from '../application/approval-service.js';
import { revalueFx } from '../application/fx-revaluation-service.js';
import { closeYear, reopenYear } from '../application/year-end-service.js';
import { runAll } from '../application/reconciliation/index.js';
import { getChecklist } from '../application/close-checklist-service.js';

@Controller('api/v1/accounting')
export class FiscalController {
  // Fiscal years/periods
  @Post('fiscal-years') async createFY(@Body() b: { tenantId: string; name: string; startDate: string; endDate: string }) { return createFiscalYear(b.tenantId, b.name, b.startDate, b.endDate); }
  @Post('fiscal-periods/:id/soft-close') async softClose(@Param('id') id: string, @Body() b: { tenantId: string; reason: string }) { await softClosePeriod(b.tenantId, id, b.reason); return { ok: true }; }
  @Post('fiscal-periods/:id/lock') async lock(@Param('id') id: string, @Body() b: { tenantId: string }) { await lockPeriod(b.tenantId, id); return { ok: true }; }
  @Post('fiscal-periods/:id/reopen') async reopen(@Param('id') id: string, @Body() b: { tenantId: string; reason: string }) { await reopenPeriod(b.tenantId, id, b.reason); return { ok: true }; }
  @Get('fiscal-periods/:id/close-checklist') async checklist(@Param('id') id: string, @Body() b?: { tenantId: string }) { return getChecklist((b as { tenantId?: string })?.tenantId ?? '', id); }
  @Post('approval-policies') async ap(@Body() b: { tenantId: string; docType: string; policy: { levels: { threshold: string; approvers: string[] }[] } }) { return createApprovalPolicy(b.tenantId, b.docType, b.policy); }
  // Year-end
  @Post('fiscal-years/:id/close') async closeFY(@Param('id') id: string, @Body() b: { tenantId: string; retainedEarningsAccountId: string }) { return closeYear(b.tenantId, id, b.retainedEarningsAccountId); }
  @Post('fiscal-years/:id/reopen') async reopenFY(@Param('id') id: string, @Body() b: { tenantId: string }) { await reopenYear(b.tenantId, id); return { ok: true }; }
  @Post('fx-revaluation') async fx(@Body() b: { tenantId: string; baseCurrency: string; date: string }) { return revalueFx(b.tenantId, b.baseCurrency, b.date); }
  @Post('reconciliation/run') async recon(@Body() b: { tenantId: string }) { return runAll(b.tenantId); }
}
