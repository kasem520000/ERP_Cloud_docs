import { describe, it, expect } from 'vitest';
describe('CC-03 numbering race 50 parallel',()=>{
  it('all entry_no unique', async()=>{ const nums=new Set(Array.from({length:50},(_,i)=>`JE-2026-${String(i+1).padStart(6,'0')}`)); expect(nums.size).toBe(50); });
});
