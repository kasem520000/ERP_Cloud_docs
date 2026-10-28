import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';

export async function createFiscalYear(tenantId: string, name: string, startDate: string, endDate: string): Promise<{ id: string }> {
  const pool = getPool();
  // idempotent: if exists return it
  const existing = await pool.query(`SELECT id FROM fiscal_years WHERE tenant_id=$1 AND name=$2`, [tenantId, name]);
  if (existing.rows.length > 0) return { id: (existing.rows[0] as { id: string }).id };
  const id = crypto.randomUUID();
  await pool.query(`INSERT INTO fiscal_years (id, tenant_id, name, start_date, end_date) VALUES ($1,$2,$3,$4,$5)`, [id, tenantId, name, startDate, endDate]);
  // auto-create 12 monthly periods
  const start = new Date(startDate);
  for (let i = 0; i < 12; i++) {
    const s = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const e = new Date(start.getFullYear(), start.getMonth() + i + 1, 0);
    const pid = crypto.randomUUID();
    await pool.query(`INSERT INTO fiscal_periods (id, tenant_id, fiscal_year_id, name, start_date, end_date, status) VALUES ($1,$2,$3,$4,$5,$6,'OPEN')`,
      [pid, tenantId, id, `${name}-${String(i+1).padStart(2,'0')}`, s.toISOString().slice(0,10), e.toISOString().slice(0,10)]);
  }
  // N+1-while-N-open: creating next year while current open is allowed — no guard needed
  return { id };
}

export async function softClosePeriod(tenantId: string, periodId: string, reason: string, userId?: string): Promise<void> {
  const pool = getPool();
  await pool.query(`UPDATE fiscal_periods SET status='SOFT_CLOSED', closed_at=now(), closed_by=$3 WHERE id=$1 AND tenant_id=$2`, [periodId, tenantId, userId ?? null]);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$3,'period.soft_closed','fiscal_period',$4,$5)`,
    [crypto.randomUUID(), tenantId, userId ?? null, periodId, JSON.stringify({ reason })]);
}

export async function lockPeriod(tenantId: string, periodId: string, userId?: string): Promise<void> {
  const pool = getPool();
  // PC-04: cannot LOCK while core reconciliation BROKEN
  const broken = await pool.query(`SELECT id FROM reconciliation_runs WHERE tenant_id=$1 AND status='BROKEN' AND run_at > now() - interval '1 day' LIMIT 1`, [tenantId]);
  if (broken.rows.length > 0) throw Object.assign(new Error('PC-04: reconciliation BROKEN blocks lock'), { status: 409 });
  await pool.query(`UPDATE fiscal_periods SET status='LOCKED', closed_at=now(), closed_by=$3 WHERE id=$1 AND tenant_id=$2`, [periodId, tenantId, userId ?? null]);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$3,'period.locked','fiscal_period',$4,$5)`,
    [crypto.randomUUID(), tenantId, userId ?? null, periodId, JSON.stringify({ at: new Date().toISOString() })]);
}

export async function reopenPeriod(tenantId: string, periodId: string, reason: string, userId?: string): Promise<void> {
  const pool = getPool();
  const r = await pool.query(`SELECT start_date FROM fiscal_periods WHERE id=$1 AND tenant_id=$2`, [periodId, tenantId]);
  if (r.rows.length === 0) throw Object.assign(new Error('period_not_found'), { status: 404 });
  const start = new Date((r.rows[0] as { start_date: string }).start_date);
  const ageMonths = (Date.now() - start.getTime()) / (30*24*3600*1000);
  await pool.query(`UPDATE fiscal_periods SET status='OPEN' WHERE id=$1 AND tenant_id=$2`, [periodId, tenantId]);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$3,'period.reopened','fiscal_period',$4,$5)`,
    [crypto.randomUUID(), tenantId, userId ?? null, periodId, JSON.stringify({ reason, anti_fraud_alert: ageMonths > 2 })]);
  if (ageMonths > 2) {
    // anti-fraud alert INV-020
    await pool.query(`INSERT INTO audit_events (id, tenant_id, action, entity_type, entity_id, after) VALUES ($1,$2,'period.reopen.anti_fraud_alert','fiscal_period',$3,$4)`,
      [crypto.randomUUID(), tenantId, periodId, JSON.stringify({ ageMonths, reason })]);
  }
}

export async function isDatePostable(tenantId: string, date: string): Promise<boolean> {
  const pool = getPool();
  const r = await pool.query(`SELECT status FROM fiscal_periods WHERE tenant_id=$1 AND $2::date BETWEEN start_date AND end_date`, [tenantId, date]);
  if (r.rows.length === 0) return false;
  const s = (r.rows[0] as { status: string }).status;
  return s === 'OPEN'; // SOFT_CLOSED requires permission+reason (PC-02) — not open by default
}
