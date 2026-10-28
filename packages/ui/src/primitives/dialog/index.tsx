import * as React from 'react';
export type DialogProps = { children?: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>;
export const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(({
  children, className, ...props }, ref) => (
  <div ref={ref} data-primitive="dialog" className={className} {...props}>{children}</div>
));
Dialog.displayName = "Dialog";
