import * as React from 'react';
import { cn } from '../../utils/cn';
export type MoneyInputProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const MoneyInput = React.forwardRef<HTMLDivElement, MoneyInputProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="MoneyInput" className={cn(className)} {...props}>{children ?? "MoneyInput"}</div>;
});
MoneyInput.displayName = "MoneyInput";
