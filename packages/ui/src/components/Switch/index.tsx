import * as React from 'react';
import { cn } from '../../utils/cn';
export type SwitchProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const Switch = React.forwardRef<HTMLDivElement, SwitchProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="Switch" className={cn(className)} {...props}>{children ?? "Switch"}</div>;
});
Switch.displayName = "Switch";
