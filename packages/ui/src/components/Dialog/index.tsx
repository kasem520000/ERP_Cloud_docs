import * as React from 'react';
import { cn } from '../../utils/cn';
export type DialogProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="Dialog" className={cn(className)} {...props}>{children ?? "Dialog"}</div>;
});
Dialog.displayName = "Dialog";
