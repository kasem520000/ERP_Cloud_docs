export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isAr = locale === 'ar';
  return (
    <main dir={isAr ? 'rtl' : 'ltr'} className="min-h-screen flex items-center justify-center bg-gray-50">
      <form className="bg-white p-8 rounded shadow w-96 space-y-4" action="/api/auth/login" method="post">
        <h1 className="text-xl font-bold">{isAr ? 'تسجيل الدخول' : 'Login'}</h1>
        <input name="email" type="email" placeholder={isAr ? 'البريد الإلكتروني' : 'Email'} className="w-full border p-2 rounded" required />
        <input name="password" type="password" placeholder={isAr ? 'كلمة المرور' : 'Password'} className="w-full border p-2 rounded" required />
        <input name="mfa_code" placeholder={isAr ? 'رمز التحقق (اختياري)' : 'MFA code (optional)'} className="w-full border p-2 rounded" />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">{isAr ? 'دخول' : 'Sign in'}</button>
      </form>
    </main>
  );
}
