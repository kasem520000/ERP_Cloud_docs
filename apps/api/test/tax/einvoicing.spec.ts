import { describe, it, expect } from 'vitest';
import { FakeAdapter } from '../../src/modules/tax/domain/einvoicing/adapter-port.js';
describe('EInvoicing fake',()=>{ it('lifecycle PENDING→ACCEPTED', async()=>{ const a=new FakeAdapter(); const g=await a.generate('doc1'); expect(g.payload).toContain('doc1'); const s=await a.submit(g.payload); expect(s.status).toBe('ACCEPTED'); }); it('unverified refuses', async()=>{ const a=new FakeAdapter(); await expect(a.submit('UNVERIFIED payload')).rejects.toThrow('REQUIRES_VERIFICATION'); }); });
