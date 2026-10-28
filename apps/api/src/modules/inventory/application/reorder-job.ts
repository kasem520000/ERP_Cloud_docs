import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
export async function checkReorder(): Promise<{triggered:number}>{
  const pool=getPool();
  const rows=await pool.query(`SELECT iws.tenant_id, iws.item_id, s.qty, iws.reorder_level FROM item_warehouse_settings iws JOIN item_stock s ON s.tenant_id=iws.tenant_id AND s.item_id=iws.item_id AND s.warehouse_id=iws.warehouse_id WHERE s.qty::numeric < iws.reorder_level::numeric AND iws.reorder_level::numeric > 0`);
  let triggered=0;
  for(const row of rows.rows as {tenant_id:string; item_id:string}[]){
    await pool.query(`INSERT INTO audit_events (id, tenant_id, action, entity_type, entity_id, after) VALUES ($1,$2,'stock.below_reorder','item',$3,$4)`,[crypto.randomUUID(), row.tenant_id, row.item_id, JSON.stringify({at:new Date().toISOString()})]);
    triggered++;
  }
  return {triggered};
}
