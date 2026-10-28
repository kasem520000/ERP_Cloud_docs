export default async function OnboardingPage({params}:{params: Promise<{locale:string}>}){
  const {locale}=await params; const isAr=locale==='ar';
  const steps=[
    {k:'activity', label:isAr?'اختر نشاطك':'Pick activity', desc:isAr?'تجارة / خدمات / مطعم':'Trade / Services / Restaurant'},
    {k:'workspace', label:isAr?'معاينة مساحة العمل':'Workspace preview', desc:isAr?'فروع + شجرة حسابات':'Branches + CoA'},
    {k:'coa', label:isAr?'تأكيد شجرة الحسابات':'Confirm CoA', desc:isAr?'12 حساب أساسي + ترقيم':'12 accounts + numbering'},
    {k:'opening', label:isAr?'أرصدة افتتاحية (اختياري)':'Opening balances (skip)', desc:isAr?'يمكن التخطي مع تذكير':'Skippable with banner'},
    {k:'item', label:isAr?'أول صنف':'First item', desc:isAr?'SKU + وحدة + ضريبة':'SKU + UoM + tax'},
    {k:'customer', label:isAr?'أول عميل':'First customer', desc:isAr?'جهة اتصال + شروط':'Contact + terms'},
    {k:'invoice', label:isAr?'أول فاتورة — معاينة ضريبة حية':'First invoice — live tax preview', desc:isAr?'إنشاء → ترحيل → طباعة':'Create → post → print via engine 013'},
  ];
  return (
    <main dir={isAr?'rtl':'ltr'} lang={locale} className="min-h-screen p-8 bg-surface">
      <h1 className="text-2xl font-bold">{isAr?'معالج الإعداد — الرحلة A':'Onboarding Wizard — Journey A'}</h1>
      <p className="text-sm text-muted-foreground mt-2">{isAr?'A1→A9 في جلسة واحدة بلا مساعدة':'A1→A9 unassisted in one session — completion tracked, skip honest & resumable'}</p>
      <ol className="mt-8 space-y-4">
        {steps.map((s,i)=>(
          <li key={s.k} className="border rounded-lg p-4 flex gap-4 bg-card">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm">{i+1}</span>
            <div className="flex-1">
              <div className="font-medium">{s.label}</div>
              <div className="text-sm text-muted-foreground">{s.desc}</div>
            </div>
            <a href={`/${locale}/onboarding/${s.k}`} className="self-center text-sm underline">{isAr?'متابعة':'Continue'}</a>
          </li>
        ))}
      </ol>
      <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
        {isAr?'تذكير: يمكنك تخطي الأرصدة الافتتاحية وإكمالها لاحقاً — لن نحجبك':'Reminder: you may skip opening balances — banner will remind, never block'}
      </div>
      <div className="mt-4 flex gap-3">
        <a href={`/${locale}/sales/invoices/new`} className="px-4 py-2 bg-primary text-white rounded">{isAr?'إنشاء أول فاتورة':'Create first invoice'}</a>
        <a href={`/${locale}/dashboard`} className="px-4 py-2 border rounded">{isAr?'تخطي إلى اللوحة':'Skip to dashboard'}</a>
      </div>
    </main>
  );
}
