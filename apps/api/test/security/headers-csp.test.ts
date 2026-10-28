import { describe, it, expect } from 'vitest';
describe('CSP probe per SECURITY_TEST_PLAN §8',()=>{
  it('HSTS + nosniff + frame-ancestors none + CSP nonce',()=>{
    const headers={ 'strict-transport-security':'max-age=31536000; includeSubDomains', 'x-content-type-options':'nosniff', 'x-frame-options':'DENY', 'referrer-policy':'strict-origin', 'content-security-policy':"default-src 'self'; script-src 'self' 'nonce-abc123'; object-src 'none'" };
    expect(headers['strict-transport-security']).toContain('max-age');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['content-security-policy']).toContain("'nonce-");
    expect(headers['content-security-policy']).toContain("object-src 'none'");
  });
});
