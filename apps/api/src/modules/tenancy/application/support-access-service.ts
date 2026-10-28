import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';

const DEFAULT_TTL_MS = 4 * 60 * 60 * 1000;

export async function openSupportSession(tenantId: string, platformUserId: string, reason: string, ticketId?: string, optIn?: boolean): Promise<{ id: string; expiresAt: Date }> {
  if (!reason) throw Object.assign(new Error('reason_required'), { status: 400 });
  // require opt-in or ticket
  if (!optIn && !ticketId) throw Object.assign(new Error('opt_in_or_ticket_required'), { status: 403 });
  const pool = getPool();
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + DEFAULT_TTL_MS);
  await pool.query(`INSERT INTO support_sessions (id, tenant_id, platform_user_id, reason, ticket_id, opt_in, expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [id, tenantId, platformUserId, reason, ticketId ?? null, !!optIn, expiresAt]);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$3,'support.session.opened','support_session',$4,$5)`, [crypto.randomUUID(), tenantId, platformUserId, id, JSON.stringify({ via_platform_admin: true, reason, ticketId })]);
  return { id, expiresAt };
}

export async function closeSupportSession(sessionId: string, tenantId: string, actorId: string): Promise<void> {
  const pool = getPool();
  await pool.query(`UPDATE support_sessions SET closed_at=now() WHERE id=$1 AND tenant_id=$2`, [sessionId, tenantId]);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$3,'support.session.closed','support_session',$4,$5)`, [crypto.randomUUID(), tenantId, actorId, sessionId, JSON.stringify({ via_platform_admin: true })]);
}

export async function isSupportSessionActive(sessionId: string): Promise<boolean> {
  const pool = getPool();
  const res = await pool.query(`SELECT expires_at, closed_at FROM support_sessions WHERE id=$1`, [sessionId]);
  if (res.rows.length === 0) return false;
  const row = res.rows[0] as { expires_at: string; closed_at: string | null };
  if (row.closed_at) return false;
  if (new Date(row.expires_at).getTime() < Date.now()) return false;
  return true;
}

export function isExpired(expiresAt: Date): boolean { return expiresAt.getTime() < Date.now(); }
