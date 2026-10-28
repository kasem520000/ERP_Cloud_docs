import * as React from 'react';
export type CheckboxProps = { children?: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>;
export const Checkbox = React.forwardRef<HTMLDivElement, CheckboxProps>(({
  children, className, ...props }, ref) => (
  <div ref={ref} data-primitive="checkbox" className={className} {...props}>{children}</div>
));
Checkbox.displayName = "Checkbox";
