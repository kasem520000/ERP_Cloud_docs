import { SearchInput, Button, Tabs, Badge } from '@erp/ui';
export default async function AdminTenantsPage({ params }: { params: Promise<{ locale: string }> }): Promise<React.JSX.Element> {
  const { locale } = await params; const isAr=locale==='ar';
  return (
    <main dir={isAr?'rtl':'ltr'} className="p-6">
      <h1 className="text-start text-xl font-bold">{isAr?'وحدة تحكم المنصة — المستأجرون':'Platform Console — Tenants'}</h1>
      <Tabs tabs={[{ id:'all', label: isAr?'الكل':'All' }, { id:'suspended', label: isAr?'معلق':'Suspended' }]} activeId="all" />
      <SearchInput placeholder={isAr?'بحث المستأجرين...':'Search tenants...'} className="mt-4 max-w-md" />
      <div className="mt-4 flex gap-2"><Button variant="secondary">{isAr?'تعليق':'Suspend'}</Button><Button variant="primary">{isAr?'استعادة':'Restore'}</Button><Badge tone="info">{isAr?'2 معلق':'2 suspended'}</Badge></div>
      <p className="mt-4 text-start text-xs text-[var(--erp-color-gray-500)]">PlatformScope audited · via_platform_admin</p>
    </main>
  );
}
