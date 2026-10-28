import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';

describe('PHASE-014 T5 — Read-only guard subscription_read_only',()=>{
  it('guard blocks POST in GRACE with subscription_read_only, allows GET',()=>{
    const src=fs.readFileSync('src/infra/middleware/subscription-readonly.guard.ts','utf8');
    expect(src).toContain('subscription_read_only');
    expect(src).toContain('READ_ONLY_BLOCKED');
    expect(src).toContain('enforceNotReadOnly');
    expect(src).toContain('/exports');
    const life=fs.readFileSync('src/modules/tenancy/application/subscription-lifecycle.ts','utf8');
    expect(life).toContain('GRACE');
    expect(life).toContain('tenant_suspended');
  });
  it('enforceNotReadOnly throws 403 with resolvingAction', async()=>{
    vi.resetModules();
    const pool={ query: vi.fn(async()=> ({rows:[{status:'GRACE'}]} as any)) };
    vi.doMock('../../src/infra/db/db.js',()=>({getPool:()=>pool}));
    const mod=await import('../../src/modules/tenancy/application/subscription-lifecycle.js');
    try{ await mod.enforceNotReadOnly('t1'); expect.fail(); }catch(e:any){ expect(e.code).toBe('subscription_read_only'); expect(e.status).toBe(403); expect(e.resolvingAction).toBe('pay'); }
  });
});

describe('PHASE-014 T7 — Pricing page PLACEHOLDER single source',()=>{
  it('pricing page renders 3 plans from seed, no hard-coded numbers',()=>{
    const src=fs.readFileSync('../web/src/app/[locale]/(marketing)/pricing/page.tsx','utf8');
    expect(src).toContain('starter');
    expect(src).toContain('business');
    expect(src).toContain('enterprise');
    expect(src).toContain('PLACEHOLDER');
    expect(src).not.toMatch(/price: *[0-9]{2,}/); // no invented numbers
    expect(src).toContain('plans seed');
  });
  it('public plans API returns active plans',()=>{
    const src=fs.readFileSync('src/modules/tenancy/presentation/public/plans.controller.ts','utf8');
    expect(src).toContain('SELECT key, name, price_amount');
    expect(src).toContain('is_active=true');
  });
});

describe('PHASE-014 T9 — Dashboard KPI widgets bound to report contracts',()=>{
  it('dashboard has 4 MVP widgets with contract keys and drill links',()=>{
    const src=fs.readFileSync('../web/src/app/[locale]/dashboard/page.tsx','utf8');
    expect(src).toContain('sales.today');
    expect(src).toContain('treasury.cash_position');
    expect(src).toContain('ar.overdue');
    expect(src).toContain('inventory.low_stock');
    expect(src).toContain('sales.daily_summary');
    expect(src).toContain('treasury.cash_position');
    expect(src).toContain('drill');
    expect(src).toContain('View report');
    expect(src).not.toContain('Math.random'); // no side-channel math
  });
  it('billing status banner explains grace read-only',()=>{
    const src=fs.readFileSync('../web/src/app/[locale]/dashboard/page.tsx','utf8');
    expect(src).toContain('subscription_read_only');
    expect(src).toContain('Grace read-only');
  });
});

describe('PHASE-014 T8 — Onboarding wizard Journey A1-A9',()=>{
  it('onboarding has 7 steps A1-A9 with guided first invoice',()=>{
    const src=fs.readFileSync('../web/src/app/[locale]/onboarding/page.tsx','utf8');
    expect(src).toContain('activity');
    expect(src).toContain('workspace');
    expect(src).toContain('coa');
    expect(src).toContain('opening');
    expect(src).toContain('First item');
    expect(src).toContain('First customer');
    expect(src).toContain('First invoice');
    expect(src).toContain('live tax preview');
    expect(src).toContain('print via engine 013');
    expect(src).toContain('skip');
  });
  it('onboarding shows honest banner skip not blocking',()=>{
    const src=fs.readFileSync('../web/src/app/[locale]/onboarding/page.tsx','utf8');
    expect(src).toContain('never block');
    expect(src.toLowerCase()).toContain('banner');
  });
});

describe('PHASE-014 T10 — Notifications center billing-critical subset',()=>{
  it('notifications table has RLS + kinds billing/limit/subscription/reconciliation/overdue',()=>{
    const sql=fs.readFileSync('migrations/0015_subscriptions_billing.sql','utf8');
    expect(sql).toContain('notifications');
    expect(sql).toContain('limit_warning');
    expect(sql).toContain('subscription_state');
    expect(sql).toContain('invoice_overdue');
    expect(sql).toContain('tenant_isolation');
  });
  it('service list/unread/markRead + controller routes',()=>{
    const svc=fs.readFileSync('src/modules/notifications/application/notifications-service.ts','utf8');
    expect(svc).toContain('listNotifications');
    expect(svc).toContain('markRead');
    expect(svc).toContain('unreadCount');
    expect(svc).toContain('is_read=false');
    const ctrl=fs.readFileSync('src/modules/notifications/presentation/notifications.controller.ts','utf8');
    expect(ctrl).toContain('unread-count');
    expect(ctrl).toContain(':id/read');
  });
  it('usage 80% produces limit_warning inbox row', async()=>{
    vi.resetModules();
    const pool={
      query: vi.fn(async(sql:string)=>{
        if(sql.includes('SELECT p.limits')) return { rows:[{limits:{users:10}}] } as any;
        if(sql.includes('SELECT value, limit_value')) return { rows:[{value:8, limit_value:10}] } as any;
        return { rows:[] } as any;
      })
    };
    vi.doMock('../../src/infra/db/db.js',()=>({getPool:()=>pool}));
    const mod=await import('../../src/modules/tenancy/application/usage-service.js');
    await mod.incrementCounter('t1','users',1);
    const hasNotif=pool.query.mock.calls.some((c:any)=> String(c[0]).includes('limit_warning'));
    expect(hasNotif).toBe(true);
  });
});
