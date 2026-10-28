import * as React from 'react';
import { cn } from '../../utils/cn';
export type SelectProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const Select = React.forwardRef<HTMLDivElement, SelectProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="Select" className={cn(className)} {...props}>{children ?? "Select"}</div>;
});
Select.displayName = "Select";
