import { Button, EmptyState } from '@erp/ui';
export default async function OpeningBalancesPage({ params }: { params: Promise<{ locale: string }> }): Promise<React.JSX.Element> {
  const { locale } = await params; const isAr = locale === 'ar';
  return (
    <main dir={isAr?'rtl':'ltr'} className="p-6">
      <h1 className="text-start text-xl font-bold">{isAr?'الأرصدة الافتتاحية — مسودة':'Opening Balances — Draft'}</h1>
      <p className="text-start text-sm text-[var(--erp-color-gray-500)]">{isAr?'لا يتم الترحيل هنا — المرحلة 007':'No posting here — PHASE-007'}</p>
      <EmptyState>{isAr?'لا توجد مسودات':'No drafts'}</EmptyState>
      <Button variant="secondary" className="mt-4">{isAr?'إضافة مسودة':'Add draft'}</Button>
    </main>
  );
}
