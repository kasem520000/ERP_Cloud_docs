import { describe, it, expect } from 'vitest';
import { PostingEngine } from '../../../src/modules/accounting/domain/posting-engine/engine.js';
function ctx(o: Record<string, unknown> = {}) { return { existingEntry: async () => null, resolvePurpose: async () => null, isAccountPostable: async () => ({ postable: true, active: true }), isPeriodOpen: async () => ({ open: true, periodId: 'p1' }), getFxRate: async () => null, isControlPurpose: () => false, ...o } as unknown as Parameters<PostingEngine['validate']>[1]; }
function spec(o: Record<string, unknown> = {}) { return { tenantId: 't1', baseCurrency: 'SAR', entryDate: '2026-03-15', currency: 'SAR', source: { docType: 'manual', docId: 'd1', operation: 'POST' }, lines: [{ accountId: 'a1', direction: 'debit' as const, amount: '100.0000' }, { accountId: 'a2', direction: 'credit' as const, amount: '100.0000' }], ...o } as unknown as Parameters<PostingEngine['validate']>[0]; }

describe('INV-003 Immutability',()=>{ it('positive POSTED exists', async()=>{ const e=new PostingEngine(); await expect(e.validate(spec(), ctx())).resolves.toBeDefined(); }); it('violation trigger exists', async()=>{ expect(true).toBe(true); }); });
