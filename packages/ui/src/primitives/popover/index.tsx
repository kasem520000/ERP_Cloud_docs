import * as React from 'react';
export type PopoverProps = { children?: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>;
export const Popover = React.forwardRef<HTMLDivElement, PopoverProps>(({
  children, className, ...props }, ref) => (
  <div ref={ref} data-primitive="popover" className={className} {...props}>{children}</div>
));
Popover.displayName = "Popover";
