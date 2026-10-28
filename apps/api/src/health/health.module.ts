import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { JobsModule } from '../infra/jobs/jobs.module.js';

@Module({
  imports: [JobsModule],
  controllers: [HealthController],
})
export class HealthModule {}
