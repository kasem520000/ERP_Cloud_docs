import { Controller, Get, Query, Req } from '@nestjs/common';
import { RequirePermissions } from '../../identity/infrastructure/rbac.decorator.js';
import { searchPartners, searchItems } from '../application/search-service.js';

@Controller('api/v1/search')
export class SearchController {
  @Get('partners')
  @RequirePermissions('partners.view')
  async partners(@Req() req: { tenantId: string }, @Query('q') q: string): Promise<unknown> {
    return { items: await searchPartners(req.tenantId, q) };
  }
  @Get('items')
  @RequirePermissions('items.view')
  async items(@Req() req: { tenantId: string }, @Query('q') q: string): Promise<unknown> {
    return { items: await searchItems(req.tenantId, q) };
  }
}
