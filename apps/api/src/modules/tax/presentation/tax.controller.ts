import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { createTaxCode, listTaxCodes } from '../application/codes-service.js';
import { upsertRegistration, migrateFromSettings } from '../application/registration-service.js';
import { prepareVatReturn, markFiled } from '../application/vat-return-service.js';
import { FakeAdapter } from '../domain/einvoicing/adapter-port.js';
import { resolveLine } from '../domain/resolver/resolver.js';
@Controller('api/v1/tax')
export class TaxController {
  @Post('tax-codes') async create(@Body() b:{tenantId:string; code:string; name:string; jurisdictionCode:string; treatment:string; rate:string}){ return createTaxCode(b.tenantId,b); }
  @Get('tax-codes') async list(@Query('tenantId') t:string){ return listTaxCodes(t); }
  @Post('registrations') async reg(@Body() b:{tenantId:string; jurisdictionCode:string; status:'REGISTERED'|'NOT_REGISTERED'|'DEREGISTERED'; registrationNo?:string}){ return upsertRegistration(b.tenantId,b); }
  @Post('registrations/migrate') async mig(@Body() b:{tenantId:string}){ await migrateFromSettings(b.tenantId); return {ok:true}; }
  @Post('resolve-lines') resolve(@Body() b:{amount:string; taxCode:{treatment:string; rate:string; jurisdiction:string; packVersion:string; sourceRef:string}; minorUnits:number; registrationStatus:'REGISTERED'|'NOT_REGISTERED'|'NO_VAT'}){ return resolveLine({amount:b.amount, taxCode:b.taxCode, minorUnits:b.minorUnits, registrationStatus:b.registrationStatus}); }
  @Get('vat-returns/prepare') async prep(@Query('tenantId') t:string, @Query('from') f:string, @Query('to') to:string, @Query('jurisdiction') j:string){ return prepareVatReturn(t,f,to,j); }
  @Post('vat-returns/:id/mark-filed') async filed(@Param('id') id:string, @Body() b:{tenantId:string; filedBy:string}){ await markFiled(b.tenantId,id,b.filedBy); return {ok:true}; }
  @Post('einvoicing/fake-generate') async fake(@Body() b:{docId:string}){ const a=new FakeAdapter(); return a.generate(b.docId); }
}
