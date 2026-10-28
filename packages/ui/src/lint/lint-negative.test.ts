import { fileURLToPath } from 'node:url';
import path from 'node:path';
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const resolveRoot = (pp: string) => path.join(rootDir, pp);
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
describe('lint negative proofs (erp/no-* rules)',()=>{
  it('physical-direction fixture exists',()=> expect(fs.existsSync(resolveRoot('scripts/fixtures/lint-negative/should-fail-physical.ts'))).toBe(true));
  it('raw-radix fixture exists',()=> expect(fs.existsSync(resolveRoot('scripts/fixtures/lint-negative/should-fail-radix.ts'))).toBe(true));
  it('raw-hex fixture exists',()=> expect(fs.existsSync(resolveRoot('scripts/fixtures/lint-negative/should-fail-raw-hex.ts'))).toBe(true));
  it('import-path fixture exists',()=> expect(fs.existsSync(resolveRoot('scripts/fixtures/lint-negative/should-fail-import-path.ts'))).toBe(true));
  it('eslint config wires 4 rules',()=>{ const cfg=fs.readFileSync(resolveRoot('eslint.config.mjs'),'utf8'); expect(cfg).toContain('erp/no-physical-direction'); expect(cfg).toContain('erp/no-raw-radix'); expect(cfg).toContain('erp/no-raw-design-values'); expect(cfg).toContain('erp/import-path'); });
});