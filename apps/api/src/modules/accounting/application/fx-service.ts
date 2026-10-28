import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';

export async function upsertRate(tenantId: string, currencyCode: string, rateDate: string, rate: string, source: string = 'MANUAL'): Promise<{ id: string }> {
  if (Number(rate) <= 0) throw Object.assign(new Error('rate_must_be_positive'), { status: 400 });
  if (!/^\d{1,15}(\.\d{1,8})?$/.test(rate)) throw Object.assign(new Error('invalid_rate_format'), { status: 400 });
  const pool = getPool();
  const id = crypto.randomUUID();
  await pool.query(`INSERT INTO exchange_rates (id, tenant_id, currency_code, rate_date, rate, source) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (tenant_id, currency_code, rate_date) DO UPDATE SET rate=EXCLUDED.rate, source=EXCLUDED.source`,
    [id, tenantId, currencyCode, rateDate, rate, source]);
  return { id };
}

export async function getRate(tenantId: string, currencyCode: string, date: string): Promise<string | null> {
  const pool = getPool();
  // dated lookup: most recent rate <= date
  const r = await pool.query(`SELECT rate FROM exchange_rates WHERE tenant_id=$1 AND currency_code=$2 AND rate_date <= $3::date ORDER BY rate_date DESC LIMIT 1`, [tenantId, currencyCode, date]);
  if (r.rows.length === 0) return null;
  return (r.rows[0] as { rate: string }).rate;
}
