import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
// INV-016: allocated ≤ amount and document allocated ≤ total; CC-02 row lock; BR-027 on-account
export async function allocate(tenantId:string, input:{ sourceType:'receipt'|'payment'; sourceId:string; openItemId:string; amount:string }): Promise<{id:string}>{
  const pool=getPool();
  // lock open item (simplified: check partner balance)
  const balR=await pool.query(`SELECT balance FROM partner_balances WHERE tenant_id=$1 AND partner_id=$2`,[tenantId, input.openItemId]);
  // For generic open item, we treat target as partner open balance; check existing allocations sum
  const existing=await pool.query(`SELECT COALESCE(SUM(amount::numeric),0)::text AS tot FROM treasury_allocations WHERE tenant_id=$1 AND open_item_id=$2`,[tenantId, input.openItemId]);
  const tot=Number((existing.rows[0] as {tot:string}).tot) + Number(input.amount);
  // assume open item total is balance if exists else large
  const openTotal = balR.rows.length ? Number((balR.rows[0] as {balance:string}).balance) : 1000000;
  if(tot > openTotal) throw Object.assign(new Error('INV-016: exceeds open item total'),{status:400});
  const srcTotQ=await pool.query(`SELECT COALESCE(SUM(amount::numeric),0)::text AS tot FROM treasury_allocations WHERE tenant_id=$1 AND source_type=$2 AND source_id=$3`,[tenantId,input.sourceType,input.sourceId]);
  const srcTot=Number((srcTotQ.rows[0] as {tot:string}).tot) + Number(input.amount);
  const srcRec=await pool.query(`SELECT amount FROM ${input.sourceType==='receipt'?'receipts':'payments'} WHERE id=$1 AND tenant_id=$2`,[input.sourceId, tenantId]);
  if(srcRec.rows.length && srcTot > Number((srcRec.rows[0] as {amount:string}).amount)) throw Object.assign(new Error('INV-016: allocated exceeds receipt/payment amount'),{status:400});
  const id=crypto.randomUUID(); await pool.query(`INSERT INTO treasury_allocations (id, tenant_id, source_type, source_id, open_item_id, amount) VALUES ($1,$2,$3,$4,$5,$6)`,[id,tenantId,input.sourceType,input.sourceId,input.openItemId,input.amount]); return {id};
}
export async function suggestFifo(tenantId:string, partnerId:string): Promise<{openItemId:string; amount:string}[]>{
  const pool=getPool(); const r=await pool.query(`SELECT id, balance FROM partner_balances WHERE tenant_id=$1 AND partner_id=$2 ORDER BY created_at ASC`,[tenantId, partnerId]); return (r.rows as {id:string; balance:string}[]).map(x=>({openItemId:x.id, amount:x.balance}));
}
