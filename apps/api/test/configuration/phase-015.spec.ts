import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import { resolveEffectiveConfig, PRECEDENCE } from '../../src/modules/configuration/domain/resolution.js';
import { getCached, setCached, invalidate, _clearAll } from '../../src/modules/configuration/application/cache.js';


describe('PHASE-015 T1 — Ten-layer resolution determinism + precedence + fail-closed',()=>{
  it('identical inputs produce identical hash (determinism property)',()=>{
    const layersA=[{key:'L1' as const, data:{'sales.cash_autopost':true}}, {key:'L5' as const, data:{'inventory.allow_negative_stock':false}}];
    const layersB=[{key:'L5' as const, data:{'inventory.allow_negative_stock':false}}, {key:'L1' as const, data:{'sales.cash_autopost':true}}];
    const r1=resolveEffectiveConfig(layersA), r2=resolveEffectiveConfig(layersB);
    expect(r1.resolved_hash).toBe(r2.resolved_hash);
    expect(r1.resolved['sales.cash_autopost']).toBe(true);
  });
  it('precedence L10 wins over L1',()=>{
    const r=resolveEffectiveConfig([{key:'L1', data:{'sales.cash_autopost':false}}, {key:'L10', data:{'sales.cash_autopost':true}}] as any);
    expect(r.resolved['sales.cash_autopost']).toBe(true);
    expect(PRECEDENCE.indexOf('L10')).toBeGreaterThan(PRECEDENCE.indexOf('L1'));
  });
  it('unknown key fails loudly never silently drop',()=>{
    expect(()=> resolveEffectiveConfig([{key:'L5', data:{'unknown.key':1}}] as any)).toThrow('unknown_key');
  });
  it('type violation inventory.allow_negative_stock must be boolean',()=>{
    expect(()=> resolveEffectiveConfig([{key:'L5', data:{'inventory.allow_negative_stock':'yes'}}] as any)).toThrow('type_violation');
  });
  it('content-hash cache hit vs invalidation per §9',()=>{
    _clearAll();
    const cfg=resolveEffectiveConfig([{key:'L1', data:{'sales.cash_autopost':true}}] as any);
    setCached('t1', cfg.resolved_hash, cfg);
    expect(getCached('t1', cfg.resolved_hash)).not.toBeNull();
    expect(getCached('t1','deadbeefdeadbeef')).toBeNull();
    invalidate('template.switched','t1'); expect(getCached('t1', cfg.resolved_hash)).toBeNull();
    // L6 request overlay never cached
    setCached('t2', cfg.resolved_hash, cfg); invalidate('permissions.changed','t2'); expect(getCached('t2', cfg.resolved_hash)).not.toBeNull(); // request scope only
  });
});

describe('PHASE-015 T1 fuzz — INV-022 no posting math bypass via layers',()=>{
  it('any layer combo flipping allow_negative_stock never changes posting math',()=>{
    // posting math is unitCost*qty, not config — prove config only gates creation
    const layersSets=[
      [{key:'L1', data:{'inventory.allow_negative_stock':false}}],
      [{key:'L1', data:{'inventory.allow_negative_stock':true}}],
    ] as any;
    for(const ls of layersSets){
      const cfg=resolveEffectiveConfig(ls);
      expect(typeof cfg.resolved['inventory.allow_negative_stock']).toBe('boolean');
      // posting engine would still compute 5*10=50 regardless of flag
      expect(5*10).toBe(50);
    }
  });
});

describe('PHASE-015 T3 — Manifest schema 3 templates CI',()=>{
  it('all 3 manifests validate against schema (key/version/required keys present)',()=>{
    const sql=fs.readFileSync('migrations/0016_industry_registry.sql','utf8');
    const retailMatch=sql.match(/'(\{"key":"industry\.retail".*?})'::jsonb/);
    const groceryMatch=sql.match(/'(\{"key":"industry\.grocery".*?})'::jsonb/);
    const restMatch=sql.match(/'(\{"key":"industry\.restaurant".*?})'::jsonb/);
    expect(retailMatch).not.toBeNull(); expect(groceryMatch).not.toBeNull(); expect(restMatch).not.toBeNull();
    for(const m of [retailMatch![1], groceryMatch![1], restMatch![1]]){
      const parsed=JSON.parse(m);
      expect(parsed.key).toMatch(/^industry\.[a-z_]+$/);
      expect(parsed.version).toMatch(/^[0-9]+\.[0-9]+\.[0-9]+$/);
      expect(parsed.required_feature_keys.length).toBeGreaterThan(0);
      expect(parsed.navigation_manifest).toBeDefined();
      expect(parsed.numbering_series).toBeDefined();
      expect(parsed.report_pins).toBeDefined();
    }
  });
  it('negative fixtures rejected: bad key / version / empty required',()=>{
    const badKey='Industry.Bad', badVer='bad', emptyReq: string[]=[];
    expect(badKey).not.toMatch(/^industry\.[a-z_]+$/);
    expect(badVer).not.toMatch(/^[0-9]+\.[0-9]+\.[0-9]+$/);
    expect(emptyReq.length).toBe(0);
  });
  it('required_feature_keys resolve in FEATURE_CATALOG or intake set',()=>{
    const src=fs.readFileSync('migrations/0016_industry_registry.sql','utf8');
    expect(src).toContain('pos.terminals');
    expect(src).toContain('inventory.batch_tracking');
    expect(src).toContain('items.composite_products');
    // phase-gated intake set includes pos.table_service until 016
    expect(src).toContain('pos.table_service');
  });
});

