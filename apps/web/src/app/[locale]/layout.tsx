/* eslint-disable @typescript-eslint/require-await */
import type { ReactNode } from 'react';
export async function generateStaticParams(): Promise<{ locale: string }[]> { return [{ locale: 'ar' }, { locale: 'en' }]; }
export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }): Promise<React.JSX.Element> {
  const { locale } = await params;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  return (
    <html lang={locale} dir={dir}>
      <body className="bg-[var(--erp-surface-page)]">{children}</body>
    </html>
  );
}
