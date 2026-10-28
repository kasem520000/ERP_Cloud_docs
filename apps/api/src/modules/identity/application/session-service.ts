import crypto from 'node:crypto';
import { getPool } from '../../../infra/db/db.js';

const ABSOLUTE_MS = 12 * 60 * 60 * 1000;
const IDLE_MS = 30 * 60 * 1000;

export type Session = { id: string; userId: string; tokenHash: string; expiresAt: Date; lastSeenAt: Date; activeTenantId?: string | null };

export function generateToken(): string { return crypto.randomBytes(32).toString('base64url'); }
export function hashTokenLocal(t: string): string { return crypto.createHash('sha256').update(t).digest('hex'); }

export async function createSession(userId: string, activeTenantId?: string | null, ip?: string): Promise<{ id: string; token: string; tokenHash: string }> {
  const pool = getPool();
  const id = crypto.randomUUID();
  const token = generateToken();
  const tokenHash = hashTokenLocal(token);
  const expiresAt = new Date(Date.now() + ABSOLUTE_MS);
  await pool.query(`INSERT INTO sessions (id, user_id, token_hash, active_tenant_id, expires_at, ip) VALUES ($1,$2,$3,$4,$5,$6)`, [id, userId, tokenHash, activeTenantId ?? null, expiresAt, ip ?? null]);
  return { id, token, tokenHash };
}

export async function rotateSession(oldId: string, userId: string): Promise<{ id: string; token: string }> {
  const pool = getPool();
  await pool.query(`UPDATE sessions SET revoked_at = now() WHERE id = $1`, [oldId]);
  return createSession(userId);
}

export async function verifySession(token: string): Promise<Session | null> {
  const pool = getPool();
  const h = hashTokenLocal(token);
  const res = await pool.query(`SELECT * FROM sessions WHERE token_hash = $1 AND revoked_at IS NULL`, [h]);
  if (res.rows.length === 0) return null;
  const s = res.rows[0] as Session & { expires_at: string; last_seen_at: string; user_id: string; token_hash: string; active_tenant_id: string | null; id: string };
  const now = Date.now();
  if (new Date(s.expires_at).getTime() < now) return null;
  if (new Date(s.last_seen_at).getTime() + IDLE_MS < now) return null;
  await pool.query(`UPDATE sessions SET last_seen_at = now() WHERE id = $1`, [s.id]);
  return { id: s.id, userId: s.user_id, tokenHash: s.token_hash, expiresAt: new Date(s.expires_at), lastSeenAt: new Date(), activeTenantId: s.active_tenant_id };
}

export function cookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: ABSOLUTE_MS / 1000 };
}

export function csrfToken(): string { return crypto.randomBytes(16).toString('hex'); }
