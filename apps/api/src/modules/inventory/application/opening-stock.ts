import crypto from 'node:crypto';
import { receiveStock } from './movement-service.js';
import { postJournal } from '../../accounting/application/posting-service.js';
export async function postOpeningStock(tenantId:string, warehouseId:string, lines:{ itemId:string; qty:string; unitCost:string }[], valueDate:string): Promise<{journalId:string}>{
  let total='0.0000'; for(const l of lines){ const v=(Number(l.qty)*Number(l.unitCost)).toFixed(4); total=(Number(total)+Number(v)).toFixed(4); await receiveStock(tenantId,{ itemId:l.itemId, warehouseId, qty:l.qty, unitCost:l.unitCost, sourceType:'opening_balance', sourceId: crypto.randomUUID() }); }
  const res=await postJournal(tenantId,'SAR',{ entryDate: valueDate, currency:'SAR', description:'Opening stock', lines:[{purpose:'INVENTORY', direction:'debit', amount: total},{purpose:'OPENING_EQUITY', direction:'credit', amount: total}], source:{docType:'opening_stock', docId: crypto.randomUUID(), operation:'POST'}} as unknown as {entryDate:string; currency:string; description:string; lines:{purpose:string; direction:'debit'|'credit'; amount:string}[]; source:{docType:string; docId:string; operation:string}});
  return {journalId: res.id};
}
