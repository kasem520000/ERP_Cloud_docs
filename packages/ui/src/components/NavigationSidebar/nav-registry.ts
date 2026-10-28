export type NavGroupId = 'home'|'sales'|'purchasing'|'inventory'|'accounting'|'treasury'|'reports'|'partners'|'settings';
export type NavItem = { id: string; parentGroup: NavGroupId; label: { ar:string; en:string }; icon: string; route: string; featureKey?: string; permission?: string; branchScoped: boolean; archetype: string; order: number };
export const navGroups: { id: NavGroupId; label: { ar:string; en:string }; order: number }[] = [
  { id:'home', label:{ar:'الرئيسية',en:'Home'}, order:1 },
  { id:'sales', label:{ar:'المبيعات',en:'Sales'}, order:2 },
  { id:'purchasing', label:{ar:'المشتريات',en:'Purchasing'}, order:3 },
  { id:'inventory', label:{ar:'المخزون',en:'Inventory'}, order:4 },
  { id:'accounting', label:{ar:'المحاسبة',en:'Accounting'}, order:5 },
  { id:'treasury', label:{ar:'الخزينة',en:'Treasury'}, order:6 },
  { id:'reports', label:{ar:'التقارير',en:'Reports'}, order:7 },
  { id:'partners', label:{ar:'الجهات',en:'Partners'}, order:8 },
  { id:'settings', label:{ar:'الإعدادات',en:'Settings'}, order:9 },
];
export function resolveNav(items: NavItem[], entitlements: Set<string>, permissions: Set<string>): NavItem[] {
  return items.filter(i => (!i.featureKey || entitlements.has(i.featureKey)) && (!i.permission || permissions.has(i.permission)));
}
export function groupsWithVisibleChildren(groups: typeof navGroups, visible: NavItem[]): typeof navGroups {
  return groups.filter(g => visible.some(v => v.parentGroup === g.id));
}
