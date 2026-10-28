import Decimal from 'decimal.js';
Decimal.set({ precision: 34, rounding: Decimal.ROUND_HALF_UP });
import { PostingError } from './errors.js';
import type { JournalSpec, ValidationContext, PostingResult } from './types.js';

const AMOUNT_RE = /^\d{1,15}(\.\d{1,4})?$/;

/**
 * PostingEngine — pure domain service, zero infrastructure dependencies (ADR-0007)
 * Implements validation pipeline 1-8 in order, first failure aborts, zero residue.
 */
export class PostingEngine {
  async validate(spec: JournalSpec, ctx: ValidationContext): Promise<{ resolvedLines: { accountId: string; direction: 'debit'|'credit'; amount: string; baseAmount: string; partnerId?: string }[]; periodId: string }> {
    if (ctx.existingEntry) {
      const existing = await ctx.existingEntry(spec.source.docType, spec.source.docId, spec.source.operation);
      if (existing) throw new PostingError('ALREADY_POSTED', `Already posted: ${existing}`);
    }
    if (spec.lines.length < 2) throw new PostingError('INVALID_AMOUNT', 'Journal requires at least 2 lines');
    const debits = spec.lines.filter(l => l.direction === 'debit');
    const credits = spec.lines.filter(l => l.direction === 'credit');
    if (debits.length === 0 || credits.length === 0) throw new PostingError('INVALID_AMOUNT', 'Journal requires at least 1 debit and 1 credit');
    for (const l of spec.lines) {
      if (!AMOUNT_RE.test(l.amount) || new Decimal(l.amount).lte(0)) throw new PostingError('INVALID_AMOUNT', `Invalid amount: ${l.amount}`);
    }
    const isForeign = spec.currency !== spec.baseCurrency;
    let rate = new Decimal(1);
    if (isForeign) {
      const r = spec.exchangeRate ?? await ctx.getFxRate(spec.currency, spec.entryDate);
      if (!r) throw new PostingError('MISSING_FX_RATE', `Missing FX rate for ${spec.currency} on ${spec.entryDate}`);
      rate = new Decimal(r);
      if (rate.lte(0)) throw new PostingError('INVALID_AMOUNT', 'FX rate must be > 0');
    }
    const withBase = spec.lines.map(l => ({
      ...l,
      baseAmount: l.baseAmount ?? new Decimal(l.amount).mul(rate).toFixed(4),
    }));
    const period = await ctx.isPeriodOpen(spec.entryDate);
    if (!period.open) {
      if (!period.periodId) throw new PostingError('PERIOD_NOT_FOUND', `No period for date ${spec.entryDate}`);
      throw new PostingError('PERIOD_LOCKED', `Period locked for date ${spec.entryDate}`);
    }
    const resolvedLines: { accountId: string; direction: 'debit'|'credit'; amount: string; baseAmount: string; partnerId?: string }[] = [];
    for (const l of withBase) {
      let accountId = l.accountId;
      if (!accountId && l.purpose) {
        const resolved = await ctx.resolvePurpose(l.purpose);
        if (!resolved) throw new PostingError('PURPOSE_NOT_MAPPED', `Purpose not mapped: ${l.purpose}`);
        accountId = resolved;
      }
      if (!accountId) throw new PostingError('ACCOUNT_NOT_POSTABLE', 'Line missing accountId or purpose');
      const acc = await ctx.isAccountPostable(accountId);
      if (!acc.active) throw new PostingError('ACCOUNT_ARCHIVED', `Account archived: ${accountId}`);
      if (!acc.postable) throw new PostingError('ACCOUNT_NOT_POSTABLE', `Account not postable: ${accountId}`);
      if (acc.currency && acc.currency !== spec.currency) throw new PostingError('CURRENCY_MISMATCH', `Account ${accountId} restricted to ${acc.currency}, got ${spec.currency}`);
      if (ctx.isControlPurpose(accountId) && !l.partnerId) {
        throw new PostingError('MISSING_PARTNER_ON_CONTROL', `Control account ${accountId} requires partnerId`);
      }
      const baseAmount = l.baseAmount ?? new Decimal(l.amount).mul(rate).toFixed(4);
      resolvedLines.push({ accountId, direction: l.direction, amount: l.amount, baseAmount, partnerId: l.partnerId });
    }
    const sumDocDebit = resolvedLines.filter(x => x.direction === 'debit').reduce((acc, x) => acc.plus(new Decimal(x.amount)), new Decimal(0));
    const sumDocCredit = resolvedLines.filter(x => x.direction === 'credit').reduce((acc, x) => acc.plus(new Decimal(x.amount)), new Decimal(0));
    if (!sumDocDebit.equals(sumDocCredit)) throw new PostingError('ENTRY_NOT_BALANCED', `Not balanced in doc currency: debit ${sumDocDebit.toString()} credit ${sumDocCredit.toString()}`);
    const sumBaseDebit = resolvedLines.filter(x => x.direction === 'debit').reduce((acc, x) => acc.plus(new Decimal(x.baseAmount)), new Decimal(0));
    const sumBaseCredit = resolvedLines.filter(x => x.direction === 'credit').reduce((acc, x) => acc.plus(new Decimal(x.baseAmount)), new Decimal(0));
    if (!sumBaseDebit.equals(sumBaseCredit)) throw new PostingError('ENTRY_NOT_BALANCED', `Not balanced in base currency: debit ${sumBaseDebit.toString()} credit ${sumBaseCredit.toString()}`);
    return { resolvedLines, periodId: period.periodId! };
  }

  async post(spec: JournalSpec, ctx: ValidationContext): Promise<PostingResult> {
    const { resolvedLines, periodId } = await this.validate(spec, ctx);
    void periodId;
    const entryNo = `JE-${spec.entryDate.slice(0, 4)}-${Math.floor(Math.random() * 900000 + 100000)}`;
    return {
      journalEntryId: `je-${Date.now()}`,
      entryNo,
      lines: resolvedLines.map((x, i) => ({
        lineNo: i + 1,
        accountId: x.accountId,
        debit: x.direction === 'debit' ? x.amount : '0.0000',
        credit: x.direction === 'credit' ? x.amount : '0.0000',
        baseAmount: x.baseAmount,
      })),
    };
  }

  async reverse(entryId: string, ctx: { loadEntry: (id: string) => Promise<{ status: string; lines: { accountId?: string; purpose?: string; direction: 'debit'|'credit'; amount: string }[]; entryDate: string; currency: string; exchangeRate: string } | null>; isPeriodOpen: (date: string) => Promise<boolean> }): Promise<JournalSpec> {
    const orig = await ctx.loadEntry(entryId);
    if (!orig) throw new PostingError('PERIOD_NOT_FOUND', 'Original entry not found');
    if (orig.status !== 'POSTED') throw new PostingError('ALREADY_REVERSED', 'Only POSTED entries can be reversed');
    const today = new Date().toISOString().slice(0, 10);
    const open = await ctx.isPeriodOpen(today);
    if (!open) throw new PostingError('PERIOD_LOCKED', 'Cannot reverse into locked period');
    return {
      source: { docType: 'reversal', docId: entryId, operation: 'REVERSE' },
      entryDate: today,
      currency: orig.currency,
      exchangeRate: orig.exchangeRate,
      lines: orig.lines.map(v => ({ ...v, direction: v.direction === 'debit' ? 'credit' as const : 'debit' as const })),
      tenantId: '',
      baseCurrency: orig.currency,
    };
  }

  async isDatePostable(date: string, ctx: ValidationContext): Promise<boolean> {
    const p = await ctx.isPeriodOpen(date);
    return p.open;
  }
}
