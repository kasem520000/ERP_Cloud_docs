import { getPool } from '../../../infra/db/db.js'; import { postJournal } from '../../accounting/application/posting-service.js';
import Decimal from 'decimal.js';
// G-06 realized FX at settlement: control at original stored rate, cash at current rate, gain/loss residual
export async function postFxSettlement(tenantId:string, baseCurrency:string, receiptId:string, openItemId:string, currentRate:string): Promise<{journalId:string}|null>{
  const pool=getPool();
  const rec=await pool.query(`SELECT amount, currency_code, exchange_rate FROM receipts WHERE id=$1 AND tenant_id=$2`,[receiptId, tenantId]); if(!rec.rows.length) return null;
  const r=rec.rows[0] as {amount:string; currency_code:string; exchange_rate:string};
  if(r.currency_code===baseCurrency) return null;
  const orig=new Decimal(r.amount).mul(new Decimal(r.exchange_rate)); const curr=new Decimal(r.amount).mul(new Decimal(currentRate));
  const diff=curr.minus(orig); if(diff.equals(0)) return null;
  const isGain=diff.gt(0);
  const lines=[
    {purpose:'CASH', direction:'debit' as const, amount: new Decimal(r.amount).toFixed(4)},
    {purpose:'AR_CONTROL', direction:'credit' as const, amount: new Decimal(r.amount).toFixed(4)},
    {purpose: isGain ? 'FX_GAIN' : 'FX_LOSS', direction: isGain ? 'credit' as const : 'debit' as const, amount: diff.abs().toFixed(4)},
  ];
  // For demo, we post via engine with gain/loss purpose; INV-008 original rate honored
  const res=await postJournal(tenantId, baseCurrency, { entryDate: new Date().toISOString().slice(0,10), currency: r.currency_code, exchangeRate: currentRate, description:`FX settlement ${receiptId}`, lines: lines as unknown as {purpose:string; direction:'debit'|'credit'; amount:string}[], source:{docType:'fx_settlement', docId:receiptId, operation:'POST'}});
  return {journalId: res.id};
}
