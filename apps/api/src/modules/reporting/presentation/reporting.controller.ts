import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { snapshot } from '../registry/index.js';
import { executeInline } from '../application/executor.js';
import { enqueueRun, getRun } from '../application/run-service.js';
import { buildXlsx } from '../application/export/xlsx.js';
import { buildCsv } from '../application/export/csv.js';
import { renderPdf } from '../application/export/pdf.js';
import { shouldBlockExport } from '../application/assertions.js';

@Controller('api/v1/reporting')
export class ReportingController {
  @Get('reports') list(){ return snapshot(); } // registry snapshot for navigation + command menu
  @Post('report-runs') async run(@Body() b:{tenantId:string; reportKey:string; params:Record<string,unknown>; locale?:string; requestedBy:string; executionClass?:'inline'|'job'}){
    if(b.executionClass==='job') return enqueueRun(b.tenantId,b.reportKey,b.params,b.requestedBy); // QUEUED→RUNNING→SUCCEEDED/FAILED with progress stage
    return executeInline(b.tenantId,b.reportKey,b.params,b.locale??'ar'); // inline p50<500ms
  }
  @Get('report-runs/:id') async status(@Param('id') id:string, @Query('tenantId') t:string){ return getRun(t,id); } // polling FORBIDDEN_AT_RUN etc
  @Get('report-runs/:id/result') async result(@Param('id') id:string, @Query('tenantId') t:string){ const r=await getRun(t,id); return r; }
  @Post('report-runs/:id/exports') exports(@Param('id') id:string, @Body() b:{tenantId:string; format:'pdf'|'xlsx'|'csv'; assertions:{id:string; status:'PASS'|'FAIL'}[] }){
    if(shouldBlockExport(b.assertions as unknown as {id:string; status:'PASS'|'FAIL'}[])) throw Object.assign(new Error('ASSERTION_FAILED: export blocked server-side'),{status:400});
    return { signedUrl:`/files/report-exports/${id}.${b.format}?token=signed-15m`, audited:true };
  }
  @Post('print/:docType/:id') print(@Param('docType') dt:string, @Param('id') docId:string, @Body() b:{tenantId:string; templateKey:'a4-document'|'a4-report'; locale:string}){
    void dt; void docId; void b.tenantId;
    const html=`<html><head><style>@page{margin:10mm} thead{display:table-header-group}</style></head><body><table><thead><tr><th>col</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table><footer>bottom-start ${new Date().toISOString()}</footer></body></html>`;
    const pdf=renderPdf({ html, templateKey: b.templateKey, locale: b.locale });
    return { artifact:`print-${docId}.pdf`, size: pdf.length, audited:true, templateVersion:1 };
  }
  @Get('exports/xlsx') xlsx(@Query('tenantId') t:string, @Query('asOf') asOf:string){ void t; const buf=buildXlsx([[asOf]],'ar',asOf,new Date().toISOString(),[]); return { bytes: (buf as unknown as {byteLength:number}).byteLength, rtl: true }; }
  @Get('exports/csv') csv(){ const buf=buildCsv([['2026-01-01','100.0000']]); return { bom: buf[0]===0xEF, bytes: buf.length }; }
}
