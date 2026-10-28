import { Module } from '@nestjs/common'; import { InventoryController } from './presentation/inventory.controller.js';
@Module({ controllers:[InventoryController] }) export class InventoryModule {}
