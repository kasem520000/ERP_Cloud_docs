export default async function TaxCodesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <div dir={locale==='ar'?'rtl':'ltr'}><h1>{locale==='ar'?'الرموز الضريبية':'Tax Codes'}</h1></div>;
}
