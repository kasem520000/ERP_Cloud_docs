import { describe, it, expect } from 'vitest';
import { issueUploadUrl, getSignedDownloadUrl, buildStorageKey } from '../src/modules/files/s3.service.js';

describe('S3 adapter (files skeleton)', () => {
  const tenantA = 'aaaaaaaa-aaaa-7000-8aaa-aaaaaaaaaaaa';
  const tenantB = 'bbbbbbbb-bbbb-7000-8bbb-bbbbbbbbbbbb';
  const cfg = {
    endpoint: 'http://localhost:9000',
    region: 'us-east-1',
    bucket: 'erp-dev',
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
  };

  it('buildStorageKey includes tenant prefix', () => {
    const key = buildStorageKey(tenantA, 'invoice.pdf');
    expect(key.startsWith(`tenants/${tenantA}/`)).toBe(true);
    expect(key.endsWith('invoice.pdf')).toBe(true);
  });

  it('issueUploadUrl returns tenant-scoped key and uploadUrl', async () => {
    const res = await issueUploadUrl({
      tenantId: tenantA,
      fileName: 'receipt.jpg',
      contentType: 'image/jpeg',
      size: 1024,
      cfg,
    });
    expect(res.storageKey.includes(tenantA)).toBe(true);
    expect(res.uploadUrl.includes(cfg.bucket)).toBe(true);
    expect(res.uploadUrl.includes(tenantA)).toBe(true);
    expect(new Date(res.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('different tenants get different keys for same file', async () => {
    const a = await issueUploadUrl({ tenantId: tenantA, fileName: 'same.pdf', contentType: 'application/pdf', size: 100, cfg });
    const b = await issueUploadUrl({ tenantId: tenantB, fileName: 'same.pdf', contentType: 'application/pdf', size: 100, cfg });
    expect(a.storageKey).not.toBe(b.storageKey);
    expect(a.storageKey.includes(tenantA)).toBe(true);
    expect(b.storageKey.includes(tenantB)).toBe(true);
  });

  it('enforces maxSize', async () => {
    await expect(issueUploadUrl({
      tenantId: tenantA, fileName: 'big.bin', contentType: 'application/octet-stream', size: 20*1024*1024, cfg,
      constraints: { maxSize: 1024, allowedTypes: [] },
    })).rejects.toThrow(/too large/);
  });

  it('enforces allowedTypes', async () => {
    await expect(issueUploadUrl({
      tenantId: tenantA, fileName: 'evil.exe', contentType: 'application/x-msdownload', size: 100, cfg,
      constraints: { maxSize: 1024*1024, allowedTypes: ['image/jpeg'] },
    })).rejects.toThrow(/not allowed/);
  });

  it('getSignedDownloadUrl is tenant-scoped and expires', async () => {
    const key = `tenants/${tenantA}/file.pdf`;
    const url = await getSignedDownloadUrl(key, cfg);
    expect(url.includes(key)).toBe(true);
    expect(url.includes('X-Amz-Expires')).toBe(true);
  });

  it('uploadUrl expiry is ~1h', async () => {
    const res = await issueUploadUrl({ tenantId: tenantA, fileName: 'test.pdf', contentType: 'application/pdf', size: 500, cfg });
    const expiresMs = new Date(res.expiresAt).getTime() - Date.now();
    expect(expiresMs).toBeGreaterThan(3500*1000);
    expect(expiresMs).toBeLessThan(3700*1000);
  });
});
