import * as React from 'react';
import { cn } from '../../utils/cn';
export type LoadingStateProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="LoadingState" className={cn(className)} {...props}>{children ?? "LoadingState"}</div>;
});
LoadingState.displayName = "LoadingState";
