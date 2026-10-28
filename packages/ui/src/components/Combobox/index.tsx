import * as React from 'react';
import { cn } from '../../utils/cn';
export type ComboboxProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const Combobox = React.forwardRef<HTMLDivElement, ComboboxProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="Combobox" className={cn(className)} {...props}>{children ?? "Combobox"}</div>;
});
Combobox.displayName = "Combobox";
