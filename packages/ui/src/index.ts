/**
 * @erp/ui — design system barrel (stub for PHASE-001).
 * Full implementation lands in PHASE-005 (tokens, components, RTL rules).
 * This stub proves the package builds and can be imported by apps/web.
 */

// Minimal placeholder — proves import graph and build pipeline.
export const UI_VERSION = '0.1.0-stub';

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Stub component — replaced in PHASE-005 with Tailwind+Radix system.
export function Placeholder({ children }: { children?: string }): string {
  return `ui-placeholder:${children ?? 'empty'}`;
}
