export type ParsedLine={ valueDate:string; amount:string; reference?:string; description?:string };
export function parseGenericCsv(csv:string, mapping:{ date:string; amount:string; ref?:string; desc?:string }): ParsedLine[]{
  const rows=csv.trim().split('\n').map(r=> r.split(',').map(c=> c.trim().replace(/^"|"$/g,'')));
  const header=rows[0]!; const idx=(col:string)=> header.findIndex(h=> h.toLowerCase().includes(col.toLowerCase()));
  const di=idx(mapping.date), ai=idx(mapping.amount), ri=mapping.ref?idx(mapping.ref):-1, deci=mapping.desc?idx(mapping.desc):-1;
  return rows.slice(1).filter(r=> r.length>di && r.length>ai).map(r=>({ valueDate:r[di]!, amount:r[ai]!, reference: ri>=0? r[ri]:undefined, description: deci>=0? r[deci]:undefined })).slice(0,5000);
}
export function parseArabicHeaders(csv:string): ParsedLine[]{
  // Arabic headers: التاريخ, المبلغ, المرجع
  return parseGenericCsv(csv, {date:'التاريخ', amount:'المبلغ', ref:'المرجع', desc:'الوصف'});
}
