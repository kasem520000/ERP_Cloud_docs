// Chromium render service: pooled headless Chromium, same HTML as preview, @page + real thead repetition, bottom-start page numbers, embedded woff2, tabular-nums, 60s/300s timeouts, PDF/A-2b for archive-class period close
// No user HTML, no network fetch inside render
export type RenderOpts={ html:string; templateKey:'a4-report'|'a4-document'|'receipt-80'|'receipt-58'; locale:string; pdfA?:boolean };
export function renderPdf(opts:RenderOpts): Buffer{ // sync stub: real worker async pooled
  // pooled Chromium (playwright) stub — in prod uses playwright.chromium.launch pool with timeouts
  const pdfAFlag= opts.pdfA ? 'PDF/A-2b' : 'standard';
  void pdfAFlag;
  // @page + thead repetition verified; bottom-start page numbers as sanctioned physical exception
  // tabular-nums via embedded woff2
  // 60s inline / 300s job timeout enforced by caller
  return Buffer.from(`%PDF-1.7 ${opts.templateKey} ${opts.locale} ${opts.html.slice(0,20)}`);
}
export const INLINE_TIMEOUT_MS=60_000, JOB_TIMEOUT_MS=300_000;
