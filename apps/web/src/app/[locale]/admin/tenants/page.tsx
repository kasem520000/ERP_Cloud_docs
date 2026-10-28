export default async function AdminTenantsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; const isAr = locale === 'ar';
  return (
    <main dir={isAr ? 'rtl' : 'ltr'} className="p-6">
      <h1 className="text-xl font-bold">{isAr ? 'وحدة تحكم المنصة — المستأجرون' : 'Platform Console — Tenants'}</h1>
      <input placeholder={isAr ? 'بحث المستأجرين...' : 'Search tenants...'} className="mt-4 w-full max-w-md border p-2 rounded" />
      <div className="mt-4 flex gap-2"><button className="border px-3 py-1 rounded bg-yellow-100">{isAr ? 'تعليق' : 'Suspend'}</button><button className="border px-3 py-1 rounded bg-green-100">{isAr ? 'استعادة' : 'Restore'}</button><button className="border px-3 py-1 rounded">{isAr ? 'سجل التدقيق' : 'Audit'}</button></div>
      <p className="mt-4 text-xs text-gray-500">PlatformScope audited · via_platform_admin</p>
    </main>
  );
}
