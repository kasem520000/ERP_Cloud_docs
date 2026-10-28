'use client';
import * as React from 'react';
type Item = { id: string; docType: string; docId: string; amount: string; requesterId: string; status: 'PENDING'|'APPROVED'|'REJECTED' };
export function ApprovalsQueue({ items, locale, onApprove }: { items: Item[]; locale: 'ar'|'en'; onApprove?: (id: string) => void }) {
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  return (
    <div dir={dir} data-testid="approvals-queue" role="region" aria-label={locale === 'ar' ? 'قائمة الموافقات' : 'Approvals Queue'}>
      <h2>{locale === 'ar' ? 'قائمة الموافقات' : 'Approvals Queue'}</h2>
      <ul>
        {items.filter(i => i.status === 'PENDING').map(i => (
          <li key={i.id} data-testid="approval-item">
            <span>{i.docType} {i.amount}</span>
            <button onClick={() => onApprove?.(i.id)} aria-label={`approve-${i.id}`}>{locale === 'ar' ? 'موافقة' : 'Approve'}</button>
            <button aria-label={`reject-${i.id}`}>{locale === 'ar' ? 'رفض' : 'Reject'}</button>
          </li>
        ))}
      </ul>
      {items.filter(i => i.status === 'PENDING').length === 0 && <p>{locale === 'ar' ? 'لا توجد طلبات معلقة' : 'No pending approvals'}</p>}
    </div>
  );
}
