export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; const isAr = locale === 'ar';
  return (
    <main dir={isAr ? 'rtl' : 'ltr'} className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form className="bg-white p-8 rounded shadow w-[480px] space-y-3" action="/api/platform/register" method="post">
        <h1 className="text-xl font-bold">{isAr ? 'تسجيل مستأجر جديد' : 'Register Tenant'}</h1>
        <input name="name" placeholder={isAr ? 'اسم الشركة' : 'Business name'} className="w-full border p-2 rounded" required />
        <input name="countryCode" placeholder={isAr ? 'رمز البلد (SA)' : 'Country (SA)'} className="w-full border p-2 rounded" required defaultValue="SA" />
        <input name="baseCurrency" placeholder={isAr ? 'العملة (SAR)' : 'Currency (SAR)'} className="w-full border p-2 rounded" required defaultValue="SAR" />
        <input name="ownerEmail" type="email" placeholder={isAr ? 'بريد المالك' : 'Owner email'} className="w-full border p-2 rounded" required />
        <input name="ownerName" placeholder={isAr ? 'اسم المالك' : 'Owner name'} className="w-full border p-2 rounded" required />
        <input name="ownerPassword" type="password" placeholder={isAr ? 'كلمة المرور (≥10)' : 'Password (≥10)'} className="w-full border p-2 rounded" required />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">{isAr ? 'تسجيل' : 'Register'}</button>
        <p className="text-xs text-gray-500">{isAr ? 'بالنقر توافق على الشروط — الأسعار PLACEHOLDER' : 'By registering you agree — prices PLACEHOLDER'}</p>
      </form>
    </main>
  );
}
