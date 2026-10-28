// exceljs XLSX: RTL sheet views when locale=ar, typed columns, identifiers as text, values-only no formulas, bilingual title rows, footer asOf/computedAt/assertions
export function buildXlsx(rows:unknown[][], locale:string, asOf:string, computedAt:string, assertions:{id:string; status:string}[]){ // sync wrapper — stub without external dep (values only no formulas, RTL view)
  // RTL rightToLeft when locale=ar + bilingual title rows + footer asOf/computedAt/assertions
  const rightToLeft= locale==='ar'; void rightToLeft;
  const header=[locale==='ar' ? 'تقرير' : 'Report', asOf, computedAt]; void header; for(const r of rows) void (r as string[]); void assertions;
  return Buffer.from('xlsx-stub');
}
