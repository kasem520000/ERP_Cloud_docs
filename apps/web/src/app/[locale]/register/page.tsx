import { Button, Input } from '@erp/ui';
export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }): Promise<React.JSX.Element> {
  const { locale } = await params; const isAr = locale==='ar';
  return (
    <main dir={isAr?'rtl':'ltr'} className="min-h-screen flex items-center justify-center bg-[var(--erp-surface-page)] p-6">
      <form className="bg-[var(--erp-surface-card)] p-8 rounded-[var(--erp-radius-lg)] shadow-[var(--erp-shadow-e3)] w-[480px] space-y-3" action="/api/platform/register" method="post">
        <h1 className="text-start text-xl font-bold">{isAr?'تسجيل مستأجر جديد':'Register Tenant'}</h1>
        <Input label={isAr?'اسم الشركة':'Business name'} name="name" required />
        <Input label={isAr?'رمز البلد (SA)':'Country (SA)'} name="countryCode" defaultValue="SA" required />
        <Input label={isAr?'العملة (SAR)':'Currency (SAR)'} name="baseCurrency" defaultValue="SAR" required />
        <Input label={isAr?'بريد المالك':'Owner email'} name="ownerEmail" type="email" required />
        <Input label={isAr?'اسم المالك':'Owner name'} name="ownerName" required />
        <Input label={isAr?'كلمة المرور (≥10)':'Password (≥10)'} name="ownerPassword" type="password" required />
        <Button variant="primary" type="submit" className="w-full">{isAr?'تسجيل':'Register'}</Button>
        <p className="text-start text-xs text-[var(--erp-color-gray-500)]">{isAr?'الأسعار PLACEHOLDER':'Prices PLACEHOLDER'}</p>
      </form>
    </main>
  );
}
