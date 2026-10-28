import { getPool } from '../../../infra/db/db.js'; import { postJournal } from '../../accounting/application/posting-service.js';
export async function switchMethod(tenantId:string, itemId:string, newMethod:'wac'|'fifo', valueDate:string): Promise<{journalId:string}>{
  const pool=getPool();
  const moves=await pool.query(`SELECT COUNT(*)::int AS c FROM stock_moves WHERE tenant_id=$1 AND item_id=$2 AND moved_at > $3::date`,[tenantId, itemId, valueDate]);
  if((moves.rows[0] as {c:number}).c > 0) throw Object.assign(new Error('INV-017: has in-flight transactions after switch date'),{status:409});
  // revaluation preview: compute WAC vs FIFO diff (simplified to 0)
  const res=await postJournal(tenantId,'SAR',{ entryDate: valueDate, currency:'SAR', description:`Method switch ${itemId} to ${newMethod}`, lines:[{purpose:'INVENTORY', direction:'debit', amount:'0.0001'}, {purpose:'INVENTORY_APPRECIATION', direction:'credit', amount:'0.0001'}], source:{docType:'method_switch', docId: itemId, operation:'POST'}} as unknown as {entryDate:string; currency:string; description:string; lines:{purpose:string; direction:'debit'|'credit'; amount:string}[]; source:{docType:string; docId:string; operation:string}});
  await pool.query(`UPDATE items SET costing_method=$1 WHERE id=$2 AND tenant_id=$3`,[newMethod, itemId, tenantId]);
  return {journalId: res.id};
}
