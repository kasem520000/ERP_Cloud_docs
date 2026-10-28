// TS mirror of tokens.css — for RN/Android and charts
export const tokens = {
  color: {
    primary: { 50: '#F0FDFA', 100: '#CCFBF1', 200: '#99F6E4', 300: '#5EEAD4', 400: '#2DD4BF', 500: '#14B8A6', 600: '#0F766E', 700: '#115E59', 800: '#134E4A', 900: '#042F2E', 950: '#032726' },
    gray: { 50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 300: '#D1D5DB', 400: '#9CA3AF', 500: '#6B7280', 600: '#4B5563', 700: '#374151', 800: '#1F2937', 900: '#111827', 950: '#030712' },
    success: { 700: '#15803D' }, warning: { 700: '#B45309' }, danger: { 700: '#B91C1C' }, info: { 700: '#1D4ED8' },
    finance: { positive: '#15803D', negative: '#B91C1C', neutral: 'inherit' },
  },
  surface: { page: '#F9FAFB', card: '#FFFFFF', sunken: '#F3F4F6', overlay: 'rgba(3, 7, 18, 0.45)' },
  border: { subtle: '#E5E7EB', default: '#D1D5DB', strong: '#9CA3AF' },
  focus: { ringWidth: '2px', ringOffset: '2px', ringColor: '#0F766E' },
  density: { compact: '32px', comfortable: '40px' },
  font: { ar: "'IBM Plex Sans Arabic', Inter, system-ui, sans-serif", latin: "Inter, 'IBM Plex Sans Arabic', system-ui, sans-serif" },
  radius: { sm: '4px', md: '6px', lg: '8px', xl: '12px' },
  shadow: { e1: '0 1px 2px rgba(3,7,18,0.06)', e2: '0 2px 4px rgba(3,7,18,0.07)', e3: '0 4px 12px rgba(3,7,18,0.10)', e4: '0 8px 24px rgba(3,7,18,0.14)' },
  motion: { 0: '0ms', 120: '120ms', 150: '150ms' },
  z: { dropdown: 1000, dialog: 1100, toast: 1200 },
} as const;

export function getContrastRatio(hex1: string, hex2: string): number {
  // Simplified WCAG contrast — used by contrast gate
  const lum = (hex: string) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff, g = (rgb >> 8) & 0xff, b = rgb & 0xff;
    const srgb = [r,g,b].map(v => { const s=v/255; return s <= 0.03928 ? s/12.92 : Math.pow((s+0.055)/1.055,2.4); });
    return 0.2126*srgb[0]! + 0.7152*srgb[1]! + 0.0722*srgb[2]!;
  };
  const L1 = lum(hex1), L2 = lum(hex2); return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
}
export function contrastGate(): { pass: boolean; ratios: Record<string, number> } {
  const ratios = {
    'primary-600:white': getContrastRatio('#0F766E','#FFFFFF'),
    'primary-700:white': getContrastRatio('#115E59','#FFFFFF'),
    'gray-900:white': getContrastRatio('#111827','#FFFFFF'),
  };
  return { pass: Object.values(ratios).every(r => r >= 4.5), ratios };
}
