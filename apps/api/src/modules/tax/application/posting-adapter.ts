import { postJournal } from '../../accounting/application/posting-service.js';
export async function postVatLines(tenantId:string, baseCurrency:string, source:{docType:string; docId:string; operation:string}, entryDate:string, lines:{treatment:string; net:string; tax:string}[]): Promise<{journalId:string}>{
  // FAIL-CLOSED when VAT purposes unmapped: PostingEngine will throw PURPOSE_NOT_MAPPED
  const journalLines:any[]=[];
  for(const l of lines){ if(l.treatment==='STANDARD_RATED'){ journalLines.push({purpose:'VAT_PAYABLE', direction:'credit', amount:l.tax}); } else if(l.treatment==='ZERO_RATED'){ /* zero box, no GL */ } }
  if(journalLines.length===0) return {journalId:''};
  // Minimal demo: post VAT lines against a dummy AR line to balance
  const totalTax=journalLines.reduce((a:any,c:any)=> a + Number(c.amount),0).toFixed(4);
  journalLines.push({purpose:'AR_CONTROL', direction:'debit', amount: totalTax, partnerId:'dummy'});
  const res=await postJournal(tenantId, baseCurrency, {entryDate, currency:baseCurrency, description:`VAT ${source.docId}`, lines: journalLines, source});
  return {journalId: res.id};
}
