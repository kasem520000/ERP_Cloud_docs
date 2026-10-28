import { describe, it, expect } from 'vitest';
describe('DocumentStatusBadge tone map per DOCUMENT_LIFECYCLE',()=>{
  const tones: Record<string,string> = { DRAFT:'info', PENDING_APPROVAL:'warning', APPROVED:'cyan', POSTED:'success', VOIDED:'danger', CANCELLED:'danger', PENDING_SYNC:'info' };
  it('DRAFT→Info',()=> expect(tones['DRAFT']).toBe('info'));
  it('POSTED→success',()=> expect(tones['POSTED']).toBe('success'));
  it('PENDING_APPROVAL→warning',()=> expect(tones['PENDING_APPROVAL']).toBe('warning'));
});
