import { Controller, Post, Get, Param, Body, Req } from '@nestjs/common';
import { RequirePermissions } from '../../identity/infrastructure/rbac.decorator.js';
import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';

const ALLOWED_TYPES = new Set(['application/pdf','image/jpeg','image/png','image/webp','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_QUOTA = 100 * 1024 * 1024;

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._\-\u0600-\u06FF]/g, '_').slice(0, 200);
}

@Controller('api/v1/attachments')
export class AttachmentsController {
  @Post()
  @RequirePermissions('files.upload')
  async attach(@Req() req: { tenantId: string; userId?: string }, @Body() body: { ownerType: string; ownerId: string; name: string; contentType: string; size: number; storageKey?: string }): Promise<unknown> {
    if (!ALLOWED_TYPES.has(body.contentType)) throw Object.assign(new Error('content_type_not_allowed'), { status: 400 });
    if (body.size > MAX_SIZE) throw Object.assign(new Error('file_too_large'), { status: 413 });
    // quota check
    const pool = getPool();
    const quota = await pool.query(`SELECT COALESCE(SUM(size),0) as total FROM file_objects WHERE tenant_id=$1`, [req.tenantId]);
    if (Number(quota.rows[0]?.total ?? 0) + body.size > MAX_QUOTA) throw Object.assign(new Error('quota_exceeded'), { status: 413 });
    // tenant-bound key: U-02
    const safeName = sanitizeFilename(body.name);
    const storageKey = body.storageKey ?? `tenants/${req.tenantId}/${crypto.randomUUID()}/${safeName}`;
    if (!storageKey.startsWith(`tenants/${req.tenantId}/`)) throw Object.assign(new Error('invalid_storage_key'), { status: 400 });
    const id = crypto.randomUUID();
    await pool.query(`INSERT INTO file_objects (id, tenant_id, owner_type, owner_id, storage_key, name, size, content_type, uploaded_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, req.tenantId, body.ownerType, body.ownerId, storageKey, safeName, body.size, body.contentType, req.userId ?? null]);
    return { id, storageKey, signedUrl: `/files/${storageKey}?token=signed` }; // U-06 Arabic filenames preserved via sanitized key
  }

  @Get(':id/signed-url')
  @RequirePermissions('files.view')
  async signedUrl(@Req() req: { tenantId: string }, @Param('id') id: string): Promise<unknown> {
    const pool = getPool();
    const r = await pool.query(`SELECT storage_key FROM file_objects WHERE id=$1 AND tenant_id=$2`, [id, req.tenantId]);
    if (r.rows.length === 0) throw Object.assign(new Error('not_found'), { status: 404 });
    const key = (r.rows[0] as { storage_key: string }).storage_key;
    // tenant-prefix bound — A11
    if (!key.startsWith(`tenants/${req.tenantId}/`)) throw Object.assign(new Error('forbidden'), { status: 403 });
    return { url: `/files/${key}?token=signed&expires=3600` };
  }
}
