import { describe, it, expect } from 'vitest';
import { PostingEngine } from '../../src/modules/accounting/domain/posting-engine/engine.js';

function ctx(overrides: Record<string, unknown> = {}) {
  return {
    existingEntry: async () => null,
    resolvePurpose: async (p: string) => p === 'ar_control' ? 'acc-ar' : null,
    isAccountPostable: async () => ({ postable: true, active: true }),
    isPeriodOpen: async () => ({ open: true, periodId: 'period-1' }),
    getFxRate: async () => '3.75',
    isControlPurpose: () => false,
    ...overrides,
  } as unknown as Parameters<PostingEngine['validate']>[1];
}
function spec(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: 't1', baseCurrency: 'SAR', entryDate: '2026-03-15', currency: 'SAR',
    source: { docType: 'manual', docId: 'd1', operation: 'POST' },
    lines: [
      { accountId: 'a1', direction: 'debit' as const, amount: '100.0000' },
      { accountId: 'a2', direction: 'credit' as const, amount: '100.0000' },
    ],
    ...overrides,
  } as unknown as Parameters<PostingEngine['validate']>[0];
}

describe('PostingEngine invariants', () => {
  it('INV-001/002 balanced passes, unbalanced throws ENTRY_NOT_BALANCED', async () => {
    const eng = new PostingEngine();
    await expect(eng.validate(spec(), ctx())).resolves.toBeDefined();
    await expect(eng.validate(spec({ lines: [
      { accountId: 'a1', direction: 'debit' as const, amount: '100.0000' },
      { accountId: 'a2', direction: 'credit' as const, amount: '90.0000' },
    ]}), ctx())).rejects.toThrow('ENTRY_NOT_BALANCED');
  });
  it('INV-011 period locked blocks posting', async () => {
    const eng = new PostingEngine();
    await expect(eng.validate(spec(), ctx({ isPeriodOpen: async () => ({ open: false, periodId: 'p1' }) }))).rejects.toThrow('PERIOD_LOCKED');
  });
  it('INV-004 fail-closed purpose throws PURPOSE_NOT_MAPPED', async () => {
    const eng = new PostingEngine();
    await expect(eng.validate(spec({ lines: [
      { purpose: 'unknown_purpose', direction: 'debit' as const, amount: '100.0000' },
      { accountId: 'a2', direction: 'credit' as const, amount: '100.0000' },
    ]}), ctx())).rejects.toThrow('PURPOSE_NOT_MAPPED');
  });
  it('INV-015/003 account not postable throws ACCOUNT_NOT_POSTABLE', async () => {
    const eng = new PostingEngine();
    await expect(eng.validate(spec(), ctx({ isAccountPostable: async () => ({ postable: false, active: true }) }))).rejects.toThrow('ACCOUNT_NOT_POSTABLE');
  });
  it('INV-005 currency mismatch', async () => {
    const eng = new PostingEngine();
    await expect(eng.validate(spec(), ctx({ isAccountPostable: async () => ({ postable: true, active: true, currency: 'USD' }) }))).rejects.toThrow('CURRENCY_MISMATCH');
  });
  it('INV-008 FX missing rate', async () => {
    const eng = new PostingEngine();
    await expect(eng.validate(spec({ currency: 'USD' }), ctx({ getFxRate: async () => null }))).rejects.toThrow('MISSING_FX_RATE');
  });
  it('INV-009 subledger control without partner', async () => {
    const eng = new PostingEngine();
    await expect(eng.validate(spec(), ctx({ isControlPurpose: () => true }))).rejects.toThrow('MISSING_PARTNER_ON_CONTROL');
  });
  it('INV-013 idempotency already posted', async () => {
    const eng = new PostingEngine();
    await expect(eng.validate(spec(), ctx({ existingEntry: async () => 'existing-id' }))).rejects.toThrow('ALREADY_POSTED');
  });
  it('post returns balanced result with entryNo formatted JE-{yyyy}-seq', async () => {
    const eng = new PostingEngine();
    const res = await eng.post(spec({ entryDate: '2026-03-15' }), ctx());
    expect(res.entryNo).toMatch(/^JE-2026-/);
    const debit = res.lines.filter(l => l.debit !== '0.0000').length;
    const credit = res.lines.filter(l => l.credit !== '0.0000').length;
    expect(debit).toBeGreaterThan(0); expect(credit).toBeGreaterThan(0);
  });
});
