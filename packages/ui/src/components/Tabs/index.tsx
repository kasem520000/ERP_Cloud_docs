import * as React from 'react';
import { cn } from '../../utils/cn';
export type TabsProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string; tabs?: { id:string; label:string }[]; activeId?: string; onChange?: (id:string)=>void } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(({
  children, className, ...props }, ref) => {
  const { tabs, activeId, ...rest } = props as TabsProps;
  if (tabs) return <div ref={ref} data-component="Tabs" className={cn(className)} {...(rest as any)}>{tabs.map(tb=> <button key={tb.id} aria-selected={tb.id===activeId} className="ps-3 pe-3">{tb.label}</button>)}</div>;
  return <div ref={ref} data-component="Tabs" className={cn(className)} {...props}>{children ?? "Tabs"}</div>;
});
Tabs.displayName = "Tabs";
