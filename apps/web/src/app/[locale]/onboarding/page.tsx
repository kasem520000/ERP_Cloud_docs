export default async function OnboardingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; const isAr = locale === 'ar';
  return (
    <main dir={isAr ? 'rtl' : 'ltr'} className="p-6">
      <h1 className="text-xl font-bold">{isAr ? 'معالج التهيئة' : 'Onboarding Wizard'}</h1>
      <p className="text-sm text-gray-500">{isAr ? 'إنشاء دليل الحسابات والأدوار والإعدادات' : 'Instantiate CoA, roles, numbering, jurisdiction'}</p>
      <div className="mt-4 border rounded p-4 text-sm">{isAr ? 'سيتم إنشاء 12 حسابًا و 7 أغراض بشكل idempotent' : 'Will create 12 accounts + 7 purposes idempotently'}</div>
    </main>
  );
}