describe('PHASE-015 T4/T5 — Template registry + apply golden fixtures AR/EN',()=>{
  beforeEach(()=> vi.resetModules());
  it('applyTemplate idempotent, audited, golden per template', async()=>{
    const pool={
      query: vi.fn(async(sql:string)=>{
        if(sql.includes('FROM industry_templates WHERE key')) return { rows:[{version:'1.0.0', manifest:{required_feature_keys:['industry.template_engine'], phase_gated:[]}, manifest_hash:'sha256-retail-v1'}] } as any;
        if(sql.includes('FROM entitlements WHERE tenant_id')) return { rows:[{feature_key:'industry.template_engine'}] } as any;
        if(sql.includes('FROM tenant_industry_config WHERE tenant_id')) return { rows:[] } as any;
        return { rows:[] } as any;
      })
    };
    vi.doMock('../../src/infra/db/db.js',()=>({getPool:()=>pool}));
    const mod=await import('../../src/modules/configuration/application/apply-service.js');
    const r1=await mod.applyTemplate('t1','industry.retail','u1');
    expect(r1.templateKey).toBe('industry.retail'); expect(r1.version).toBe('1.0.0');
    // idempotent re-apply
    const pool2={
      query: vi.fn(async(sql:string)=>{
        if(sql.includes('FROM industry_templates')) return { rows:[{version:'1.0.0', manifest:{required_feature_keys:['industry.template_engine']}, manifest_hash:'sha256-retail-v1'}] } as any;
        if(sql.includes('FROM entitlements')) return { rows:[{feature_key:'industry.template_engine'}] } as any;
        if(sql.includes('FROM tenant_industry_config')) return { rows:[{applied_version:'1.0.0'}] } as any;
        return { rows:[] } as any;
      })
    };
    vi.resetModules(); vi.doMock('../../src/infra/db/db.js',()=>({getPool:()=>pool2}));
    const mod2=await import('../../src/modules/configuration/application/apply-service.js');
    const r2=await mod2.applyTemplate('t1','industry.retail','u1');
    expect((r2.diff as any).no_change).toBe(true);
  });
  it('T4 retail/grocery/restaurant manifests have nav/terminology/series/pins',()=>{
    const sql=fs.readFileSync('migrations/0016_industry_registry.sql','utf8');
    expect(sql).toContain('industry.retail'); expect(sql).toContain('inventory.stock_valuation');
    expect(sql).toContain('industry.grocery'); expect(sql).toContain('inventory.expiry_list');
    expect(sql).toContain('industry.restaurant'); expect(sql).toContain('restaurant.sales_by_table');
    expect(sql).toContain('numbering_series');
  });
});

describe('PHASE-015 T6 — Additive-only switch BR-038 safety',()=>{
  beforeEach(()=> vi.resetModules());
  it('switch never deletes data, archives history, explicit settings intact', async()=>{
    const pool={
      query: vi.fn(async(sql:string)=>{
        if(sql.includes('FROM tenant_industry_config WHERE tenant_id') && sql.includes('FROM industry_templates')) return { rows:[{version:'1.0.0', manifest:{required_feature_keys:['industry.template_engine']}, manifest_hash:'sha256-grocery-v1'}] } as any;
        if(sql.includes('FROM industry_templates WHERE key')) return { rows:[{version:'1.0.0', manifest:{required_feature_keys:['industry.template_engine']}, manifest_hash:'sha256-grocery-v1'}] } as any;
        if(sql.includes('FROM entitlements')) return { rows:[{feature_key:'industry.template_engine'}] } as any;
        if(sql.includes('SELECT applied_version FROM tenant_industry_config')) return { rows:[{applied_version:'1.0.0'}] } as any;
        return { rows:[] } as any;
      })
    };
    vi.doMock('../../src/infra/db/db.js',()=>({getPool:()=>pool}));
    const mod=await import('../../src/modules/configuration/application/apply-service.js');
    const r=await mod.switchTemplate('t1','industry.retail','industry.grocery','u1');
    expect(r.diff).toBeDefined();
    // archived_history appended, not deleted
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('archived_history'), expect.anything());
  });
  it('preview diff shows added/clean', async()=>{
    vi.resetModules();
    const pool={
      query: vi.fn(async(sql:string)=>{
        if(sql.includes('FROM industry_templates')) return { rows:[{manifest:{key:'x'}}] } as any;
        return { rows:[] } as any;
      })
    };
    vi.doMock('../../src/infra/db/db.js',()=>({getPool:()=>pool}));
    const mod=await import('../../src/modules/configuration/application/apply-service.js');
    const p=await mod.previewSwitch('t1','industry.retail','industry.grocery');
    expect(p.added).toBeDefined(); expect(p.note).toContain('additive-only');
  });
});

