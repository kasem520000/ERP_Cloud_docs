import { getPool } from '../../../infra/db/db.js';
import crypto from 'node:crypto';

export async function createBranch(tenantId: string, input: { code: string; name: string; nameAr?: string; address?: unknown }): Promise<{ id: string }> {
  const pool = getPool();
  const id = crypto.randomUUID();
  if (!input.code || !input.name) throw Object.assign(new Error('validation_failed'), { status: 400 });
  await pool.query(`INSERT INTO branches (id, tenant_id, code, name, name_ar, address) VALUES ($1,$2,$3,$4,$5,$6)`, [id, tenantId, input.code, input.name, input.nameAr ?? null, input.address ? JSON.stringify(input.address) : null]);
  await pool.query(`INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, after) VALUES ($1,$2,$2,'branch.created','branch',$3,$4)`, [crypto.randomUUID(), tenantId, tenantId, id, JSON.stringify(input)]);
  return { id };
}

export function isBranchAllowed(membershipBranchScope: string[] | null | undefined, branchId: string): boolean {
  if (!membershipBranchScope || membershipBranchScope.length === 0) return true;
  return membershipBranchScope.includes(branchId);
}

export async function listBranches(tenantId: string): Promise<{ id: string; code: string; name: string }[]> {
  const pool = getPool();
  const res = await pool.query(`SELECT id, code, name FROM branches WHERE tenant_id=$1 ORDER BY code`, [tenantId]);
  return res.rows as { id: string; code: string; name: string }[];
}
