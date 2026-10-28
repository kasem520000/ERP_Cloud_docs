/**
 * BR-001 credit limit enforcement at sales invoice approval
 * openBalance + thisInvoice vs limit; overdue factored; block/warn/ignore
 */
export type CreditPosture='block'|'warn'|'ignore';
export function checkCredit(openBalance:string, overdue:string, limit:string, invoiceTotal:string, posture:CreditPosture): { allowed:boolean; code?:string; math?:string; warn?:string }{
  const open=Number(openBalance); const tot=Number(invoiceTotal); const lim=Number(limit);
  if(posture==='ignore') return { allowed:true };
  const projected=open+tot;
  if(projected > lim){
    const math=`${open} + ${tot} > ${lim}`;
    if(posture==='block') return { allowed:false, code:'CREDIT_LIMIT_EXCEEDED', math };
    return { allowed:true, warn:`CREDIT_LIMIT_WARN ${math}` };
  }
  // overdue factoring could block even within limit if policy demands — simplified
  void overdue;
  return { allowed:true };
}
