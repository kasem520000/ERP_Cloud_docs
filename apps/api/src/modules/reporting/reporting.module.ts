import { Module } from '@nestjs/common'; import { ReportingController } from './presentation/reporting.controller.js';
@Module({ controllers:[ReportingController] }) export class ReportingModule {}
