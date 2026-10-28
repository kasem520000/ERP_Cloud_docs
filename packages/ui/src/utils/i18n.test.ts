import { fileURLToPath } from 'node:url';
import path from 'node:path';
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const resolveRoot = (pp: string) => path.join(rootDir, pp);
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('i18n parity',()=>{
  it('every .ar.json has .en.json with same keys',()=>{
    const dir=resolveRoot('apps/web/src/i18n');
    const ars=fs.readdirSync(dir).filter(f=>f.endsWith('.ar.json'));
    expect(ars.length).toBeGreaterThan(0);
    for (const ar of ars) { const en=ar.replace('.ar.json','.en.json'); const a=Object.keys(JSON.parse(fs.readFileSync(path.join(dir,ar),'utf8'))).sort(); const b=Object.keys(JSON.parse(fs.readFileSync(path.join(dir,en),'utf8'))).sort(); expect(a).toEqual(b); }
  });
  it('locale layout sets html lang/dir',()=>{ const layout=fs.readFileSync(resolveRoot('apps/web/src/app/[locale]/layout.tsx'),'utf8'); expect(layout).toContain('lang={locale}'); expect(layout).toContain('dir={dir}'); expect(layout).toContain("locale === 'ar' ? 'rtl'"); });
});
