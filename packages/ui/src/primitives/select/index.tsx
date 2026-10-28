import * as React from 'react';
export type SelectProps = { children?: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>;
export const Select = React.forwardRef<HTMLDivElement, SelectProps>(({
  children, className, ...props }, ref) => (
  <div ref={ref} data-primitive="select" className={className} {...props}>{children}</div>
));
Select.displayName = "Select";
