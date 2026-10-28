export default async function UsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isAr = locale === 'ar';
  return (
    <main dir={isAr ? 'rtl' : 'ltr'} className="p-6">
      <h1 className="text-xl font-bold">{isAr ? 'المستخدمون' : 'Users'}</h1>
      <p className="text-sm text-gray-500">{isAr ? 'إدارة المستخدمين والأدوار' : 'Manage users and roles'}</p>
      <table className="mt-4 w-full border text-sm">
        <thead><tr><th className="border p-2">{isAr ? 'البريد' : 'Email'}</th><th className="border p-2">{isAr ? 'الدور' : 'Role'}</th><th className="border p-2">{isAr ? 'الحالة' : 'Status'}</th></tr></thead>
        <tbody><tr><td className="border p-2" colSpan={3}>{isAr ? 'لا يوجد بيانات' : 'No data'}</td></tr></tbody>
      </table>
    </main>
  );
}
