import type { ReactNode } from 'react';

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

const RTL_LOCALES = new Set(['ar']);

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: raw } = await params;
  const locale = raw === 'en' ? 'en' : 'ar';
  const dir = RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
  return (
    <html lang={locale} dir={dir}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>ERP Platform — Phase 001 Foundation</title>
      </head>
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return [{ locale: 'ar' }, { locale: 'en' }];
}
