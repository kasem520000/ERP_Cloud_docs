import * as React from 'react';
import { cn } from '../../utils/cn';
export type InputProps = { label?: string; name?: string; type?: string; placeholder?: string; required?: boolean; defaultValue?: string; value?: string; onChange?: any; children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const Input = React.forwardRef<HTMLDivElement, InputProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="Input" className={cn(className)} {...props}>{children ?? "Input"}</div>;
});
Input.displayName = "Input";
