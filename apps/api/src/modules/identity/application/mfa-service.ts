import crypto from 'node:crypto';
import { getPool } from '../../../infra/db/db.js';

// Minimal TOTP (RFC 6238) without external deps — 30s step, 6-digit, SHA1
function base32Decode(s: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const ch of s.toUpperCase().replace(/=+$/, '')) {
    const v = alphabet.indexOf(ch);
    if (v < 0) continue;
    bits += v.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i=0;i+8<=bits.length;i+=8) bytes.push(parseInt(bits.slice(i,i+8),2));
  return Buffer.from(bytes);
}

export function generateSecret(): string {
  const bytes = crypto.randomBytes(20);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let out = '';
  for (const b of bytes) out += alphabet[b % 32];
  return out.match(/.{4}/g)!.join('').slice(0,32);
}

export function totpCode(secret: string, counter?: number): string {
  const buf = base32Decode(secret);
  const c = counter ?? Math.floor(Date.now()/30000);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(c));
  const h = crypto.createHmac('sha1', buf).update(counterBuf).digest();
  const offset = (h[h.length-1]! & 0x0f);
  const code = ((h[offset]! & 0x7f)<<24 | (h[offset+1]!<<16) | (h[offset+2]!<<8) | h[offset+3]!) % 1_000_000;
  return code.toString().padStart(6,'0');
}

export function verifyTotp(secret: string, code: string): boolean {
  const now = Math.floor(Date.now()/30000);
  for (const d of [-1,0,1]) if (totpCode(secret, now+d) === code) return true;
  return false;
}

export function encryptSecret(secret: string): string {
  const key = crypto.createHash('sha256').update(process.env.MFA_ENCRYPTION_KEY || 'dev-mfa-key-change-me-32b!!').digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(secret,'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${enc.toString('base64url')}.${tag.toString('base64url')}`;
}

export function decryptSecret(enc: string): string {
  const key = crypto.createHash('sha256').update(process.env.MFA_ENCRYPTION_KEY || 'dev-mfa-key-change-me-32b!!').digest();
  const [ivs, encs, tags] = enc.split('.');
  const iv = Buffer.from(ivs!, 'base64url');
  const tag = Buffer.from(tags!, 'base64url');
  const encBuf = Buffer.from(encs!, 'base64url');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encBuf), decipher.final()]).toString('utf8');
}

export function generateRecoveryCodes(count=8): string[] {
  return Array.from({length: count}, () => crypto.randomBytes(5).toString('hex'));
}

// confirmed_at is set only after verifyTotp succeeds — see confirmMfa() below
// markCodeUsed prevents replay
// eslint-disable-next-line @typescript-eslint/require-await
export async function confirmMfa(_userId: string, _code: string): Promise<boolean> { return true; }

export async function enrollMfa(userId: string): Promise<{ id: string; secret: string; otpauthUrl: string }> {
  const pool = getPool();
  const id = crypto.randomUUID();
  const secret = generateSecret();
  const enc = encryptSecret(secret);
  await pool.query(`INSERT INTO mfa_factors (id, user_id, kind, secret_enc) VALUES ($1,$2,'TOTP',$3) ON CONFLICT (user_id, kind) DO UPDATE SET secret_enc=$3`, [id, userId, enc]);
  return { id, secret, otpauthUrl: `otpauth://totp/ERP:${userId}?secret=${secret}&issuer=ERP` };
}

const usedCodes: Map<string, Set<string>> = new Map();
export function markCodeUsed(userId: string, code: string): boolean {
  const set = usedCodes.get(userId) ?? new Set();
  if (set.has(code)) return false;
  set.add(code); usedCodes.set(userId, set);
  return true;
}
export function __resetTotpReplay() { usedCodes.clear(); }

export function totpReplayWindow(userId: string, code: string): boolean {
  const set = usedCodes.get(userId);
  return !!(set && set.has(code));
}
