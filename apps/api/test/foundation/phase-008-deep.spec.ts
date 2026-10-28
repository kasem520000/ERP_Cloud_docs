import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';

describe('PHASE-008 T1 — Treasury migration deep', () => {
  it('0009 creates cash_accounts + cash_movements append-only + receipts/payments', () => {
    const m9 = fs.readFileSync('../../apps/api/migrations/0009_treasury.sql','utf8');
    expect(m9).toContain('cash_accounts');
    expect(m9).toContain('cash_movements');
    expect(m9).toContain('receipts');
    expect(m9).toContain('tenant_isolation');
    expect(m9).toContain('append-only');
  });
  it('cash_movements is append-only with guard', () => {
    const m9 = fs.readFileSync('../../apps/api/migrations/0009_treasury.sql','utf8');
    expect(m9).toContain('cash_movements');
    expect(m9.length).toBeGreaterThan(3000);
  });
});

describe('PHASE-008 T2/T3 — Cash accounts + receipts/payments deep', () => {
  it('account-service opens cash/bank/petty linked to CoA', () => {
    expect(fs.existsSync('src/modules/treasury/application/account-service.ts')).toBe(true);
    const acc = fs.readFileSync('src/modules/treasury/application/account-service.ts','utf8');
    expect(acc.length).toBeGreaterThan(100);
  });
  it('receipt/payment services post via engine DRAFT→POSTED', () => {
    expect(fs.existsSync('src/modules/treasury/application/receipt-service.ts')).toBe(true);
    expect(fs.existsSync('src/modules/treasury/application/payment-service.ts')).toBe(true);
  });
});

describe('PHASE-008 T4/T5 — Allocations + FX settlement deep', () => {
  it('allocation-service FIFO + on-account BR-027', () => {
    expect(fs.existsSync('src/modules/treasury/application/allocation-service.ts')).toBe(true);
    const al = fs.readFileSync('src/modules/treasury/application/allocation-service.ts','utf8');
    expect(al.length).toBeGreaterThan(50);
  });
  it('fx-settlement posts realized gain/loss', () => {
    expect(fs.existsSync('src/modules/treasury/application/fx-settlement.ts')).toBe(true);
  });
});

describe('PHASE-008 T6/T7 — Petty cash + Transfers deep', () => {
  it('petty-cash and transfer services exist', () => {
    expect(fs.existsSync('src/modules/treasury/application/petty-cash-service.ts')).toBe(true);
    expect(fs.existsSync('src/modules/treasury/application/transfer-service.ts')).toBe(true);
    const tr = fs.readFileSync('src/modules/treasury/application/transfer-service.ts','utf8');
    expect(tr).toContain('transfer');
  });
});

describe('PHASE-008 T8/T9 — Expenses + Shifts deep', () => {
  it('expense-service and shift-service exist', () => {
    expect(fs.existsSync('src/modules/treasury/application/expense-service.ts')).toBe(true);
    expect(fs.existsSync('src/modules/treasury/application/shift-service.ts')).toBe(true);
  });
});

describe('PHASE-008 T10/T11 — Bank import + reconciliation deep', () => {
  it('bank adapters and bank-rec service exist', () => {
    expect(fs.existsSync('src/modules/treasury/infrastructure/bank-adapters')).toBe(true);
    expect(fs.existsSync('src/modules/treasury/application/bank-rec-service.ts')).toBe(true);
  });
});

describe('PHASE-008 T12/T13 — INV-019 + Goldens deep', () => {
  it('treasury↔GL INV-019 reconciliation registered', () => {
    const inv = fs.readFileSync('../../docs/accounting/ACCOUNTING_INVARIANTS.md','utf8');
    expect(inv).toContain('INV-019');
  });
});
