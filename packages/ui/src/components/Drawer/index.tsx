import * as React from 'react';
import { cn } from '../../utils/cn';
export type DrawerProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const Drawer = React.forwardRef<HTMLDivElement, DrawerProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="Drawer" className={cn(className)} {...props}>{children ?? "Drawer"}</div>;
});
Drawer.displayName = "Drawer";
