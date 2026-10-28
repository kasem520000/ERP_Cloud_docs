import { getPool } from '../../../infra/db/db.js';
export async function getAvailability(tenantId:string, itemId:string, warehouseId:string): Promise<{onHand:string; inTransit:string; reserved:string; available:string}>{
  const pool=getPool();
  const onHandQ=await pool.query(`SELECT COALESCE(qty,'0') AS qty FROM item_stock WHERE tenant_id=$1 AND item_id=$2 AND warehouse_id=$3`,[tenantId, itemId, warehouseId]);
  const onHand=(onHandQ.rows[0] as {qty:string}|undefined)?.qty ?? '0';
  const intransitQ=await pool.query(`SELECT COALESCE(SUM(qty::numeric),0)::text AS qty FROM stock_transfer_lines tl JOIN stock_transfers t ON t.id=tl.transfer_id WHERE t.tenant_id=$1 AND t.to_warehouse_id=$3 AND t.status='IN_TRANSIT' AND tl.item_id=$2`,[tenantId, itemId, warehouseId]);
  const inTransit=(intransitQ.rows[0] as {qty:string}).qty;
  const reservedQ=await pool.query(`SELECT COALESCE(SUM(qty::numeric),0)::text AS qty FROM stock_reservations WHERE tenant_id=$1 AND item_id=$2 AND warehouse_id=$3 AND status='ACTIVE' AND expires_at > now()`,[tenantId, itemId, warehouseId]);
  const reserved=(reservedQ.rows[0] as {qty:string}).qty;
  const available=(Number(onHand)-Number(reserved)).toFixed(4);
  return {onHand, inTransit, reserved, available};
}
