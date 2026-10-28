import { Module } from '@nestjs/common'; import { TreasuryController } from './presentation/treasury.controller.js';
@Module({ controllers:[TreasuryController] }) export class TreasuryModule {}
