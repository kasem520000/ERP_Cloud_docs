import { Button, Input } from '@erp/ui';
export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }): Promise<React.JSX.Element> {
  const { locale } = await params; const isAr = locale === 'ar';
  return (
    <main dir={isAr ? 'rtl':'ltr'} className="min-h-screen flex items-center justify-center bg-[var(--erp-surface-page)]">
      <form className="bg-[var(--erp-surface-card)] p-8 rounded-[var(--erp-radius-lg)] shadow-[var(--erp-shadow-e3)] w-96 space-y-3" action="/api/auth/login" method="post">
        <h1 className="text-start text-xl font-bold">{isAr ? 'تسجيل الدخول' : 'Login'}</h1>
        <Input label={isAr ? 'البريد الإلكتروني' : 'Email'} name="email" type="email" required />
        <Input label={isAr ? 'كلمة المرور' : 'Password'} name="password" type="password" required />
        <Input label={isAr ? 'رمز التحقق' : 'MFA code'} name="mfa_code" />
        <Button variant="primary" type="submit" className="w-full">{isAr ? 'دخول' : 'Sign in'}</Button>
      </form>
    </main>
  );
}
