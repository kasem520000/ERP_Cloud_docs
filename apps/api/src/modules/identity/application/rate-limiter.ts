type Bucket = { count: number; resetAt: number };
const perIp: Map<string, Bucket> = new Map();
const perEmail: Map<string, Bucket> = new Map();

// progressive lockout: 3 attempts 30s, 5 attempts 5m, 7+ 15m (locked_until)
export const LOCKOUT_STEPS: Record<number, number> = { 3: 30_000, 5: 5*60_000, 7: 15*60_000 };

export function checkRateLimit(key: string, windowMs: number, max: number, store: Map<string, Bucket>): boolean {
  const now = Date.now();
  const b = store.get(key);
  if (!b || b.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= max) return false;
  b.count++;
  return true;
}

export function checkLoginRateLimit(ip: string, email: string): { allowed: boolean; reason?: string } {
  if (!checkRateLimit(`ip:${ip}`, 60_000, 20, perIp)) return { allowed: false, reason: 'RATE_LIMIT_IP' };
  if (!checkRateLimit(`email:${email}`, 15*60_000, 10, perEmail)) return { allowed: false, reason: 'RATE_LIMIT_EMAIL' };
  return { allowed: true };
}

export function lockoutDuration(failedCount: number): number | null | undefined {
  if (failedCount >= 7) return LOCKOUT_STEPS[7];
  if (failedCount >= 5) return LOCKOUT_STEPS[5];
  if (failedCount >= 3) return LOCKOUT_STEPS[3];
  return null;
}

export function resetRateLimit() { perIp.clear(); perEmail.clear(); }

export function __perIp() { return perIp; }
