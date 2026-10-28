import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';

describe('PHASE-016 — POS terminal registry + shift + sale',()=>{
  it('migration has pos_terminals/shifts/sales/offline_queue RLS',()=>{
    const sql=fs.readFileSync('migrations/0017_pos_core.sql','utf8');
    expect(sql).toContain('pos_terminals');
    expect(sql).toContain('pos_shifts');
    expect(sql).toContain('pos_sales');
    expect(sql).toContain('pos_offline_queue');
    expect(sql).toContain('tenant_isolation');
  });
  it('registerTerminal → openShift → sale → closeShift variance', async()=>{
    vi.resetModules();
    const pool={
      query: vi.fn(async(sql:string)=>{
        if(sql.includes('SELECT status FROM pos_shifts')) return { rows:[{status:'OPEN'}] } as any;
        if(sql.includes('SELECT opening_cash FROM pos_shifts')) return { rows:[{opening_cash:'100.0000'}] } as any;
        return { rows:[] } as any;
      })
    };
    vi.doMock('../../src/infra/db/db.js',()=>({getPool:()=>pool}));
    const mod=await import('../../src/modules/pos/application/pos-service.js');
    const t=await mod.registerTerminal('t1','b1','T1','Counter 1','ca1'); expect(t.id).toBeDefined();
    const sh=await mod.openShift('t1',t.id,'u1','100.0000'); expect(sh.id).toBeDefined();
    const sale=await mod.createPosSale('t1',t.id,sh.id,'50.0000',[{itemId:'i1', qty:'2', price:'25'}]); expect(sale.invoiceId).toBeDefined();
    const close=await mod.closeShift('t1',sh.id,'145.0000'); expect(close.variance).toBe('45.0000');
  });
  it('offline enqueue → sync', async()=>{
    vi.resetModules();
    const pool={
      query: vi.fn(async(sql:string)=>{
        if(sql.includes('SELECT id, payload FROM pos_offline_queue')) return { rows:[{id:'q1', payload:{}}] } as any;
        return { rows:[] } as any;
      })
    };
    vi.doMock('../../src/infra/db/db.js',()=>({getPool:()=>pool}));
    const mod=await import('../../src/modules/pos/application/pos-service.js');
    const q=await mod.enqueueOffline('t1','d1',{sale:{total:'10'}}); expect(q.id).toBeDefined();
    const s=await mod.syncOffline('t1','d1'); expect(s.synced).toBe(1);
  });
  it('sale fails if shift not OPEN', async()=>{
    vi.resetModules();
    const pool={ query: vi.fn(async(sql:string)=>{
      if(sql.includes('SELECT status FROM pos_shifts')) return { rows:[{status:'CLOSED'}] } as any;
      return { rows:[] } as any;
    })};
    vi.doMock('../../src/infra/db/db.js',()=>({getPool:()=>pool}));
    const mod=await import('../../src/modules/pos/application/pos-service.js');
    await expect(mod.createPosSale('t1','t1','sh1','10',[])).rejects.toThrow('shift_not_open');
  });
  it('controller exposes 6 routes',()=>{
    const src=fs.readFileSync('src/modules/pos/presentation/pos.controller.ts','utf8');
    expect(src).toContain('terminals');
    expect(src).toContain('shifts/open');
    expect(src).toContain('shifts/:id/close');
    expect(src).toContain('sales');
    expect(src).toContain('offline/enqueue');
    expect(src).toContain('offline/sync');
  });
});
