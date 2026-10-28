import { getPool } from '../../../infra/db/db.js';
import { postJournal } from './posting-service.js';
import crypto from 'node:crypto';

export async function createRecurring(tenantId: string, input: { name: string; template: unknown; schedule: string; nextRunDate: string }): Promise<{ id: string }> {
  const pool = getPool();
  const id = crypto.randomUUID();
  await pool.query(`INSERT INTO recurring_journals (id, tenant_id, name, template, schedule, next_run_date) VALUES ($1,$2,$3,$4,$5,$6)`, [id, tenantId, input.name, JSON.stringify(input.template), input.schedule, input.nextRunDate]);
  return { id };
}

export async function runDue(tenantId: string, baseCurrency: string, date: string): Promise<string[]> {
  const pool = getPool();
  const due = await pool.query(`SELECT id, template FROM recurring_journals WHERE tenant_id=$1 AND status='ACTIVE' AND next_run_date <= $2::date`, [tenantId, date]);
  const posted: string[] = [];
  for (const r of due.rows) {
    const row = r as { id: string; template: { lines: { accountId: string; direction: 'debit'|'credit'; amount: string }[]; description?: string; currency?: string } };
    try {
      const res = await postJournal(tenantId, baseCurrency, {
        entryDate: date, description: row.template.description ?? `Recurring ${(r as { id: string }).id}`, currency: row.template.currency ?? baseCurrency,
        lines: row.template.lines, source: { docType: 'recurring', docId: row.id, operation: 'POST' },
      });
      await pool.query(`UPDATE recurring_journals SET last_run_at=now(), next_run_date = next_run_date + interval '1 month' WHERE id=$1`, [row.id]);
      posted.push(res.id);
    } catch (_e) { /* log and continue */ }
  }
  return posted;
}
