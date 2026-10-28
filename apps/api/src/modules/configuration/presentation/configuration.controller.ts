import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { resolveEffectiveConfig } from '../domain/resolution.js';
import { getCached, setCached, invalidate } from '../application/cache.js';
import { applyTemplate, switchTemplate, previewSwitch, resolveTemplate } from '../application/apply-service.js';
@Controller('api/v1/configuration')
export class ConfigurationController {
  @Get('effective-config') async effective(@Query('tenantId') tenantId:string, @Query('branchId') branchId?:string){
    // demo: L5 tenant settings + L1 template defaults
    const layers=[{key:'L1' as const, data:{'sales.cash_autopost':true}}, {key:'L5' as const, data:{}}];
    const cfg=resolveEffectiveConfig(layers);
    const cached=getCached(tenantId, cfg.resolved_hash); if(cached) return cached;
    setCached(tenantId, cfg.resolved_hash, cfg); return cfg;
  }
  @Post('templates/:key/apply') async apply(@Param('key') key:string, @Body() b:{tenantId:string; actorId:string; activity?:string}){ const k=b.activity? resolveTemplate(b.activity): key; return applyTemplate(b.tenantId, k, b.actorId); }
  @Post('templates/switch') async sw(@Body() b:{tenantId:string; fromKey:string; toKey:string; actorId:string}){ return switchTemplate(b.tenantId, b.fromKey, b.toKey, b.actorId); }
  @Post('templates/preview') async prev(@Body() b:{tenantId:string; fromKey:string; toKey:string}){ return previewSwitch(b.tenantId, b.fromKey, b.toKey); }
  @Post('invalidate') async inv(@Body() b:{event:string; tenantId:string}){ invalidate(b.event, b.tenantId); return {ok:true}; }
}
