import { Module } from '@nestjs/common';
import { FiscalController } from './presentation/fiscal.controller.js';
import { JournalsController } from './presentation/journals.controller.js';

@Module({ controllers: [FiscalController, JournalsController] })
export class AccountingModule {}
