import { Module } from '@nestjs/common';
import { AuthController } from './presentation/auth.controller.js';

@Module({
  controllers: [AuthController],
})
export class IdentityModule {}
