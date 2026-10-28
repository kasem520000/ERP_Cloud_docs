import * as React from 'react';
import { cn } from '../../utils/cn';
export type SearchInputProps = { label?: string; name?: string; type?: string; placeholder?: string; required?: boolean; defaultValue?: string; value?: string; onChange?: any; children?: React.ReactNode; className?: string; 'aria-label'?: string } & React.HTMLAttributes<HTMLDivElement> & { density?: 'compact'|'comfortable' };
export const SearchInput = React.forwardRef<HTMLDivElement, SearchInputProps>(({
  children, className, ...props }, ref) => {
  return <div ref={ref} data-component="SearchInput" className={cn(className)} {...props}>{children ?? "SearchInput"}</div>;
});
SearchInput.displayName = "SearchInput";
