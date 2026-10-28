import { Controller, Get, Patch, Param, Query, Body } from '@nestjs/common';
import { listNotifications, markRead, unreadCount } from '../application/notifications-service.js';
@Controller('api/v1/notifications')
export class NotificationsController {
  @Get() async list(@Query('tenantId') tenantId:string, @Query('userId') userId?:string){ return listNotifications(tenantId, userId); }
  @Get('unread-count') async unread(@Query('tenantId') tenantId:string, @Query('userId') userId?:string){ const c=await unreadCount(tenantId, userId); return {unread:c}; }
  @Patch(':id/read') async read(@Param('id') id:string, @Body() b:{tenantId:string}){ return markRead(b.tenantId, id); }
}
