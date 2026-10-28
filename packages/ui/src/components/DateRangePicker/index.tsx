import * as React from 'react';
import { cn } from '../../utils/cn';
export type DateRangePickerProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const DateRangePicker = React.forwardRef<HTMLDivElement, DateRangePickerProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="DateRangePicker" className={cn(className)} {...props}>{children ?? "DateRangePicker"}</div>;
});
DateRangePicker.displayName = "DateRangePicker";
