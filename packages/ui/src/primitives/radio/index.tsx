import * as React from 'react';
export type RadioProps = { children?: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>;
export const Radio = React.forwardRef<HTMLDivElement, RadioProps>(({
  children, className, ...props }, ref) => (
  <div ref={ref} data-primitive="radio" className={className} {...props}>{children}</div>
));
Radio.displayName = "Radio";
