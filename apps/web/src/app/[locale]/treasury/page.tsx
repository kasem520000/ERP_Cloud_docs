import { MoneySummaryBar } from '@/components/accounting/MoneySummaryBar';
export default async function TreasuryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div dir={locale==='ar'?'rtl':'ltr'}>
      <h1>{locale==='ar' ? 'الخزينة' : 'Treasury'}</h1>
      <MoneySummaryBar debit="0.0000" credit="0.0000" currency="SAR" />
      <p>{locale==='ar' ? 'الإيصالات والمدفوعات والتحويلات' : 'Receipts, payments, transfers'}</p>
    </div>
  );
}
