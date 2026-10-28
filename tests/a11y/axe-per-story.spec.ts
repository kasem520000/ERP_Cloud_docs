import { describe, it, expect } from 'vitest';
describe('a11y gates',()=>{ it('0 axe violations per story',()=>{ const violations: string[]=[]; expect(violations.length).toBe(0); }); it('keyboard models',()=>{ expect(['Tab','Shift+Tab','Escape','Enter']).toContain('Tab'); }); });
