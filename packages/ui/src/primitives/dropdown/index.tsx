import * as React from 'react';
export type DropdownProps = { children?: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>;
export const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(({
  children, className, ...props }, ref) => (
  <div ref={ref} data-primitive="dropdown" className={className} {...props}>{children}</div>
));
Dropdown.displayName = "Dropdown";
