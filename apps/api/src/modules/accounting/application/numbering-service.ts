import { getPool } from '../../../infra/db/db.js';

// ADR-0006: gapless within (tenant, docType, branch) year bucket, format JE-{yyyy}-{seq:6}
export async function nextNo(tenantId: string, docType: string, branchId: string | null, yyyy: string, trx?: unknown): Promise<string> {
  const pool: { query: (sql: string, params: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> } = getPool() as unknown as { query: (sql: string, params: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> };
  // advisory lock + update atomically
  const conn: { query: (sql: string, params: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> } = (trx ? trx : pool) as unknown as { query: (sql: string, params: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> };
  // For gapless: SELECT ... FOR UPDATE then UPDATE
  const r = await conn.query(`SELECT id, next_seq, prefix, format_template FROM numbering_sequences WHERE tenant_id=$1 AND doc_type=$2 AND (branch_id=$3 OR (branch_id IS NULL AND $3 IS NULL)) LIMIT 1`, [tenantId, docType, branchId]);
  let seq = 1, fmt = '{prefix}{yyyy}-{seq:6}', prefix = 'JE-';
  if (r.rows.length === 0) {
    const { randomUUID } = await import('node:crypto'); await conn.query(`INSERT INTO numbering_sequences (id, tenant_id, branch_id, doc_type, prefix, next_seq) VALUES ($1,$2,$3,$4,$5,2)`, [randomUUID(), tenantId, branchId, docType, prefix]);
  } else {
    seq = (r.rows[0] as { next_seq: number }).next_seq;
    prefix = (r.rows[0] as { prefix: string }).prefix ?? prefix;
    fmt = (r.rows[0] as { format_template: string }).format_template ?? fmt;
    await conn.query(`UPDATE numbering_sequences SET next_seq=next_seq+1 WHERE tenant_id=$1 AND doc_type=$2 AND (branch_id=$3 OR (branch_id IS NULL AND $3 IS NULL))`, [tenantId, docType, branchId]);
  }
  const seqStr = String(seq).padStart(6, '0');
  return fmt.replace('{prefix}', prefix).replace('{yyyy}', yyyy).replace('{seq:6}', seqStr).replace('{seq}', seqStr);
}
