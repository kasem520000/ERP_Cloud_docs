import * as React from 'react';
export type TabsProps = { children?: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>;
export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(({
  children, className, ...props }, ref) => (
  <div ref={ref} data-primitive="tabs" className={className} {...props}>{children}</div>
));
Tabs.displayName = "Tabs";
