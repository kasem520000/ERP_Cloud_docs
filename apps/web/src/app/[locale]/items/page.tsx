import { DataTable, SearchInput, Button, EmptyState } from '@erp/ui';
export default async function ItemsPage({ params }: { params: Promise<{ locale: string }> }): Promise<React.JSX.Element> {
  const { locale } = await params; const isAr = locale === 'ar';
  const cols = [
    { key:'sku', header: isAr?'الرمز':'SKU', accessor:(r: { sku:string })=> r.sku },
    { key:'name', header: isAr?'الاسم':'Name', accessor:(r: { name:string })=> r.name },
    { key:'kind', header: isAr?'النوع':'Kind', accessor:(r: { kind:string })=> r.kind },
  ];
  return (
    <main dir={isAr?'rtl':'ltr'} className="p-6">
      <h1 className="text-start text-xl font-bold">{isAr?'الأصناف':'Items'}</h1>
      <SearchInput placeholder={isAr?'بحث الأصناف…':'Search items…'} className="mt-4 max-w-md" />
      <DataTable rows={[]} columns={cols} aria-label={isAr?'قائمة الأصناف':'Items list'} />
      <EmptyState>{isAr?'لا يوجد أصناف':'No items'}</EmptyState>
      <Button variant="secondary" className="mt-4">{isAr?'إضافة صنف':'Add item'}</Button>
      <p className="mt-2 text-xs text-[var(--erp-color-gray-500)] text-start">{isAr?'حقل الضريبة بدون قيد حتى المرحلة 009':'Tax code FK deferred to PHASE-009'}</p>
    </main>
  );
}
