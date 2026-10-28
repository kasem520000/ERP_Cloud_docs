import { DataTable, SearchInput, Button, EmptyState, Badge } from '@erp/ui';
export default async function PartnersPage({ params }: { params: Promise<{ locale: string }> }): Promise<React.JSX.Element> {
  const { locale } = await params; const isAr = locale === 'ar';
  const cols = [
    { key:'code', header: isAr?'الرمز':'Code', accessor:(r: { code:string })=> r.code },
    { key:'name', header: isAr?'الاسم':'Name', accessor:(r: { name:string })=> r.name },
    { key:'kind', header: isAr?'النوع':'Kind', accessor:(r: { kind:string })=> r.kind },
  ];
  return (
    <main dir={isAr?'rtl':'ltr'} className="p-6">
      <h1 className="text-start text-xl font-bold">{isAr?'الجهات':'Partners'}</h1>
      <SearchInput placeholder={isAr?'بحث الجهات…':'Search partners…'} className="mt-4 max-w-md" />
      <DataTable rows={[]} columns={cols} aria-label={isAr?'قائمة الجهات':'Partners list'} />
      <EmptyState>{isAr?'لا يوجد جهات':'No partners'}</EmptyState>
      <Button variant="secondary" className="mt-4">{isAr?'إضافة جهة':'Add partner'}</Button>
      <Badge tone="info" className="ms-2">{isAr?'مسودة الأرصدة فقط':'Draft balances only'}</Badge>
    </main>
  );
}
