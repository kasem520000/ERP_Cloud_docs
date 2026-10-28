import * as React from 'react';
export type JournalLine = { id: string; accountId: string; debit: string; credit: string; memo?: string };
export function JournalEntryGrid(props:{ lines: JournalLine[]; onLinesChange?: (l:JournalLine[])=>void; locale?: 'ar'|'en' }): React.JSX.Element {
  const { lines, locale='en' } = props;
  const debit = lines.reduce((s,l)=> s + Number(l.debit||0), 0);
  const credit = lines.reduce((s,l)=> s + Number(l.credit||0), 0);
  const diff = (debit-credit).toFixed(4);
  return (
    <div role="grid" aria-label={locale==='ar' ? 'دفتر اليومية' : 'Journal Entries'} data-testid="journal-entry-grid" dir={locale==='ar'?'rtl':'ltr'}>
      <div role="row" aria-live="polite" data-testid="balance-bar">Σ debit {debit.toFixed(4)} Σ credit {credit.toFixed(4)} Δ {diff}</div>
      <table role="presentation"><tbody>{lines.map(l=> <tr key={l.id} role="row"><td role="gridcell">{l.accountId}</td><td role="gridcell">{l.debit}</td><td role="gridcell">{l.credit}</td></tr>)}</tbody></table>
    </div>
  );
}
export function useBalancePreview(lines: JournalLine[]): { debit:string; credit:string; diff:string; balanced:boolean } {
  const debit = lines.reduce((s,l)=> s + Number(l.debit||0), 0).toFixed(4);
  const credit = lines.reduce((s,l)=> s + Number(l.credit||0), 0).toFixed(4);
  const diff = (Number(debit)-Number(credit)).toFixed(4);
  return { debit, credit, diff, balanced: diff==='0.0000' };
}
