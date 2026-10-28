import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
import { postJournal } from '../../accounting/application/posting-service.js';
import { computeWac } from '../domain/valuation/wac.js';
import Decimal from 'decimal.js';
export async function receiveStock(tenantId:string, input:{ itemId:string; warehouseId:string; qty:string; unitCost:string; sourceType:string; sourceId:string; allowNegative?:boolean }): Promise<{moveId:string}>{
  const pool=getPool();
  const stockQ=await pool.query(`SELECT qty, avg_cost FROM item_stock WHERE tenant_id=$1 AND item_id=$2 AND warehouse_id=$3`,[tenantId, input.itemId, input.warehouseId]);
  const oldQty=stockQ.rows.length? (stockQ.rows[0] as {qty:string}).qty : '0';
  const oldAvg=stockQ.rows.length? (stockQ.rows[0] as {avg_cost:string}).avg_cost : '0.000000';
  const newAvg=computeWac(oldQty, oldAvg, input.qty, input.unitCost);
  const value=new Decimal(input.qty).mul(new Decimal(input.unitCost)).toFixed(4);
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    const moveId=crypto.randomUUID();
    await client.query(`INSERT INTO stock_moves (id, tenant_id, item_id, warehouse_id, direction, move_kind, qty, unit_cost, value_amount, source_type, source_id) VALUES ($1,$2,$3,$4,'IN','receipt',$5,$6,$7,$8,$9)`,[moveId, tenantId, input.itemId, input.warehouseId, input.qty, input.unitCost, value, input.sourceType, input.sourceId]);
    await client.query(`INSERT INTO stock_layers (id, tenant_id, item_id, warehouse_id, qty, unit_cost, remaining_qty, source_move_id) VALUES ($1,$2,$3,$4,$5,$6,$5,$7)`,[crypto.randomUUID(), tenantId, input.itemId, input.warehouseId, input.qty, input.unitCost, moveId]);
    if(stockQ.rows.length) await client.query(`UPDATE item_stock SET qty=(qty::numeric + $1::numeric)::text, avg_cost=$2, updated_at=now() WHERE tenant_id=$3 AND item_id=$4 AND warehouse_id=$5`,[input.qty, newAvg, tenantId, input.itemId, input.warehouseId]);
    else await client.query(`INSERT INTO item_stock (id, tenant_id, item_id, warehouse_id, qty, avg_cost) VALUES ($1,$2,$3,$4,$5,$6)`,[crypto.randomUUID(), tenantId, input.itemId, input.warehouseId, input.qty, newAvg]);
    await client.query('COMMIT');
    return {moveId};
  } catch(e){ await client.query('ROLLBACK').catch(()=>{}); throw e; } finally { (client as {release:()=>void}).release(); }
}
export async function issueStock(tenantId:string, input:{ itemId:string; warehouseId:string; qty:string; sourceType:string; sourceId:string }): Promise<{moveId:string; unitCost:string}>{
  const pool=getPool();
  const stockQ=await pool.query(`SELECT qty, avg_cost FROM item_stock WHERE tenant_id=$1 AND item_id=$2 AND warehouse_id=$3`,[tenantId, input.itemId, input.warehouseId]);
  if(!stockQ.rows.length || Number((stockQ.rows[0] as {qty:string}).qty) < Number(input.qty)){
    const allow=await pool.query(`SELECT value FROM tenant_settings WHERE tenant_id=$1 AND key='inventory.allow_negative_stock'`,[tenantId]);
    const allowed=allow.rows.length && (allow.rows[0] as {value:string}).value==='true';
    if(!allowed) throw Object.assign(new Error('INSUFFICIENT_STOCK'),{status:409});
  }
  const avg=stockQ.rows.length? (stockQ.rows[0] as {avg_cost:string}).avg_cost : '0.000000';
  const value=new Decimal(input.qty).mul(new Decimal(avg)).toFixed(4);
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    const moveId=crypto.randomUUID();
    await client.query(`INSERT INTO stock_moves (id, tenant_id, item_id, warehouse_id, direction, move_kind, qty, unit_cost, value_amount, source_type, source_id) VALUES ($1,$2,$3,$4,'OUT','issue',$5,$6,$7,$8,$9)`,[moveId, tenantId, input.itemId, input.warehouseId, input.qty, avg, value, input.sourceType, input.sourceId]);
    // FIFO consume
    const layers=await client.query(`SELECT id, remaining_qty, unit_cost FROM stock_layers WHERE tenant_id=$1 AND item_id=$2 AND warehouse_id=$3 AND remaining_qty::numeric > 0 ORDER BY created_at ASC`,[tenantId, input.itemId, input.warehouseId]);
    let need=new Decimal(input.qty);
    for(const row of layers.rows as {id:string; remaining_qty:string; unit_cost:string}[]){
      if(need.lte(0)) break;
      const avail=new Decimal(row.remaining_qty);
      const take=Decimal.min(avail, need);
      await client.query(`UPDATE stock_layers SET remaining_qty=(remaining_qty::numeric - $1::numeric)::text WHERE id=$2`,[take.toFixed(4), row.id]);
      need=need.minus(take);
    }
    await client.query(`UPDATE item_stock SET qty=(qty::numeric - $1::numeric)::text, updated_at=now() WHERE tenant_id=$2 AND item_id=$3 AND warehouse_id=$4`,[input.qty, tenantId, input.itemId, input.warehouseId]);
    await client.query('COMMIT');
    return {moveId, unitCost: avg};
  } catch(e){ await client.query('ROLLBACK').catch(()=>{}); throw e; } finally { (client as {release:()=>void}).release(); }
}
export async function postAdjustment(tenantId:string, input:{ itemId:string; warehouseId:string; qtyDiff:string; reason:string; valueDate:string }): Promise<{journalId:string}>{
  const isGain=Number(input.qtyDiff) > 0;
  const costQ=await getPool().query(`SELECT avg_cost FROM item_stock WHERE tenant_id=$1 AND item_id=$2 AND warehouse_id=$3`,[tenantId, input.itemId, input.warehouseId]);
  const unitCost=costQ.rows.length? (costQ.rows[0] as {avg_cost:string}).avg_cost : '0.000000';
  const amount=new Decimal(input.qtyDiff).abs().mul(new Decimal(unitCost)).toFixed(4);
  const res=await postJournal(tenantId,'SAR',{ entryDate: input.valueDate, currency:'SAR', description:`Adjustment ${input.reason}`, lines: isGain ? [{purpose:'INVENTORY', direction:'debit', amount}, {purpose:'INVENTORY_APPRECIATION', direction:'credit', amount}] : [{purpose:'INVENTORY_SHRINKAGE', direction:'debit', amount}, {purpose:'INVENTORY', direction:'credit', amount}], source:{docType:'stock_adjustment', docId: crypto.randomUUID(), operation:'POST'}} as unknown as {entryDate:string; currency:string; description:string; lines:{purpose:string; direction:'debit'|'credit'; amount:string}[]; source:{docType:string; docId:string; operation:string}});
  // create stock move accordingly
  if(isGain) await receiveStock(tenantId,{ itemId:input.itemId, warehouseId:input.warehouseId, qty: input.qtyDiff, unitCost, sourceType:'stock_adjustment', sourceId: res.id });
  else await issueStock(tenantId,{ itemId:input.itemId, warehouseId:input.warehouseId, qty: new Decimal(input.qtyDiff).abs().toFixed(4), sourceType:'stock_adjustment', sourceId: res.id });
  return {journalId: res.id};
}
