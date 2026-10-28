'use client';
import { formatMoney } from '@erp/ui';

type Props = { debit: string; credit: string; currency: string; density?: 'comfortable'|'compact' };
export function MoneySummaryBar({ debit, credit, currency, density='comfortable' }: Props) {
  const bal = (Number(debit) - Number(credit)).toFixed(4);
  const balanced = Math.abs(Number(bal)) < 0.0001;
  return (
    <div role="region" aria-label="money-summary" data-density={density} className={density === 'compact' ? 'flex gap-2 text-sm p-2' : 'flex gap-4 p-4'}>
      <span>{formatMoney ? formatMoney(debit, currency, 'en') : `${debit} ${currency}`} debit</span>
      <span>{formatMoney ? formatMoney(credit, currency, 'en') : `${credit} ${currency}`} credit</span>
      <span aria-live="polite" className={balanced ? 'text-green-600' : 'text-red-600'}>{balanced ? 'Balanced' : `Diff ${bal}`}</span>
    </div>
  );
}
