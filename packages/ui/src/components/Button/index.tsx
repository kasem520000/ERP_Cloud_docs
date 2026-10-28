import * as React from 'react';
import { cn } from '../../utils/cn';
export type ButtonProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string; variant?: string; type?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const Button = React.forwardRef<HTMLDivElement, ButtonProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="Button" className={cn(className)} {...props}>{children ?? "Button"}</div>;
});
Button.displayName = "Button";
