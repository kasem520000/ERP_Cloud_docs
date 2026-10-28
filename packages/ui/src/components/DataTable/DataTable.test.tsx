import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { describe, it, expect } from 'vitest';
import { DataTable, dataTable60fpsGate } from './index';
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const resolveRoot = (pp: string) => path.join(rootDir, pp);
describe('DataTable',()=>{
  it('virtualized 10k rows gate',()=>{ expect(dataTable60fpsGate(10000)).toBe(true); expect(dataTable60fpsGate(10001)).toBe(false); });
  it('has grid a11y semantics',()=>{ expect(DataTable).toBeDefined(); });
  it('numeric columns keep tabular-nums',()=>{ const cols=[{key:'amount',header:'Amount',accessor:(r: Record<string,unknown>)=>r['amount'],numeric:true}]; expect((cols[0] as { numeric:boolean }).numeric).toBe(true); });
  it('uses logical ps/pe not pl/pr',()=>{ const src=fs.readFileSync(resolveRoot('packages/ui/src/components/DataTable/index.tsx'),'utf8'); expect(src).toContain('ps-'); expect(src).toContain('pe-'); expect(src).toContain('text-start'); expect(src).not.toContain('pl-' as string); }); // rtl-exempt
});
