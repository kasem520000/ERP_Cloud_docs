import crypto from 'node:crypto';
import { getPool } from '../../../infra/db/db.js';
import { verifyPassword, hashToken } from '../domain/password.js';
import { checkLoginRateLimit, lockoutDuration } from './rate-limiter.js';
import { createSession } from './session-service.js';

export async function login(email: string, password: string, ip: string): Promise<{ ok: boolean; reason?: string; session?: { token: string }; mfaRequired?: boolean }> {
  const rate = checkLoginRateLimit(ip, email);
  if (!rate.allowed) return { ok: false, reason: rate.reason };
  const pool = getPool();
  const res = await pool.query(`SELECT * FROM users WHERE lower(email) = lower($1)`, [email]);
  if (res.rows.length === 0) return { ok: false, reason: 'INVALID_CREDENTIALS' };
  const user = res.rows[0] as { id: string; password_hash: string; failed_login_count: number; locked_until: string | null; status: string };
  if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) return { ok: false, reason: 'ACCOUNT_LOCKED' };
  const ok = await verifyPassword(user.password_hash, password);
  if (!ok) {
    const nextCount = (user.failed_login_count ?? 0) + 1;
    const lockMs = lockoutDuration(nextCount);
    const lockedUntil = lockMs ? new Date(Date.now() + lockMs).toISOString() : null;
    await pool.query(`UPDATE users SET failed_login_count=$1, locked_until=$2 WHERE id=$3`, [nextCount, lockedUntil, (user as { id: string }).id]);
    await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_user_id, action, entity, entity_id, metadata) VALUES ($1, '00000000-0000-0000-0000-000000000000', $2, 'auth.login_failed', 'user', $2, $3)`, [crypto.randomUUID(), (user as { id: string }).id, JSON.stringify({ reason: 'INVALID_CREDENTIALS' })]);
    return { ok: false, reason: 'INVALID_CREDENTIALS' };
  }
  await pool.query(`UPDATE users SET failed_login_count=0, locked_until=NULL, last_login_at=now() WHERE id=$1`, [user.id]);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_user_id, action, entity, entity_id, metadata) VALUES ($1, '00000000-0000-0000-0000-000000000000', $2, 'auth.login_success', 'user', $2, '{}')`, [crypto.randomUUID(), user.id]);
  // check mfa required
  const mfa = await pool.query(`SELECT * FROM mfa_factors WHERE user_id=$1 AND confirmed_at IS NOT NULL`, [user.id]);
  if (mfa.rows.length > 0) return { ok: true, mfaRequired: true, session: undefined };
  const sess = await createSession(user.id, null, ip);
  return { ok: true, session: { token: sess.token } };
}

export async function createPasswordReset(email: string): Promise<string> {
  const pool = getPool();
  const u = await pool.query(`SELECT id FROM users WHERE lower(email)=lower($1)`, [email]);
  if (u.rows.length === 0) return '';
  const raw = crypto.randomBytes(32).toString('base64url');
  const hash = hashToken(raw);
  // store as audit metadata placeholder (reset_tokens table may not exist, use audit_events as proxy)
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_user_id, action, entity, entity_id, metadata) VALUES ($1, '00000000-0000-0000-0000-000000000000', $2, 'auth.reset_requested', 'user', $2, $3)`, [crypto.randomUUID(), (u.rows[0] as { id: string }).id, JSON.stringify({ token_hash: hash, expires_at: new Date(Date.now()+30*60*1000).toISOString() })]);
  return raw;
}

export async function createInvitation(tenantId: string, email: string, roleId: string): Promise<string> {
  const pool = getPool();
  const raw = crypto.randomBytes(32).toString('base64url');
  const hash = hashToken(raw);
  const id = crypto.randomUUID();
  await pool.query(`INSERT INTO invitations (id, tenant_id, email, role_id, token_hash, expires_at) VALUES ($1,$2,$3,$4,$5,$6)`, [id, tenantId, email, roleId, hash, new Date(Date.now()+72*60*60*1000)]);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_user_id, action, entity, entity_id, metadata) VALUES ($1,$2,$3,'identity.invitation_created','invitation',$4,'{}')`, [crypto.randomUUID(), tenantId, null, id]);
  return raw;
}
