import * as React from 'react';
import { cn } from '../../utils/cn';
export type TextareaProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const Textarea = React.forwardRef<HTMLDivElement, TextareaProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="Textarea" className={cn(className)} {...props}>{children ?? "Textarea"}</div>;
});
Textarea.displayName = "Textarea";
