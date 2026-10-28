import * as React from 'react';
import { cn } from '../../utils/cn';
export type PaginationProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="Pagination" className={cn(className)} {...props}>{children ?? "Pagination"}</div>;
});
Pagination.displayName = "Pagination";
