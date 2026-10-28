import { describe, it, expect } from 'vitest';
import { PostingEngine } from '../../../src/modules/accounting/domain/posting-engine/engine.js';
function ctx(o: Record<string, unknown>={}){ return { existingEntry: async()=>null, resolvePurpose: async(p:string)=> p==='OPENING_EQUITY' ? 'acc-equity' : null, isAccountPostable: async()=>({postable:true, active:true}), isPeriodOpen: async()=>({open:true, periodId:'p-opening'}), getFxRate: async()=>null, isControlPurpose:(id:string)=> id==='acc-ar', ...o } as unknown as Parameters<PostingEngine['validate']>[1]; }
describe('G-16 opening balances',()=>{
  it('partner + cash vs opening_equity balances via OPENING period', async()=>{
    const e=new PostingEngine();
    const spec={ tenantId:'t1', baseCurrency:'SAR', entryDate:'2026-01-01', currency:'SAR', source:{docType:'opening_balance', docId:'batch1', operation:'POST'}, lines:[{accountId:'acc-ar', direction:'debit' as const, amount:'5000.0000', partnerId:'cust1'}, {accountId:'acc-cash', direction:'debit' as const, amount:'2000.0000'}, {purpose:'OPENING_EQUITY', direction:'credit' as const, amount:'7000.0000'}] } as unknown as Parameters<PostingEngine['validate']>[0];
    const res=await e.validate(spec, ctx());
    expect(res.periodId).toBe('p-opening');
  });
  it('failure pack: locked period zero residue', async()=>{
    const e=new PostingEngine();
    const badSpec={ tenantId:'t1', baseCurrency:'SAR', entryDate:'2026-01-01', currency:'SAR', source:{docType:'opening_balance', docId:'batch1', operation:'POST'}, lines:[{accountId:'a1', direction:'debit' as const, amount:'100.0000'}, {accountId:'a2', direction:'credit' as const, amount:'100.0000'}] } as unknown as Parameters<PostingEngine['validate']>[0];
    await expect(e.validate(badSpec, ctx({isPeriodOpen: async()=>({open:false, periodId:'p1'})}))).rejects.toThrow('PERIOD_LOCKED');
  });
});
