import * as React from 'react';
import { cn } from '../../utils/cn';
export type NumberInputProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const NumberInput = React.forwardRef<HTMLDivElement, NumberInputProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="NumberInput" className={cn(className)} {...props}>{children ?? "NumberInput"}</div>;
});
NumberInput.displayName = "NumberInput";
