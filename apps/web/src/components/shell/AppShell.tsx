'use client';
import * as React from 'react';
import { NavigationSidebar } from '@erp/ui';
export function AppShell({ children, locale, dir }: { children: React.ReactNode; locale: 'ar'|'en'; dir: 'rtl'|'ltr' }): React.JSX.Element {
  return <div dir={dir} lang={locale}><nav aria-label="main"><NavigationSidebar>{children}</NavigationSidebar></nav></div>;
}
