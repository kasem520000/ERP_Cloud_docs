import * as React from 'react';
export type DrawerProps = { children?: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>;
export const Drawer = React.forwardRef<HTMLDivElement, DrawerProps>(({
  children, className, ...props }, ref) => (
  <div ref={ref} data-primitive="drawer" className={className} {...props}>{children}</div>
));
Drawer.displayName = "Drawer";
