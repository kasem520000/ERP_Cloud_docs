import * as React from 'react';
export type ComboboxProps = { children?: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>;
export const Combobox = React.forwardRef<HTMLDivElement, ComboboxProps>(({
  children, className, ...props }, ref) => (
  <div ref={ref} data-primitive="combobox" className={className} {...props}>{children}</div>
));
Combobox.displayName = "Combobox";
