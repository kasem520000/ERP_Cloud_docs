import { Button } from '@erp/ui';
export default async function ImportPage({ params }: { params: Promise<{ locale: string }> }): Promise<React.JSX.Element> {
  const { locale } = await params; const isAr = locale === 'ar';
  const steps = isAr ? ['رفع','تعيين','معاينة','تأكيد'] : ['Upload','Map','Preview','Commit'];
  return (
    <main dir={isAr?'rtl':'ltr'} className="p-6">
      <h1 className="text-start text-xl font-bold">{isAr?'الاستيراد — معالج':'Import — Wizard'}</h1>
      <ol className="mt-4 flex gap-2">
        {steps.map(s => <li key={s} className="px-3 py-1 border rounded text-sm">{s}</li>)}
      </ol>
      <div className="mt-6 p-4 border rounded">
        <p className="text-start text-sm">{isAr?'ارفع CSV/XLSX ثم شاهد المعاينة الجافة':'Upload CSV/XLSX then dry-run preview'}</p>
        <Button variant="secondary" className="mt-3">{isAr?'اختيار ملف':'Choose file'}</Button>
        <p className="mt-2 text-xs text-[var(--erp-color-gray-500)] text-start">{isAr?'حد 5000 صف · كشف التكرار · مسود محمي':'Bounded 5000 rows · duplicate detection · token-idempotent'}</p>
      </div>
    </main>
  );
}
