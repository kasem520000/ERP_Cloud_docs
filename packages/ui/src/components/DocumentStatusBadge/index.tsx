import * as React from 'react';
import { cn } from '../../utils/cn';
const _toneMap: Record<string,string> = { DRAFT:'info', PENDING_APPROVAL:'warning', APPROVED:'cyan', POSTED:'success', VOIDED:'danger', CANCELLED:'danger', PENDING_SYNC:'info' };
export type DocumentStatusBadgeProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const DocumentStatusBadge = React.forwardRef<HTMLDivElement, DocumentStatusBadgeProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="DocumentStatusBadge" className={cn(className)} {...props}>{children ?? "DocumentStatusBadge"}</div>;
});
DocumentStatusBadge.displayName = "DocumentStatusBadge";
