type Props = { params: Promise<{ locale: string }> };

export default async function Home({ params }: Props) {
  const { locale: raw } = await params;
  const locale = raw === 'en' ? 'en' : 'ar';
  const isRTL = locale === 'ar';
  const other = locale === 'ar' ? 'en' : 'ar';

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: isRTL ? 'right' : 'left',
      }}
    >
      <div
        style={{
          maxWidth: 720,
          width: '100%',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: '2rem',
          background: '#fff',
        }}
      >
        <p style={{ fontSize: 12, letterSpacing: '0.08em', color: '#6b7280', margin: 0 }}>
          {isRTL ? 'المنصة السحابية للأعمال' : 'Universal Business ERP Platform'}
        </p>
        <h1 style={{ fontSize: 28, margin: '8px 0 12px' }}>
          {isRTL ? 'المرحلة 001 — الأساس الهندسي' : 'Phase 001 — Engineering Foundation'}
        </h1>
        <p style={{ color: '#374151', lineHeight: 1.6 }}>
          {isRTL
            ? 'تم تشغيل الهيكل بنجاح. هذه صفحة تجريبية تثبت تجهيز مسار اللغة والاتجاه (RTL/LTR) وأن المنصة تعمل.'
            : 'Skeleton booted successfully. This demo page proves locale routing and direction (RTL/LTR) plumbing are wired.'}
        </p>

        <div
          style={{
            marginTop: 24,
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            justifyContent: isRTL ? 'flex-end' : 'flex-start',
          }}
        >
          <a
            href={`/${other}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 16px',
              borderRadius: 8,
              background: '#111827',
              color: '#fff',
              textDecoration: 'none',
              fontSize: 14,
            }}
          >
            {isRTL ? 'Switch to English (LTR) →' : '← التبديل إلى العربية (RTL)'}
          </a>
          <a
            href="/health/live"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              color: '#111827',
              textDecoration: 'none',
              fontSize: 14,
            }}
          >
            API /health/live
          </a>
        </div>

        <div
          style={{
            marginTop: 24,
            padding: 12,
            background: '#f9fafb',
            borderRadius: 8,
            fontSize: 12,
            color: '#6b7280',
            fontFamily: 'monospace',
            direction: 'ltr',
            textAlign: 'left',
          }}
        >
          <div>locale: {locale}</div>
          <div>dir: {isRTL ? 'rtl' : 'ltr'}</div>
          <div>build: 0.1.0-phase-001</div>
        </div>

        <p style={{ marginTop: 16, fontSize: 12, color: '#9ca3af' }}>
          {isRTL
            ? 'ملاحظة: هذا مجرد هيكل مبدئي. التصميم الكامل يأتي في المرحلة 005.'
            : 'Note: this is a skeleton only. Full design system lands in Phase 005.'}
        </p>
      </div>
    </main>
  );
}
