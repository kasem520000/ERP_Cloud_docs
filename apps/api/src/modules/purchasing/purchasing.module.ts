import { Module } from '@nestjs/common'; import { PurchasingController } from './presentation/purchasing.controller.js';
@Module({ controllers:[PurchasingController] }) export class PurchasingModule {}
