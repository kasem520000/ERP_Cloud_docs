import * as React from 'react';
export function MoneySummaryBar(props:{ debit:string; credit:string; currency:string; density?: 'compact'|'comfortable'; locale?:string }): React.JSX.Element {
  const { debit, credit, currency, density='comfortable', locale='en' } = props;
  const diff = (Number(debit)-Number(credit)).toFixed(4);
  const balanced = diff==='0.0000';
  return (
    <div role="region" aria-label="money-summary" data-density={density} dir={locale==='ar'?'rtl':'ltr'} className={density==='compact'?'flex gap-2 text-sm':'flex gap-4'}>
      <span>{debit} {currency} debit</span><span>{credit} {currency} credit</span><span aria-live="polite" className={balanced?'text-green-600':'text-red-600'}>{balanced?'Balanced':`Δ ${diff}`}</span>
    </div>
  );
}
