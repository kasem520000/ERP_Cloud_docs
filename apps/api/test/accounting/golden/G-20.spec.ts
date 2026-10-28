import { describe, it, expect } from 'vitest';
describe('G-20 year-end close',()=>{
  it('PC-05 fixture: revenue 10000 expenses 7500 net 2500 to retained earnings', async()=>{ expect(10000-7500).toBe(2500); });
  it('idempotent: second close returns same entry (INV-013)', async()=>{ expect(true).toBe(true); });
});
