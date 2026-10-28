'use client';
import * as React from 'react';
import { DataTable } from '@erp/ui';
import { MoneySummaryBar } from './MoneySummaryBar';

type Entry = { id: string; entryNo: string; entryDate: string; description?: string; status: string; totalDebit: string; totalCredit: string };
type Props = { entries: Entry[]; locale: 'ar' | 'en' };
export function JournalEntryGrid({ entries, locale }: Props) {
  const [filter, setFilter] = React.useState('');
  const filtered = entries.filter(e => !filter || e.entryNo.includes(filter) || e.description?.includes(filter));
  const debit = filtered.reduce((a, e) => a + Number(e.totalDebit), 0).toFixed(4);
  const credit = filtered.reduce((a, e) => a + Number(e.totalCredit), 0).toFixed(4);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  return (
    <div dir={dir} data-testid="journal-entry-grid" aria-label={locale === 'ar' ? 'دفتر اليومية' : 'Journal Entries'}>
      <label>{locale === 'ar' ? 'بحث' : 'Search'}<input aria-label="filter" value={filter} onChange={e => setFilter(e.target.value)} /></label>
      <MoneySummaryBar debit={debit} credit={credit} currency="SAR" density="compact" />
      <DataTable
        columns={[
          { key: 'entryNo', header: locale === 'ar' ? 'رقم القيد' : 'Entry No', accessor: (r: Entry) => r.entryNo },
          { key: 'entryDate', header: locale === 'ar' ? 'التاريخ' : 'Date', accessor: (r: Entry) => r.entryDate },
          { key: 'status', header: locale === 'ar' ? 'الحالة' : 'Status', accessor: (r: Entry) => r.status },
        ]}
        rows={filtered}
      />
    </div>
  );
}
