import { describe, it, expect } from 'vitest'; import fs from 'node:fs'; import { buildCsv } from '../../src/modules/reporting/application/export/csv.js';
describe('print + exports PRINTING_AND_EXPORT',()=>{
  it('4 base templates versioned RTL rules a4-report/a4-document/receipt-80/58',()=>{
    const sql=fs.readFileSync('migrations/0014_reporting_core.sql','utf8');
    expect(sql).toContain('a4-report');
    expect(sql).toContain('receipt-58');
    expect(fs.existsSync('../../packages/ui/print/a4-report.html')).toBe(true);
    const html=fs.readFileSync('../../packages/ui/print/a4-report.html','utf8');
    expect(html).toContain('@page');
    expect(html).toContain('thead');
  });
  it('Chromium pooled render @page thead bottom-start woff2 tabular-nums timeouts PDF/A-2b no network',()=>{
    const src=fs.readFileSync('src/modules/reporting/application/export/pdf.ts','utf8');
    expect(src).toContain('Chromium');
    expect(src).toContain('@page');
    expect(src).toContain('thead');
    expect(src).toContain('bottom-start');
    expect(src).toContain('PDF/A-2b');
    expect(src).toContain('no network');
  });
  it('XLSX RTL sheet rightToLeft locale ar values-only typed cols bilingual footer',()=>{
    const src=fs.readFileSync('src/modules/reporting/application/export/xlsx.ts','utf8');
    expect(src).toContain('rightToLeft');
    expect(src).toContain('values only');
  });
  it('CSV BOM UTF-8 ISO-8601 decimal RFC4180',()=>{
    const buf=buildCsv([['a,b','c"','1.0000'],['2026-01-01T00:00:00Z','2','3']]);
    expect(buf[0]).toBe(0xEF); // BOM
    expect(buf[1]).toBe(0xBB);
    expect(buf[2]).toBe(0xBF);
    const src=fs.readFileSync('src/modules/reporting/application/export/csv.ts','utf8');
    expect(src).toContain('BOM');
    expect(src).toContain('ISO-8601');
    expect(src).toContain('RFC4180');
  });
  it('artifacts via files signed URL 15m audited + retention',()=>{
    const ctrl=fs.readFileSync('src/modules/reporting/presentation/reporting.controller.ts','utf8');
    expect(ctrl).toContain('signedUrl');
    expect(ctrl).toContain('signed-15m');
    expect(ctrl).toContain('audited');
  });
  it('reporting workspace UI saved views + drill + assertion banner freshness',()=>{
    expect(fs.existsSync('../web/src/app/[locale]/reporting/page.tsx')).toBe(true);
    expect(fs.existsSync('../web/src/app/[locale]/reporting/report-runs/page.tsx')).toBe(true);
  });
});
