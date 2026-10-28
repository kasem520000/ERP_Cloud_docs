import * as React from 'react';
import { cn } from '../../utils/cn';
export type BreadcrumbsProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const Breadcrumbs = React.forwardRef<HTMLDivElement, BreadcrumbsProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="Breadcrumbs" className={cn(className)} {...props}>{children ?? "Breadcrumbs"}</div>;
});
Breadcrumbs.displayName = "Breadcrumbs";
