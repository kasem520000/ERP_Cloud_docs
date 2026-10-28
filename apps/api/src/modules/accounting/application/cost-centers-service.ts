import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';
export async function createCostCenter(tenantId: string, input: { code: string; name: string; parentId?: string }): Promise<{ id: string }> {
  const pool = getPool();
  if (input.parentId) {
    let cur: string | undefined = input.parentId;
    const visited = new Set<string>();
    while (cur) {
      if (visited.has(cur)) throw Object.assign(new Error('cycle'), { status: 400 });
      visited.add(cur);
      const rows: { parent_id?: string }[] = ((await pool.query(`SELECT parent_id FROM cost_centers WHERE id=$1 AND tenant_id=$2`, [cur, tenantId])).rows as { parent_id?: string }[]);
      cur = rows[0]?.parent_id ?? undefined;
    }
  }
  const id = crypto.randomUUID();
  await pool.query(`INSERT INTO cost_centers (id, tenant_id, code, name, parent_id) VALUES ($1,$2,$3,$4,$5)`, [id, tenantId, input.code, input.name, input.parentId ?? null]);
  return { id };
}
