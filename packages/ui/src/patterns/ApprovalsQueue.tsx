import * as React from 'react';
export type ApprovalItem = { id:string; docType:string; amount:string; status:'PENDING'|'APPROVED'|'REJECTED' };
export function ApprovalsQueue(props:{ items: ApprovalItem[]; locale?:'ar'|'en'; onApprove?:(id:string)=>void }): React.JSX.Element {
  const { items, locale='en', onApprove } = props;
  const pending = items.filter(i=> i.status==='PENDING');
  return (
    <div role="region" aria-label={locale==='ar'?'قائمة الموافقات':'Approvals Queue'} data-testid="approvals-queue" dir={locale==='ar'?'rtl':'ltr'}>
      <h2>{locale==='ar'?'قائمة الموافقات':'Approvals Queue'}</h2>
      <ul>{pending.map(i=> <li key={i.id} data-testid="approval-item"><span>{i.docType} {i.amount}</span><button onClick={()=>onApprove?.(i.id)} aria-label={`approve-${i.id}`}>{locale==='ar'?'موافقة':'Approve'}</button></li>)}</ul>
      {pending.length===0 && <p>{locale==='ar'?'لا توجد طلبات':'No pending approvals'}</p>}
    </div>
  );
}
