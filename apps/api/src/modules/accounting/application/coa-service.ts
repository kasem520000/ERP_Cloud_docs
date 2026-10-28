import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';

// V-rules: cycle-checked parents, homogeneous types V3, leaf∧not-group postable V5, currency restriction V6/INV-005, archive guards INV-015

export async function createAccount(tenantId: string, input: { code: string; name: string; nameAr?: string; type: string; parentId?: string; currencyCode?: string }): Promise<{ id: string }> {
  const pool = getPool();
  if (input.parentId) {
    const parentRows: { type: string }[] = ((await pool.query(`SELECT type, id FROM accounts WHERE id=$1 AND tenant_id=$2`, [input.parentId, tenantId])).rows as { type: string }[]);
    if (parentRows.length === 0) throw Object.assign(new Error('parent_not_found'), { status: 404 });
    if ((parentRows[0] as { type: string }).type !== input.type) throw Object.assign(new Error('V3: parent type mismatch'), { status: 400 });
    // cycle check: walk up parents, ensure not self
    let cur: string | undefined = input.parentId;
    const visited = new Set<string>();
    while (cur) {
      if (visited.has(cur)) throw Object.assign(new Error('cycle_detected'), { status: 400 });
      visited.add(cur);
      const rr: { parent_id?: string }[] = ((await pool.query(`SELECT parent_id FROM accounts WHERE id=$1 AND tenant_id=$2`, [cur, tenantId])).rows as { parent_id?: string }[]);
      cur = rr[0]?.parent_id ?? undefined;
    }
  }
  const dup = await pool.query(`SELECT id FROM accounts WHERE tenant_id=$1 AND code=$2`, [tenantId, input.code]);
  if (dup.rows.length > 0) throw Object.assign(new Error('code_duplicate'), { status: 409 });
  const id = crypto.randomUUID();
  // is_postable = leaf initially true, will be set false if children exist (service maintains)
  await pool.query(`INSERT INTO accounts (id, tenant_id, code, name, name_ar, type, parent_id, is_postable, currency_code) VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8)`,
    [id, tenantId, input.code, input.name, input.nameAr ?? null, input.type, input.parentId ?? null, input.currencyCode ?? null]);
  // if parent exists, mark parent non-postable (V5: group nodes never postable)
  if (input.parentId) await pool.query(`UPDATE accounts SET is_postable=false WHERE id=$1 AND tenant_id=$2`, [input.parentId, tenantId]);
  return { id };
}

export async function resolvePurpose(tenantId: string, purposeKey: string): Promise<string | null> {
  const pool = getPool();
  const r = await pool.query(`SELECT account_id FROM account_purposes WHERE tenant_id=$1 AND purpose_key=$2 AND active_to IS NULL`, [tenantId, purposeKey]);
  if (r.rows.length === 0) return null; // fail-closed PURPOSE_NOT_MAPPED
  return (r.rows[0] as { account_id: string }).account_id;
}

export async function setPurpose(tenantId: string, purposeKey: string, accountId: string): Promise<void> {
  const pool = getPool();
  // ensure exactly 1 active per purpose: close previous
  await pool.query(`UPDATE account_purposes SET active_to=CURRENT_DATE WHERE tenant_id=$1 AND purpose_key=$2 AND active_to IS NULL`, [tenantId, purposeKey]);
  await pool.query(`INSERT INTO account_purposes (id, tenant_id, purpose_key, account_id, active_from) VALUES ($1,$2,$3,$4,CURRENT_DATE)`, [crypto.randomUUID(), tenantId, purposeKey, accountId]);
}

export async function archiveAccount(tenantId: string, accountId: string): Promise<void> {
  const pool = getPool();
  const postings = await pool.query(`SELECT id FROM journal_lines WHERE account_id=$1 AND tenant_id=$2 LIMIT 1`, [accountId, tenantId]);
  if (postings.rows.length > 0) throw Object.assign(new Error('INV-015: account has postings'), { status: 409 });
  const children = await pool.query(`SELECT id FROM accounts WHERE parent_id=$1 AND tenant_id=$2 LIMIT 1`, [accountId, tenantId]);
  if (children.rows.length > 0) throw Object.assign(new Error('INV-015: account has children'), { status: 409 });
  const mapped = await pool.query(`SELECT id FROM account_purposes WHERE account_id=$1 AND tenant_id=$2 AND active_to IS NULL`, [accountId, tenantId]);
  if (mapped.rows.length > 0) throw Object.assign(new Error('INV-015: required-purpose account cannot be archived while mapped'), { status: 409 });
  await pool.query(`UPDATE accounts SET status='ARCHIVED' WHERE id=$1 AND tenant_id=$2`, [accountId, tenantId]);
}
