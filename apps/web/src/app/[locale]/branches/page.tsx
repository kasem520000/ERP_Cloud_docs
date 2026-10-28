export default async function BranchesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; const isAr = locale === 'ar';
  return (
    <main dir={isAr ? 'rtl' : 'ltr'} className="p-6">
      <h1 className="text-xl font-bold">{isAr ? 'الفروع' : 'Branches'}</h1>
      <table className="mt-4 w-full border text-sm"><thead><tr><th className="border p-2">{isAr ? 'الرمز' : 'Code'}</th><th className="border p-2">{isAr ? 'الاسم' : 'Name'}</th><th className="border p-2">{isAr ? 'نشط' : 'Active'}</th></tr></thead><tbody><tr><td className="border p-2" colSpan={3}>{isAr ? 'لا يوجد فروع' : 'No branches'}</td></tr></tbody></table>
    </main>
  );
}
