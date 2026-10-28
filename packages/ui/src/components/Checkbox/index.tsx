import * as React from 'react';
import { cn } from '../../utils/cn';
export type CheckboxProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const Checkbox = React.forwardRef<HTMLDivElement, CheckboxProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="Checkbox" className={cn(className)} {...props}>{children ?? "Checkbox"}</div>;
});
Checkbox.displayName = "Checkbox";
