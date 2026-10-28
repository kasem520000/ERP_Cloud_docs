import * as React from 'react';
import { cn } from '../../utils/cn';
export type EmptyStateProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="EmptyState" className={cn(className)} {...props}>{children ?? "EmptyState"}</div>;
});
EmptyState.displayName = "EmptyState";
