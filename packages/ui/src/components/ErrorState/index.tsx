import * as React from 'react';
import { cn } from '../../utils/cn';
export type ErrorStateProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="ErrorState" className={cn(className)} {...props}>{children ?? "ErrorState"}</div>;
});
ErrorState.displayName = "ErrorState";
