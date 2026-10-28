/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion */
import { DataTable, Button } from '@erp/ui';
export default async function BranchesPage({ params }: { params: Promise<{ locale: string }> }): Promise<React.JSX.Element> {
  const { locale } = await params; const isAr=locale==='ar';
  const cols = [{ key:'code', header: isAr?'الرمز':'Code', accessor:(r: { id:string; code:string; name:string; is_active:boolean })=> r.code }, { key:'name', header: isAr?'الاسم':'Name', accessor:(r: { id:string; code:string; name:string; is_active:boolean })=>r.name }, { key:'active', header: isAr?'نشط':'Active', accessor:(r: { id:string; code:string; name:string; is_active:boolean })=> String(r.is_active) }];
  return (
    <main dir={isAr?'rtl':'ltr'} className="p-6">
      <h1 className="text-start text-xl font-bold">{isAr?'الفروع':'Branches'}</h1>
      <DataTable rows={[] as { id:string; code:string; name:string; is_active:boolean }[]} columns={cols as any} aria-label={isAr?'قائمة الفروع':'Branches list'} />
      <Button variant="secondary" className="mt-4">{isAr?'إضافة فرع':'Add branch'}</Button>
    </main>
  );
}
