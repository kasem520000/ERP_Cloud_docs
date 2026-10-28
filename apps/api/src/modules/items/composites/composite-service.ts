import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
export async function defineComposite(tenantId:string, parentId:string, components:{itemId:string; qty:string}[]){
  const pool=getPool(); for(const c of components) await pool.query(`INSERT INTO composite_definitions (id, tenant_id, parent_item_id, component_item_id, qty) VALUES ($1,$2,$3,$4,$5)`,[crypto.randomUUID(), tenantId, parentId, c.itemId, c.qty]);
}
export async function explodeComposite(tenantId:string, parentId:string, qty:string): Promise<{itemId:string; qty:string}[]>{
  const pool=getPool(); const r=await pool.query(`SELECT component_item_id, qty FROM composite_definitions WHERE tenant_id=$1 AND parent_item_id=$2`,[tenantId, parentId]);
  return (r.rows as {component_item_id:string; qty:string}[]).map(rw=> ({itemId: rw.component_item_id, qty: (Number(rw.qty)*Number(qty)).toFixed(4)}));
}
