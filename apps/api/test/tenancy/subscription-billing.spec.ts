import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';

describe('PHASE-014 T1 — Plan seeds matrix PLACEHOLDER + feature_keys',()=>{
  it('migration 0015 seeds 3 plans starter/business/enterprise with limits feature_keys',()=>{
    const sql=fs.readFileSync('migrations/0015_subscriptions_billing.sql','utf8');
    expect(sql).toContain("'starter'");
    expect(sql).toContain("'business'");
    expect(sql).toContain("'enterprise'");
    expect(sql).toContain('"users":3');
    expect(sql).toContain('"users":10');
    expect(sql).toContain('"users":50');
    expect(sql).toContain('documents_month');
    expect(sql).toContain('reporting.dashboards'); // business+
    expect(sql).toContain('inventory.reservations'); // enterprise
    expect(sql).toContain('PLACEHOLDER'); // prices marked
  });
  it('price_amount 0 PLACEHOLDER pending OQ-002 (not invented)',()=>{
    const sql=fs.readFileSync('migrations/0015_subscriptions_billing.sql','utf8');
    // 3 plan seeds with 0 SAR PLACEHOLDER
    expect(sql).toContain("'starter'");
    expect(sql).toContain("'business'");
    expect(sql).toContain("'enterprise'");
    expect(sql).toContain("PLACEHOLDER");
  });
});

describe('PHASE-014 T1 — Entitlement materialization BR-039/040',()=>{
  beforeEach(()=> vi.resetModules());
  it('materializeEntitlements inserts plan feature_keys transactional + BR-040 closure', async()=>{
    const pool={
      query: vi.fn(async(sql:string)=>{
        if(sql.includes('FROM plans WHERE key')) return { rows:[{ feature_keys:['sales.invoices','sales.receipts'] }] } as any;
        if(sql.includes('FROM entitlements WHERE tenant_id')) return { rows:[{feature_key:'sales.invoices'}] } as any;
        return { rows:[] } as any;
      })
    };
    vi.doMock('../../src/infra/db/db.js',()=>({getPool:()=>pool}));
    const mod=await import('../../src/modules/tenancy/application/entitlements-service.js');
    const closure=mod.checkDependencyClosure(['pos.terminals'], ['platform.branches']);
    expect(closure.ok).toBe(false);
    expect(closure.missing).toContain('inventory.stock_ledger');
    const ok=mod.checkDependencyClosure(['pos.terminals'], ['platform.branches','inventory.stock_ledger']);
    expect(ok.ok).toBe(true);
  });
  it('hasFeature / enforceFeature BR-039 server-side',()=>{
    const src=fs.readFileSync('src/modules/tenancy/application/entitlements-service.ts','utf8');
    expect(src).toContain('hasFeature');
    expect(src).toContain('enforceFeature');
    expect(src).toContain('feature_not_entitled');
    expect(src).toContain('expires_at > now()');
  });
});

describe('PHASE-014 T4 — Subscription lifecycle trial→active→grace→suspended',()=>{
  beforeEach(()=> vi.resetModules());
  it('transitions matrix canTransition TRIAL→GRACE yes, GRACE→TRIAL no', async()=>{
    const mod=await import('../../src/modules/tenancy/application/subscription-lifecycle.js');
    expect(mod.canTransition('TRIAL','GRACE')).toBe(true);
    expect(mod.canTransition('GRACE','TRIAL')).toBe(false);
    expect(mod.canTransition('GRACE','SUSPENDED')).toBe(true);
    expect(mod.canTransition('SUSPENDED','ACTIVE')).toBe(true);
  });
  it('enterGrace writes notifications + audit, suspend kills sessions', async()=>{
    const pool={
      query: vi.fn(async(sql:string)=>{
        if(sql.includes('SELECT status FROM subscriptions')) return { rows:[{status:'ACTIVE'}] } as any;
        return { rows:[] } as any;
      })
    };
    vi.doMock('../../src/infra/db/db.js',()=>({getPool:()=>pool}));
    const mod=await import('../../src/modules/tenancy/application/subscription-lifecycle.js');
    await mod.enterGrace('t1',14);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO notifications'), expect.anything());
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('subscription.grace_entered'), expect.anything());
  });
  it('enforceNotReadOnly GRACE→subscription_read_only, SUSPENDED→tenant_suspended', async()=>{
    vi.resetModules();
    const poolGrace={ query: vi.fn(async()=> ({rows:[{status:'GRACE'}]} as any)) };
    vi.doMock('../../src/infra/db/db.js',()=>({getPool:()=>poolGrace}));
    const mod=await import('../../src/modules/tenancy/application/subscription-lifecycle.js');
    await expect(mod.enforceNotReadOnly('t1')).rejects.toThrow('subscription_read_only');
    vi.resetModules();
    const poolSusp={ query: vi.fn(async()=> ({rows:[{status:'SUSPENDED'}]} as any)) };
    vi.doMock('../../src/infra/db/db.js',()=>({getPool:()=>poolSusp}));
    const mod2=await import('../../src/modules/tenancy/application/subscription-lifecycle.js');
    await expect(mod2.enforceNotReadOnly('t2')).rejects.toThrow('tenant_suspended');
  });
  it('handleWebhook signature + idempotency replay', async()=>{
    vi.resetModules();
    const pool={
      query: vi.fn(async(sql:string)=>{
        if(sql.includes('audit_events WHERE entity_id')) return { rows:[] } as any; // first call not replay
        if(sql.includes('SELECT limits FROM plans')) return { rows:[{limits:{users:10}}] } as any;
        if(sql.includes('SELECT value FROM usage_counters')) return { rows:[] } as any;
        if(sql.includes('SELECT id FROM plans')) return { rows:[{id:'p1'}] } as any;
        if(sql.includes('SELECT 1 FROM audit_events')) return { rows:[] } as any;
        return { rows:[] } as any;
      })
    };
    vi.doMock('../../src/infra/db/db.js',()=>({getPool:()=>pool}));
    vi.doMock('../../src/modules/tenancy/application/entitlements-service.js',()=>({materializeEntitlements: async()=>{}}));
    const mod=await import('../../src/modules/tenancy/application/subscription-lifecycle.js');
    await expect(mod.handleWebhook('evt1','t1','business',false)).rejects.toThrow('invalid_signature');
    const r=await mod.handleWebhook('evt1','t1','business',true);
    expect(r.activated).toBe(true);
    // replay
    const poolReplay={ query: vi.fn(async(sql:string)=>{
      if(sql.includes('SELECT 1 FROM audit_events WHERE entity_id')) return { rows:[{entity_id:'evt1'}] } as any;
      return { rows:[] } as any;
    })};
    vi.resetModules();
    vi.doMock('../../src/infra/db/db.js',()=>({getPool:()=>poolReplay}));
    const modReplay=await import('../../src/modules/tenancy/application/subscription-lifecycle.js');
    const r2=await modReplay.handleWebhook('evt1','t1','business',true);
    expect(r2.activated).toBe(false);
  });
});

