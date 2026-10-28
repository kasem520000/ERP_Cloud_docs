import { Controller, Post, Body, Param, Req, Headers } from '@nestjs/common';
import { RequirePermissions } from '../../identity/infrastructure/rbac.decorator.js';
import { dryRunPreview, commitImport } from '../application/import-service.js';

@Controller('api/v1/items/import-jobs')
export class ImportJobsController {
  @Post('preview')
  @RequirePermissions('items.import.run')
  async preview(@Req() req: { tenantId: string }, @Body() body: { entity: string; rows: Record<string, string>[]; fileSize?: number }): Promise<unknown> {
    return dryRunPreview(req.tenantId, body.entity as never, body.rows, body.fileSize);
  }
  @Post(':token/commit')
  @RequirePermissions('items.import.run')
  async commit(@Req() req: { tenantId: string }, @Param('token') token: string, @Headers('idempotency-key') _ik?: string): Promise<unknown> {
    return commitImport(req.tenantId, token);
  }
}
