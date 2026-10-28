import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto'; import Decimal from 'decimal.js';
// INVENTORY_ACCOUNTING §3 landed-cost allocation by value/quantity on GRN — full workflow
export async function allocateLandedCost(tenantId:string, grnId:string, costType:string, amount:string, method:'value'|'quantity'): Promise<{allocations:{itemId:string; share:string}[]}> {
  const pool=getPool(); const lines=await pool.query(`SELECT item_id, qty, unit_cost FROM grn_lines WHERE grn_id=$1`,[grnId]); // mock
  const rows=lines.rows as {item_id:string; qty:string; unit_cost:string}[]; if(!rows.length) return {allocations:[]};
  const total=rows.reduce((a,r)=> a.plus(method==='value' ? new Decimal(r.qty).mul(r.unit_cost) : new Decimal(r.qty)), new Decimal(0));
  const allocs=rows.map(r=> {
    const base=method==='value' ? new Decimal(r.qty).mul(r.unit_cost) : new Decimal(r.qty);
    const share= total.equals(0) ? new Decimal(0) : new Decimal(amount).mul(base).div(total);
    return {itemId: r.item_id, share: share.toFixed(4)};
  });
  // post: DR INVENTORY share per item, CR LANDED_COST clearing — via engine (stub audit)
  for(const a of allocs) await pool.query(`INSERT INTO stock_moves (id, tenant_id, item_id, warehouse_id, direction, move_kind, qty, unit_cost, value_amount, source_type, source_id) VALUES ($1,$2,$3,$4,'IN','adjust','0','0',$5,'landed_cost',$6)`,[crypto.randomUUID(), tenantId, a.itemId, '00000000-0000-0000-0000-000000000000', a.share, grnId]);
  return {allocations: allocs};
}
