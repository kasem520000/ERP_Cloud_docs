import { getPool } from '../../../infra/db/db.js';
import { evaluateLine } from '../domain/matching.js';

// BR-009: PO ↔ GRN ↔ invoice consistency, tolerance, disposition
export async function previewMatch(tenantId:string, input:{ poId:string; grnId:string; invoiceLines:{itemId:string; qty:string; unitPrice:string}[] }): Promise<{ match_result:unknown[]; blocked:boolean }>{
  const pool=getPool();
  const poLines=await pool.query(`SELECT item_id, qty, unit_price FROM purchase_order_lines WHERE order_id=$1`,[input.poId]);
  const grnLines=await pool.query(`SELECT item_id, qty FROM goods_receipt_lines WHERE receipt_id=$1`,[input.grnId]);
  const qtyTolQ=await pool.query(`SELECT value FROM tenant_settings WHERE tenant_id=$1 AND key='purchasing.match.qty_tolerance_pct'`,[tenantId]);
  const priceTolQ=await pool.query(`SELECT value FROM tenant_settings WHERE tenant_id=$1 AND key='purchasing.match.price_tolerance_pct'`,[tenantId]);
  const qtyTol= qtyTolQ.rows.length? Number((qtyTolQ.rows[0] as {value:string}).value) : 0;
  const priceTol= priceTolQ.rows.length? Number((priceTolQ.rows[0] as {value:string}).value) : 0;
  const results: unknown[]=[];
  let blocked=false;
  for(const inv of input.invoiceLines){
    const po=(poLines.rows as {item_id:string; qty:string; unit_price:string}[]).find(r=> r.item_id===inv.itemId);
    const grn=(grnLines.rows as {item_id:string; qty:string}[]).find(r=> r.item_id===inv.itemId);
    if(!po || !grn){ results.push({itemId: inv.itemId, outcome:'BOTH_VARIANCE'}); blocked=true; continue; }
    const ev=evaluateLine({ poQty: po.qty, poPrice: po.unit_price, grnQty: grn.qty, invQty: inv.qty, invPrice: inv.unitPrice, qtyTolPct: qtyTol, priceTolPct: priceTol });
    results.push({itemId: inv.itemId, ...ev});
    if(!ev.withinTolerance) blocked=true;
  }
  return { match_result: results, blocked };
}
export async function saveMatchResult(tenantId:string, invoiceId:string, matchResult:unknown): Promise<void>{
  await getPool().query(`UPDATE supplier_invoices SET match_result=$1 WHERE id=$2 AND tenant_id=$3`,[JSON.stringify(matchResult), invoiceId, tenantId]);
}
export async function dispositionMatch(tenantId:string, invoiceId:string, disposition:{ lineId:string; action:'accept-with-reason'|'debit_note'|'grn_amendment'; reason:string }): Promise<void>{
  // BR-009: variances above tolerance require buyer disposition before approval
  if(!disposition.reason) throw Object.assign(new Error('reason required'),{status:400});
  const pool=getPool(); await pool.query(`UPDATE supplier_invoices SET match_result = jsonb_set(COALESCE(match_result,'[]'::jsonb), '{0}', $1::jsonb) WHERE id=$2`,[JSON.stringify(disposition), invoiceId]);
}
