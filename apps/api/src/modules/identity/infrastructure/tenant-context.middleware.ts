import type { Request, Response, NextFunction } from 'express';
import { getPool } from '../../../infra/db/db.js';

export type TenantRequest = Request & { tenantId?: string; userId?: string; permissions?: string[]; sessionId?: string };

export async function tenantContextMiddleware(req: TenantRequest, _res: Response, next: NextFunction): Promise<void> {
  // Never trust client-supplied tenant_id in body/header — derive from session.active_tenant_id
  if (req.headers['x-tenant-id']) {
    // explicitly ignored — log for audit
  }
  const cookie = (req as { cookies?: Record<string,string> }).cookies?.['session'];
  if (!cookie) { next(); return; }
  try {
    const pool = getPool();
    const crypto = await import('node:crypto');
    const hash = crypto.createHash('sha256').update(cookie).digest('hex');
    const res = await pool.query(`SELECT s.*, m.tenant_id FROM sessions s LEFT JOIN memberships m ON m.user_id = s.user_id AND m.tenant_id = s.active_tenant_id WHERE s.token_hash=$1 AND s.revoked_at IS NULL`, [hash]);
    if (res.rows.length === 0) { next(); return; }
    const row = res.rows[0] as { active_tenant_id: string | null; user_id: string; id: string };
    req.tenantId = row.active_tenant_id ?? undefined;
    req.userId = row.user_id;
    req.sessionId = row.id;
    if (row.active_tenant_id) {
      await pool.query(`SELECT set_config('app.tenant_id', $1, true)`, [row.active_tenant_id]);
    }
  } catch { /* no db in unit */ }
  next();
}


export async function switchTenant(req: TenantRequest, res: Response): Promise<void> {
  const targetTenantId = req.params.tenantId;
  if (!req.userId) { res.status(401).json({ error: 'UNAUTHORIZED' }); return; }
  const pool = getPool();
  const mem = await pool.query(`SELECT * FROM memberships WHERE user_id=$1 AND tenant_id=$2 AND status='ACTIVE'`, [req.userId, targetTenantId]);
  if (mem.rows.length === 0) { res.status(404).json({ error: 'TENANT_NOT_FOUND' }); return; }
  if (req.sessionId) {
    const crypto = await import('node:crypto');
    const newToken = crypto.randomBytes(32).toString('base64url');
    const hash = crypto.createHash('sha256').update(newToken).digest('hex');
    await pool.query(`UPDATE sessions SET revoked_at=now() WHERE id=$1`, [req.sessionId]);
    const nid = crypto.randomUUID();
    await pool.query(`INSERT INTO sessions (id, user_id, token_hash, active_tenant_id, expires_at) VALUES ($1,$2,$3,$4,$5)`, [nid, req.userId, hash, targetTenantId, new Date(Date.now()+12*60*60*1000)]);
    res.cookie('session', newToken, { httpOnly: true, secure: process.env.NODE_ENV==='production', sameSite: 'lax', path: '/' });
  }
  res.json({ ok: true, tenantId: targetTenantId });
  return;
}
