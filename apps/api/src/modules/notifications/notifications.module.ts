import { Module } from '@nestjs/common'; import { NotificationsController } from './presentation/notifications.controller.js';
@Module({ controllers: [NotificationsController] }) export class NotificationsModule {}
