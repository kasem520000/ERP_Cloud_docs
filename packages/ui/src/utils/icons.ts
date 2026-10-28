export const directionalIcons = new Set(['arrow-left','arrow-right','chevron-left','chevron-right']);
export function resolveIconDirection(name: string, dir: 'rtl'|'ltr'): string { if (!directionalIcons.has(name)) return name; return dir === 'rtl' ? name.replace('left','right').replace('right','left') : name; }
