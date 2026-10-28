'use client';
import Link from 'next/link';
export function LocaleSwitch({ current }: { current: 'ar' | 'en' }) {
  const next = current === 'ar' ? 'en' : 'ar';
  return <Link href={`/${next}`}>{next === 'ar' ? 'العربية' : 'English'}</Link>;
}
