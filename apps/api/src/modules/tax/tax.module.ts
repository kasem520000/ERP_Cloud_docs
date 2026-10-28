import { Module } from '@nestjs/common'; import { TaxController } from './presentation/tax.controller.js';
@Module({ controllers:[TaxController] }) export class TaxModule {}
