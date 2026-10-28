import * as React from 'react';
import { cn } from '../../utils/cn';
export type DatePickerProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="DatePicker" className={cn(className)} {...props}>{children ?? "DatePicker"}</div>;
});
DatePicker.displayName = "DatePicker";