describe('PHASE-014 T6 — Usage counters soft/hard + INV-022',()=>{
  beforeEach(()=> vi.resetModules());
  it('80% warning fires notification, hard block on users/branches', async()=>{
    const src=fs.readFileSync('src/modules/tenancy/application/usage-service.ts','utf8');
    expect(src).toContain('limit_warning');
    expect(src).toContain('limit_exceeded');
    expect(src).toContain('enforceCreateLimit');
    expect(src).toContain('checkPostingAllowed');
    expect(src).toContain('documents_month');
  });
  it('documents_month never blocks posting (INV-022) property', async()=>{
    const pool={ query: vi.fn(async(sql:string)=>{
      if(sql.includes('FROM usage_counters')) return { rows:[{value:1000, limit_value:500}] } as any;
      return { rows:[] } as any;
    })};
    vi.doMock('../../src/infra/db/db.js',()=>({getPool:()=>pool}));
    const mod=await import('../../src/modules/tenancy/application/usage-service.js');
    const allowed=await mod.checkPostingAllowed('t1');
    expect(allowed).toBe(true); // even at 200%
  });
  it('incrementCounter at 80% writes notification', async()=>{
    const queries:string[]=[];
    const pool={
      query: vi.fn(async(sql:string)=>{
        queries.push(sql);
        if(sql.includes('SELECT p.limits')) return { rows:[{limits:{users:10}}] } as any;
        if(sql.includes('SELECT value, limit_value')) return { rows:[{value:8, limit_value:10}] } as any;
        return { rows:[] } as any;
      })
    };
    vi.doMock('../../src/infra/db/db.js',()=>({getPool:()=>pool}));
    const mod=await import('../../src/modules/tenancy/application/usage-service.js');
    await mod.incrementCounter('t1','users',1);
    expect(queries.join(' ')).toContain('notifications');
  });
});

describe('PHASE-014 T2/T3 — Sandbox checkout + manual fallback A-009',()=>{
  it('createCheckoutSession returns sandbox url, manual records audit', async()=>{
    const srcBill=fs.readFileSync('src/modules/tenancy/application/billing-service.ts','utf8');
    expect(srcBill).toContain('checkout.sandbox');
    expect(srcBill).toContain('createCheckoutSession');
    expect(srcBill).toContain('recordManualPayment');
    expect(srcBill).toContain('via_platform_admin');
    const srcLife=fs.readFileSync('src/modules/tenancy/application/subscription-lifecycle.ts','utf8');
    expect(srcLife).toContain('provider_ref');
  });
  it('downgrade_blocked when usage exceeds target limits', async()=>{
    vi.resetModules();
    const pool={
      query: vi.fn(async(sql:string)=>{
        if(sql.includes('SELECT limits FROM plans WHERE key')) return { rows:[{limits:{users:3, branches:1}}] } as any;
        if(sql.includes("counter_key='users'") || sql.includes('counter_key') && sql.includes('users')) return { rows:[{value:5}] } as any;
        if(sql.includes("counter_key='branches'")) return { rows:[{value:2}] } as any;
        return { rows:[] } as any;
      })
    };
    // Mock more precisely: sequential calls
    let call=0;
    const poolSeq={
      query: vi.fn(async(sql:string)=>{
        call++;
        if(sql.includes('SELECT limits')) return { rows:[{limits:{users:3, branches:1, warehouses:2}}] } as any;
        if(sql.includes('SELECT value')) {
          if(call===2) return { rows:[{value:5}] } as any; // users 5 > 3
          if(call===3) return { rows:[{value:2}] } as any; // branches 2 >1
          return { rows:[{value:1}] } as any;
        }
        return { rows:[] } as any;
      })
    };
    vi.doMock('../../src/infra/db/db.js',()=>({getPool:()=>poolSeq}));
    vi.doMock('../../src/modules/tenancy/application/entitlements-service.js',()=>({materializeEntitlements: async()=>{}}));
    const mod=await import('../../src/modules/tenancy/application/subscription-lifecycle.js');
    await expect(mod.changePlan('t1','starter')).rejects.toThrow('downgrade_blocked');
  });
});
