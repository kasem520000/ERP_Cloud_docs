import * as React from 'react';
import { cn } from '../../utils/cn';
export type ToastProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="Toast" className={cn(className)} {...props}>{children ?? "Toast"}</div>;
});
Toast.displayName = "Toast";
