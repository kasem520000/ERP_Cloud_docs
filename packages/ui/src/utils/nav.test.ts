import { describe, it, expect } from 'vitest';
import { resolveNav, groupsWithVisibleChildren, navGroups, NavItem } from '../components/NavigationSidebar/nav-registry';
const items: NavItem[] = [
  { id:'sales.invoices', parentGroup:'sales', label:{ar:'فواتير',en:'Invoices'}, icon:'receipt', route:'sales/invoices', featureKey:'sales.invoices', permission:'sales.invoices.view', branchScoped:false, archetype:'list', order:1 },
  { id:'sales.quotations', parentGroup:'sales', label:{ar:'عروض',en:'Quotations'}, icon:'file', route:'sales/quotations', featureKey:'sales.quotations', permission:'sales.quotations.view', branchScoped:false, archetype:'list', order:2 },
];
describe('nav resolution (entitlement AND permission)',()=>{
  it('entitlement+permission both required',()=>{ expect(resolveNav(items, new Set(['sales.invoices']), new Set(['sales.invoices.view'])).length).toBe(1); });
  it('missing entitlement → hidden',()=>{ expect(resolveNav(items, new Set(), new Set(['sales.invoices.view'])).length).toBe(0); });
  it('missing permission → hidden',()=>{ expect(resolveNav(items, new Set(['sales.invoices']), new Set()).length).toBe(0); });
  it('group with zero visible children never renders',()=>{ const v=resolveNav(items, new Set(), new Set()); expect(groupsWithVisibleChildren(navGroups as any, v as any).find(g=>g.id==='sales')).toBeUndefined(); });
  it('9 groups in binding order',()=>{ expect(navGroups.length).toBe(9); expect(navGroups[0]!.id).toBe('home'); expect(navGroups[8]!.id).toBe('settings'); });
  it('ungranted routes are opaque (not in resolved list)',()=>{ const v=resolveNav(items, new Set(['sales.invoices']), new Set(['sales.invoices.view'])); expect(v.find(i=>i.id==='sales.quotations')).toBeUndefined(); });
});
