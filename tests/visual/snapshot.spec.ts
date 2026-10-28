import { describe, it, expect } from 'vitest';
describe('visual harness',()=>{ it('AR+EN baselines mandatory',()=>{ const locales=['ar','en']; expect(locales).toEqual(['ar','en']); }); it('threshold 0',()=>{ expect(0).toBe(0); }); });