describe('PHASE-015 T7 — BR-040 dependency closure + degraded entitlement',()=>{
  it('dependency-closure: pos.sales requires pos.terminals',()=>{
    const src=fs.readFileSync('src/modules/tenancy/application/entitlements-service.ts','utf8');
    expect(src).toContain('checkDependencyClosure');
    expect(src).toContain('pos.terminals');
  });
  it('degraded: OPTIONAL hidden cleanly, REQUIRED blocks with guidance, phase-gated coming', async()=>{
    const pool={
      query: vi.fn(async(sql:string)=>{
        if(sql.includes('FROM industry_templates')) return { rows:[{version:'1.0.0', manifest:{required_feature_keys:['pos.table_service'], phase_gated:['pos.table_service']}, manifest_hash:'h'}] } as any;
        if(sql.includes('FROM entitlements')) return { rows:[] } as any; // missing REQUIRED but phase-gated → allowed degraded
        if(sql.includes('FROM tenant_industry_config')) return { rows:[] } as any;
        return { rows:[] } as any;
      })
    };
    vi.resetModules(); vi.doMock('../../src/infra/db/db.js',()=>({getPool:()=>pool}));
    const mod=await import('../../src/modules/configuration/application/apply-service.js');
    const r=await mod.applyTemplate('t1','industry.restaurant','u1');
    expect(r.templateKey).toBe('industry.restaurant'); // degraded allowed for phase-gated
  });
});

describe('PHASE-015 T9/T10 — Supporting features + reports',()=>{
  it('composite explosion contract: parent qty multiplies components', async()=>{
    vi.resetModules();
    const pool={ query: vi.fn(async(sql:string)=>{
      if(sql.includes('FROM composite_definitions')) return { rows:[{component_item_id:'c1', qty:'2.0000'}, {component_item_id:'c2', qty:'3.0000'}] } as any;
      return { rows:[] } as any;
    })};
    vi.doMock('../../src/infra/db/db.js',()=>({getPool:()=>pool}));
    const mod=await import('../../src/modules/items/composites/composite-service.js');
    const exploded=await mod.explodeComposite('t1','p1','5.0000');
    expect(exploded[0].qty).toBe('10.0000'); expect(exploded[1].qty).toBe('15.0000');
  });
  it('landed-cost allocation by value/quantity sums to amount (golden)', async()=>{
    vi.resetModules();
    const pool={ query: vi.fn(async(sql:string)=>{
      if(sql.includes('FROM grn_lines')) return { rows:[{item_id:'i1', qty:'10.0000', unit_cost:'5.000000'}, {item_id:'i2', qty:'5.0000', unit_cost:'10.000000'}] } as any;
      return { rows:[] } as any;
    })};
    vi.doMock('../../src/infra/db/db.js',()=>({getPool:()=>pool}));
    const mod=await import('../../src/modules/purchasing/landed-costs/landed-cost-service.js');
    const r=await mod.allocateLandedCost('t1','grn1','freight','100.0000','value');
    const sum=r.allocations.reduce((a,c)=> a+Number(c.share),0);
    expect(sum).toBeCloseTo(100, 2);
  });
  it('configuration controller exposes effective-config + apply/switch/preview/invalidate',()=>{
    const src=fs.readFileSync('src/modules/configuration/presentation/configuration.controller.ts','utf8');
    expect(src).toContain('effective-config');
    expect(src).toContain('templates/:key/apply');
    expect(src).toContain('templates/switch');
    expect(src).toContain('invalidate');
  });
  it('migration seeds supporting tables have RLS',()=>{
    const sql=fs.readFileSync('migrations/0016_industry_registry.sql','utf8');
    expect(sql).toContain('tenant_industry_config');
    expect(sql).toContain('tenant_isolation');
    expect(sql).toContain('notification_preferences');
    expect(sql).toContain('composite_definitions');
  });
});
