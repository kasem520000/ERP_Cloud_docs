import { DataTable, SearchInput, Button, EmptyState } from '@erp/ui';
export default async function UsersPage({ params }: { params: Promise<{ locale: string }> }): Promise<React.JSX.Element> {
  const { locale } = await params; const isAr = locale === 'ar';
  const columns = [{ key:'email', header: isAr ? 'البريد' : 'Email', accessor: (r: { email: string; role: string })=> r.email }, { key:'role', header: isAr ? 'الدور':'Role', accessor: (r: { email: string; role: string })=> r.role }];
  return (
    <main dir={isAr?'rtl':'ltr'} className="p-6">
      <h1 className="text-start text-xl font-bold">{isAr?'المستخدمون':'Users'}</h1>
      <SearchInput placeholder={isAr?'بحث...':'Search...'} className="mt-4 max-w-md" />
      <DataTable rows={[]} columns={columns} aria-label={isAr?'قائمة المستخدمين':'Users list'} />
      <EmptyState title={isAr?'لا يوجد مستخدمون':'No users'} />
      <Button variant="secondary" className="mt-4">{isAr?'دعوة مستخدم':'Invite user'}</Button>
    </main>
  );
}
