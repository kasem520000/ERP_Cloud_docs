// CSV: UTF-8 BOM, ISO-8601 dates, decimal strings, RFC4180 quoting
export function buildCsv(rows:string[][]): Buffer{
  const bom=Buffer.from([0xEF,0xBB,0xBF]);
  const escape=(v:string)=> { if(v.includes(',')||v.includes('"')||v.includes('\n')) return `"${v.replace(/"/g,'""')}"`; return v; };
  const lines=rows.map(r=> r.map(escape).join(',')).join('\n');
  return Buffer.concat([bom, Buffer.from(lines,'utf8')]);
}
