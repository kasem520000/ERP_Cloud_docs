import * as React from 'react';
export type TooltipProps = { children?: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>;
export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(({
  children, className, ...props }, ref) => (
  <div ref={ref} data-primitive="tooltip" className={className} {...props}>{children}</div>
));
Tooltip.displayName = "Tooltip";
