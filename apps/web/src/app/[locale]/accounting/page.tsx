import { JournalEntryGrid } from '@/components/accounting/JournalEntryGrid';
import { ApprovalsQueue } from '@/components/accounting/ApprovalsQueue';
import { MoneySummaryBar } from '@/components/accounting/MoneySummaryBar';

export default async function AccountingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const entries: { id: string; entryNo: string; entryDate: string; status: string; totalDebit: string; totalCredit: string }[] = [];
  return (
    <div>
      <h1>{locale === 'ar' ? 'المحاسبة' : 'Accounting'}</h1>
      <MoneySummaryBar debit="0.0000" credit="0.0000" currency="SAR" />
      <JournalEntryGrid entries={entries} locale={locale as unknown as 'ar'|'en'} />
      <ApprovalsQueue items={[]} locale={locale as unknown as 'ar'|'en'} />
    </div>
  );
}
