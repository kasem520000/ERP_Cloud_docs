import * as React from 'react';
import { cn } from '../../utils/cn';
export type PopoverProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const Popover = React.forwardRef<HTMLDivElement, PopoverProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="Popover" className={cn(className)} {...props}>{children ?? "Popover"}</div>;
});
Popover.displayName = "Popover";
