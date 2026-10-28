export const locales = ['ar','en'] as const;
export type Locale = typeof locales[number];
export function getDir(locale: Locale): 'rtl'|'ltr' { return locale==='ar' ? 'rtl':'ltr'; }
