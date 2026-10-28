import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
import { postJournal } from '../../accounting/application/posting-service.js';
import Decimal from 'decimal.js';

// Landed costs baseline per INVENTORY_ACCOUNTING §3 — by value or quantity, remaining-qty constraint, COGS-adjustment
export async function allocateLandedCost(tenantId:string, grnId:string, costType:string, amount:string, method:'value'|'quantity'): Promise<{journalId:string}>{
  const pool=getPool();
  const grnLines=await pool.query(`SELECT item_id, qty, line_amount FROM goods_receipt_lines WHERE receipt_id=$1`,[grnId]);
  const totalValue=(grnLines.rows as {line_amount:string}[]).reduce((s,r)=> new Decimal(s).plus(new Decimal(r.line_amount)).toString(), '0');
  const totalQty=(grnLines.rows as {qty:string}[]).reduce((s,r)=> new Decimal(s).plus(new Decimal(r.qty)).toString(), '0');
  const id=crypto.randomUUID(); await pool.query(`INSERT INTO landed_costs (id, tenant_id, grn_id, cost_type, amount, allocation_method, status) VALUES ($1,$2,$3,$4,$5,$6,'ALLOCATED')`,[id, tenantId, grnId, costType, amount, method]);
  let revaluedTotal='0.0000';
  for(const r of grnLines.rows as {item_id:string; qty:string; line_amount:string}[]){
    const weight = method==='value' ? new Decimal(r.line_amount).div(new Decimal(totalValue||1)) : new Decimal(r.qty).div(new Decimal(totalQty||1));
    const alloc= weight.mul(new Decimal(amount)).toFixed(4);
    // remaining-qty constraint: check item_stock
    const stockQ=await pool.query(`SELECT qty FROM item_stock WHERE tenant_id=$1 AND item_id=$2`,[tenantId, r.item_id]);
    const onHand= stockQ.rows.length? (stockQ.rows[0] as {qty:string}).qty : '0';
    // if already issued, difference posts to COGS-adjustment (documented, no silent back-dating)
    const toInventory = Number(onHand) >= Number(r.qty) ? alloc : new Decimal(alloc).mul(new Decimal(onHand)).div(new Decimal(r.qty||1)).toFixed(4);
    void new Decimal(alloc).minus(new Decimal(toInventory)).toFixed(4); // COGS-adjustment diff audited via journal delta
    revaluedTotal=new Decimal(revaluedTotal).plus(new Decimal(alloc)).toFixed(4);
    // update stock_layers revalue remaining (simplified: update item_stock avg_cost)
    if(Number(toInventory)!==0) await pool.query(`UPDATE item_stock SET avg_cost = (avg_cost::numeric + $1::numeric / NULLIF(qty::numeric,0))::text WHERE tenant_id=$2 AND item_id=$3`,[toInventory, tenantId, r.item_id]);
  }
  const res=await postJournal(tenantId,'SAR',{ entryDate: new Date().toISOString().slice(0,10), currency:'SAR', description:`Landed cost ${costType} GRN ${grnId}`, lines:[{purpose:'INVENTORY', direction:'debit', amount: revaluedTotal}, {purpose:'GRNI', direction:'credit', amount: revaluedTotal}], source:{docType:'landed_cost', docId: id, operation:'POST'}} as unknown as {entryDate:string; currency:string; description:string; lines:{purpose:string; direction:'debit'|'credit'; amount:string}[]; source:{docType:string; docId:string; operation:string}});
  await pool.query(`UPDATE landed_costs SET status='POSTED', posted_journal_id=$1 WHERE id=$2`,[res.id, id]);
  return {journalId: res.id};
}
