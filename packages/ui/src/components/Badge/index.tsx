import * as React from 'react';
import { cn } from '../../utils/cn';
export type BadgeProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string; tone?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="Badge" className={cn(className)} {...props}>{children ?? "Badge"}</div>;
});
Badge.displayName = "Badge";
