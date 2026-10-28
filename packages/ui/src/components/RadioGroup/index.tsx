import * as React from 'react';
import { cn } from '../../utils/cn';
export type RadioGroupProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="RadioGroup" className={cn(className)} {...props}>{children ?? "RadioGroup"}</div>;
});
RadioGroup.displayName = "RadioGroup";
