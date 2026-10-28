export function bidiIsolate(text: string): string { return `⁨${text}⁩`; }
export function moneyBdiWrap(formatted: string): string { return `<span dir="ltr" style="unicode-bidi:isolate">${formatted}</span>`; }
