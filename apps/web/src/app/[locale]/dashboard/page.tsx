export default async function DashboardPage({params}:{params: Promise<{locale:string}>}){
  const {locale}=await params; const isAr=locale==='ar';
  // T9: widgets bound to PHASE-013 report contracts — no side-channel math, drill-down with pinned params
  const widgets=[
    {key:'sales.today', label:isAr?'مبيعات اليوم':'Sales today', contract:'sales.daily_summary', params:{asOf:'today'}, value:'—', drill:`/${locale}/reports/sales.daily_summary?asOf=today`},
    {key:'treasury.cash_position', label:isAr?'الموقف النقدي':'Cash position', contract:'treasury.cash_position', params:{asOf:'today'}, value:'—', drill:`/${locale}/reports/treasury.cash_position`},
    {key:'ar.overdue', label:isAr?'ذمم مدينة متأخرة':'AR overdue', contract:'ar.aging', params:{bucket:'over90'}, value:'—', drill:`/${locale}/reports/ar.aging?bucket=over90`},
    {key:'inventory.low_stock', label:isAr?'تنبيهات المخزون':'Stock alerts', contract:'inventory.stock_on_hand', params:{filter:'low_stock'}, value:'—', drill:`/${locale}/inventory/stock?filter=low_stock`},
  ];
  return (
    <main dir={isAr?'rtl':'ltr'} lang={locale} className="min-h-screen p-8 bg-surface">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isAr?'لوحة المدير':'Owner Dashboard'}</h1>
        <a href={`/${locale}/reports`} className="text-sm underline">{isAr?'كل التقارير':'All reports'}</a>
      </div>
      <p className="text-sm text-muted-foreground mt-1">{isAr?'ودجات مربوطة بعقود (لا حسابات متوازية) — كحد أقصى 6':'Widget-bound contracts — max 6 tiles, drill-down preserves params'}</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {widgets.map(w=>(
          <a key={w.key} href={w.drill} className="border rounded-xl p-5 bg-card hover:shadow-md transition">
            <div className="text-xs text-muted-foreground">{w.contract}</div>
            <div className="font-medium mt-1">{w.label}</div>
            <div className="text-2xl mt-3">{w.value}</div>
            <div className="text-xs mt-2 text-primary underline">{isAr?'عرض التقرير':'View report'} →</div>
          </a>
        ))}
      </div>
      <div className="mt-6 p-4 border rounded bg-card">
        <div className="text-sm font-medium">{isAr?'حالة الفوترة':'Billing status'}</div>
        <div className="text-xs text-muted-foreground mt-1">{isAr?'فترة سماح للقراءة فقط: اللوحة والتقارير والطباعة تعمل، الترحيل محظور برسالة subscription_read_only':'Grace read-only: dashboards/reports/printing work, postings blocked with subscription_read_only'}</div>
      </div>
    </main>
  );
}
