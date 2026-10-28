import * as React from 'react';
import { cn } from '../../utils/cn';
export type TooltipProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="Tooltip" className={cn(className)} {...props}>{children ?? "Tooltip"}</div>;
});
Tooltip.displayName = "Tooltip";
