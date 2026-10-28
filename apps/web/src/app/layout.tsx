import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  // Next.js requires a root layout; locale layouts set <html lang dir>.
  return children;
}
