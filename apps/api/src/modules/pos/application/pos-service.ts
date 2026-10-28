import { getPool } from '../../../infra/db/db.js'; import crypto from 'node:crypto';
export async function registerTerminal(tenantId:string, branchId:string, code:string, name:string, cashAccountId:string): Promise<{id:string}>{
  const pool=getPool(); const id=crypto.randomUUID();
  await pool.query(`INSERT INTO pos_terminals (id, tenant_id, branch_id, code, name, cash_account_id) VALUES ($1,$2,$3,$4,$5,$6)`,[id, tenantId, branchId, code, name, cashAccountId]);
  return {id};
}
export async function openShift(tenantId:string, terminalId:string, cashierId:string, openingCash:string): Promise<{id:string}>{
  const pool=getPool(); const id=crypto.randomUUID();
  await pool.query(`INSERT INTO pos_shifts (id, tenant_id, terminal_id, cashier_user_id, opening_cash) VALUES ($1,$2,$3,$4,$5)`,[id, tenantId, terminalId, cashierId, openingCash]);
  return {id};
}
export async function closeShift(tenantId:string, shiftId:string, closingCash:string): Promise<{variance:string}>{
  const pool=getPool(); const sh=await pool.query(`SELECT opening_cash FROM pos_shifts WHERE id=$1 AND tenant_id=$2`,[shiftId, tenantId]);
  const opening=(sh.rows[0] as {opening_cash:string}).opening_cash;
  const variance=(Number(closingCash)-Number(opening)).toFixed(4);
  await pool.query(`UPDATE pos_shifts SET closing_cash=$2, variance=$3, closed_at=now(), status='CLOSED' WHERE id=$1`,[shiftId, closingCash, variance]);
  return {variance};
}
export async function createPosSale(tenantId:string, terminalId:string, shiftId:string, total:string, lines:{itemId:string; qty:string; price:string}[]): Promise<{id:string; invoiceId:string}>{
  const pool=getPool();
  // enforce shift OPEN
  const sh=await pool.query(`SELECT status FROM pos_shifts WHERE id=$1`,[shiftId]);
  if(!sh.rows.length || (sh.rows[0] as {status:string}).status!=='OPEN') throw Object.assign(new Error('shift_not_open'),{status:422});
  const id=crypto.randomUUID(); const invoiceId=crypto.randomUUID();
  await pool.query(`INSERT INTO pos_sales (id, tenant_id, terminal_id, shift_id, invoice_id, total, status) VALUES ($1,$2,$3,$4,$5,$6,'POSTED')`,[id, tenantId, terminalId, shiftId, invoiceId, total]);
  // post through sales invoice chain (stub — real would call sales module)
  return {id, invoiceId};
}
export async function enqueueOffline(tenantId:string, deviceId:string, payload:unknown): Promise<{id:string}>{
  const pool=getPool(); const id=crypto.randomUUID();
  await pool.query(`INSERT INTO pos_offline_queue (id, tenant_id, device_id, payload) VALUES ($1,$2,$3,$4)`,[id, tenantId, deviceId, JSON.stringify(payload)]);
  return {id};
}
export async function syncOffline(tenantId:string, deviceId:string): Promise<{synced:number; rejected:number}>{
  const pool=getPool(); const pending=await pool.query(`SELECT id, payload FROM pos_offline_queue WHERE tenant_id=$1 AND device_id=$2 AND status='PENDING'`,[tenantId, deviceId]);
  let synced=0, rejected=0;
  for(const row of pending.rows as {id:string; payload:unknown}[]){
    try{
      await pool.query(`UPDATE pos_offline_queue SET status='SYNCED', attempts=attempts+1 WHERE id=$1`,[row.id]); synced++;
    }catch{ await pool.query(`UPDATE pos_offline_queue SET status='REJECTED' WHERE id=$1`,[row.id]); rejected++; }
  }
  return {synced, rejected};
}
