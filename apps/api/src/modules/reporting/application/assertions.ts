import Decimal from 'decimal.js';
// Report self-assertions per REPORT_RECONCILIATION §11: tb-debits-equal-credits ↔ INV-001, tb-closing-net-zero, gl-entry-balance, is-tb-tie, bs-tb-tie, bs-current-year-once, is-net-equals-bs-current-result, cf-cash-tie ↔ INV-019 + operational ledger-tie
// exact-decimal tolerance 0; FAIL → ASSERTION_FAILED stored + export blocked server-side
export type Assertion = { id:string; status:'PASS'|'FAIL'; compared?:{ left:string; right:string } };
export function assertTbDebitsEqualCredits(debits:string, credits:string): Assertion{
  const pass=new Decimal(debits).equals(new Decimal(credits));
  return { id:'tb-debits-equal-credits', status: pass?'PASS':'FAIL', compared:{ left:debits, right:credits } };
}
export function assertTbClosingNetZero(net:string): Assertion{ return { id:'tb-closing-net-zero', status: new Decimal(net).equals(0)?'PASS':'FAIL', compared:{ left:net, right:'0' } }; }
export function assertGlEntryBalance(lines:{direction:'debit'|'credit'; amount:string}[]): Assertion{
  let d='0', c='0'; for(const l of lines) { if(l.direction==='debit') d=new Decimal(d).plus(l.amount).toString(); else c=new Decimal(c).plus(l.amount).toString(); }
  return { id:'gl-entry-balance', status: d===c?'PASS':'FAIL', compared:{ left:d, right:c } };
}
export function assertIsTbTie(isNet:string, tbNet:string): Assertion{ return { id:'is-tb-tie', status:isNet===tbNet?'PASS':'FAIL', compared:{ left:isNet, right:tbNet } }; }
export function assertBsTbTie(bsTotal:string, tbTotal:string): Assertion{ return { id:'bs-tb-tie', status:bsTotal===tbTotal?'PASS':'FAIL', compared:{ left:bsTotal, right:tbTotal } }; }
export function assertBsCurrentYearOnce(priorRE:string, closedResult:string, ytdNet:string, bsCurrent:string): Assertion{
  const expected=new Decimal(priorRE).plus(closedResult).minus(ytdNet).toString(); // bs-current-year-once: prior RE + closed current-year − live YTD counted once
  return { id:'bs-current-year-once', status: expected===bsCurrent?'PASS':'FAIL', compared:{ left:expected, right:bsCurrent } };
}
export function assertIsNetEqualsBsCurrent(isNet:string, bsCurrent:string): Assertion{ return { id:'is-net-equals-bs-current-result', status:isNet===bsCurrent?'PASS':'FAIL', compared:{ left:isNet, right:bsCurrent } }; }
export function assertCfCashTie(cfDelta:string, cashDelta:string): Assertion{ return { id:'cf-cash-tie', status:cfDelta===cashDelta?'PASS':'FAIL', compared:{ left:cfDelta, right:cashDelta } }; } // INV-019
export function shouldBlockExport(assertions:Assertion[]): boolean{ return assertions.some(a=> a.status==='FAIL'); } // export/print blocked server-side ASSERTION_FAILED

export const ALL_FINANCIAL_ASSERTIONS=['tb-debits-equal-credits','tb-closing-net-zero','gl-entry-balance','is-tb-tie','bs-tb-tie','bs-current-year-once','is-net-equals-bs-current-result','cf-cash-tie'];
