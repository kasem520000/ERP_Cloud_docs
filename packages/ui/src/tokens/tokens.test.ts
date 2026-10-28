import { fileURLToPath } from 'node:url';
import path from 'node:path';
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const resolveRoot = (pp: string) => path.join(rootDir, pp);
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { tokens, contrastGate } from './tokens';
describe('tokens byte-identical',()=>{
  it('primary-600 is #0F766E per DESIGN_TOKENS',()=>{ expect(tokens.color.primary[600]).toBe('#0F766E'); });
  it('gray-900 is #111827',()=>{ expect(tokens.color.gray[900]).toBe('#111827'); });
  it('finance negative is #B91C1C',()=>{ expect(tokens.color.finance.negative).toBe('#B91C1C'); });
  it('css file contains all --erp-* vars',()=>{ const css=fs.readFileSync(resolveRoot('packages/ui/src/tokens/tokens.css'),'utf8'); expect(css).toContain('--erp-color-primary-600: #0F766E'); expect(css).toContain('--erp-surface-page'); expect(css).toContain('@theme'); });
  it('contrast gate green (AA >=4.5)',()=>{ const g=contrastGate(); expect(g.pass).toBe(true); expect(g.ratios['primary-600:white']).toBeGreaterThanOrEqual(4.5); });
  it('focus ring 2px/2px',()=>{ const css=fs.readFileSync(resolveRoot('packages/ui/src/tokens/tokens.css'),'utf8'); expect(css).toContain('--erp-focus-ring-width: 2px'); expect(css).toContain('--erp-focus-ring-offset: 2px'); });
});
