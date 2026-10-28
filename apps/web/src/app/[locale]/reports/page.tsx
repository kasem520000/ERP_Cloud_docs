export default async function VatReturnPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <div dir={locale==='ar'?'rtl':'ltr'}><h1>{locale==='ar'?'الإقرار الضريبي':'VAT Return'}</h1><p>Summary vs GL cross-check</p></div>;
}
