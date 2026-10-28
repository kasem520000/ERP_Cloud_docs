import * as React from 'react';
export type SwitchProps = { children?: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>;
export const Switch = React.forwardRef<HTMLDivElement, SwitchProps>(({
  children, className, ...props }, ref) => (
  <div ref={ref} data-primitive="switch" className={className} {...props}>{children}</div>
));
Switch.displayName = "Switch";
