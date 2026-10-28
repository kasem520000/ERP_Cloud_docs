import { Module } from '@nestjs/common'; import { SalesController } from './presentation/sales.controller.js';
@Module({ controllers:[SalesController] }) export class SalesModule {}
