import { Injectable } from '@nestjs/common';
import { getPool } from '../../infra/db/db.js';
import { getTenantContext } from '../../infra/db/tenant-context.js';
import { issueUploadUrl, getSignedDownloadUrl, DEFAULT_CONSTRAINTS, type UploadConstraints } from './s3.service.js';

@Injectable()
export class FilesService {
  async issueUploadUrl(params: { name: string; contentType: string; size: number; purpose?: string; constraints?: UploadConstraints }): Promise<{
    fileObjectId: string; uploadUrl: string; storageKey: string; expiresAt: string;
  }> {
    const ctx = getTenantContext();
    const result = await issueUploadUrl({
      tenantId: ctx.tenantId,
      fileName: params.name,
      contentType: params.contentType,
      size: params.size,
      constraints: params.constraints ?? DEFAULT_CONSTRAINTS,
    });
    const pool = getPool();
    await pool.query(
      `INSERT INTO file_objects (id, tenant_id, storage_key, name, size, content_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [result.fileObjectId, ctx.tenantId, result.storageKey, params.name, params.size, params.contentType, ctx.actorId ?? null],
    );
    return result;
  }

  async getUrl(fileObjectId: string): Promise<string> {
    const ctx = getTenantContext();
    const pool = getPool();
    const res = await pool.query(`SELECT storage_key FROM file_objects WHERE id = $1 AND tenant_id = $2`, [fileObjectId, ctx.tenantId]);
    if (res.rows.length === 0) throw new Error('File not found');
    const row = res.rows[0] as { storage_key: string };
    return getSignedDownloadUrl(row.storage_key);
  }
}
