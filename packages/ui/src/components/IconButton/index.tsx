import * as React from 'react';
import { cn } from '../../utils/cn';
export type IconButtonProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const IconButton = React.forwardRef<HTMLDivElement, IconButtonProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="IconButton" className={cn(className)} {...props}>{children ?? "IconButton"}</div>;
});
IconButton.displayName = "IconButton";
