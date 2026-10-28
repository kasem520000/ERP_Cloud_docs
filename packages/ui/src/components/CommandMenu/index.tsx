import * as React from 'react';
import { cn } from '../../utils/cn';
export type CommandMenuProps = { children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const CommandMenu = React.forwardRef<HTMLDivElement, CommandMenuProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="CommandMenu" className={cn(className)} {...props}>{children ?? "CommandMenu"}</div>;
});
CommandMenu.displayName = "CommandMenu";
