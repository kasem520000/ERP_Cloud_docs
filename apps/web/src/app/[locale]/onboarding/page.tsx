import { Button } from '@erp/ui';
export default async function OnboardingPage({ params }: { params: Promise<{ locale: string }> }): Promise<React.JSX.Element> {
  const { locale } = await params; const isAr=locale==='ar';
  return (
    <main dir={isAr?'rtl':'ltr'} className="p-6">
      <h1 className="text-start text-xl font-bold">{isAr?'معالج التهيئة':'Onboarding Wizard'}</h1>
      <p className="text-start text-sm text-[var(--erp-color-gray-600)]">{isAr?'إنشاء دليل الحسابات والأدوار':'Instantiate CoA, roles, numbering, jurisdiction'}</p>
      <div className="mt-4 border border-[var(--erp-border-subtle)] rounded-[var(--erp-radius-md)] p-4 text-sm text-start">{isAr?'12 حسابًا و 7 أغراض — idempotent':'12 accounts + 7 purposes — idempotent'}</div>
      <Button variant="primary" className="mt-4">{isAr?'متابعة':'Continue'}</Button>
    </main>
  );
}
