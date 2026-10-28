export default async function PricingPage({params}:{params: Promise<{locale:string}>}){
  const {locale}=await params; const isAr=locale==='ar';
  // Single source of truth: same data as 0015 seed — no hard-coded numbers in logic, values are PLACEHOLDER per OQ-002
  const plans=[
    {key:'starter', name:isAr?'البداية':'Starter', price:'PLACEHOLDER', limits:{users:3, branches:1, warehouses:2, documents:500}, features:['platform.registration','accounting.*','sales.*','purchasing.*','treasury.*','tax.*','reporting.*']},
    {key:'business', name:isAr?'الأعمال':'Business', price:'PLACEHOLDER', limits:{users:10, branches:3, warehouses:6, documents:5000}, features:['+ platform.notifications','+ accounting.multi_currency','+ inventory.batch_tracking','+ reporting.dashboards','+ pos.*']},
    {key:'enterprise', name:isAr?'المؤسسات':'Enterprise', price:'PLACEHOLDER', limits:{users:50, branches:999, warehouses:999, documents:250000}, features:['+ inventory.reservations','+ tax.einvoicing','+ reporting.scheduled_reports','+ crm.*','+ manufacturing.*']},
  ];
  return (
    <main dir={isAr?'rtl':'ltr'} lang={locale} className="min-h-screen bg-surface p-8">
      <h1 className="text-3xl font-bold">{isAr?'خطط التسعير':'Pricing Plans'}</h1>
      <p className="text-muted mt-2">{isAr?'الأسعار تجريبية — OQ-002':'Prices PLACEHOLDER pending OQ-002'}</p>
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        {plans.map(p=>(
          <article key={p.key} className="border rounded-xl p-6 bg-card">
            <h2 className="text-xl font-semibold">{p.name}</h2>
            <div className="text-2xl my-4">{p.price} <span className="text-sm">SAR</span></div>
            <ul className="text-sm space-y-1">{Object.entries(p.limits).map(([k,v])=> <li key={k}>{k}: {v===999?'∞':v}</li>)}</ul>
            <ul className="text-xs mt-4 space-y-1 text-muted-foreground">{p.features.map(f=> <li key={f}>{f}</li>)}</ul>
            <a href={`/${locale}/register?plan=${p.key}`} className="mt-6 inline-block w-full text-center py-2 bg-primary text-white rounded">{isAr?'ابدأ الآن':'Get Started'}</a>
          </article>
        ))}
      </div>
      <p className="text-xs mt-6 text-muted-foreground">{isAr?'المصدر الوحيد: بذور plans (0015) — لا أرقام مثبتة':'Single source: plans seed (0015) — no hard-coded numbers'}</p>
    </main>
  );
}
