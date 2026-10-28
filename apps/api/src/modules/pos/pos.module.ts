import { Module } from '@nestjs/common'; import { PosController } from './presentation/pos.controller.js';
@Module({ controllers: [PosController] }) export class PosModule {}
