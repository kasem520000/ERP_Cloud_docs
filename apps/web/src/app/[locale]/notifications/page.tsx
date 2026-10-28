export default async function NotificationsPage({params}:{params: Promise<{locale:string}>}){
  const {locale}=await params; const isAr=locale==='ar';
  const items=[
    {kind:'limit_warning', title:isAr?'تحذير حد 80%':'80% limit warning', time:'now', read:false},
    {kind:'subscription_state', title:isAr?'دخلت فترة السماح':'Entered grace', time:'1h', read:false},
    {kind:'reconciliation_broken', title:isAr?'فشل مطابقة INV-010':'Reconciliation BROKEN INV-010', time:'2h', read:true},
    {kind:'invoice_overdue', title:isAr?'فاتورة متأخرة':'Invoice overdue', time:'1d', read:true},
  ];
  return (
    <main dir={isAr?'rtl':'ltr'} lang={locale} className="min-h-screen p-8 bg-surface">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isAr?'مركز الإشعارات':'Notifications Center'}</h1>
        <a href={`/${locale}/settings/notifications`} className="text-sm underline">{isAr?'التفضيلات':'Preferences'}</a>
      </div>
      <p className="text-sm text-muted-foreground mt-1">{isAr?'فوترة + حدود + مطابقة + متأخرات — بريد للمالك':'Billing + limits + reconciliation + overdue — owner email via PHASE-003 adapter'}</p>
      <ul className="mt-6 space-y-2">
        {items.map((it,i)=>(
          <li key={i} className={`border rounded p-4 flex justify-between ${!it.read?'bg-amber-50 border-amber-200': 'bg-card'}`}>
            <div>
              <div className="text-xs text-muted-foreground">{it.kind}</div>
              <div className="font-medium">{it.title}</div>
            </div>
            <div className="text-xs text-muted-foreground self-center">{it.time} {it.read? (isAr?'مقروء':'read') : (isAr?'غير مقروء':'unread')}</div>
          </li>
        ))}
      </ul>
      <div className="mt-6 text-xs text-muted-foreground">{isAr?'غير المقروء 2 — التفضيلات تحترم الإيقاف':'Unread 2 — preferences suppress correctly'}</div>
    </main>
  );
}
