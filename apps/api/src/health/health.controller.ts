import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get('live')
  live(): { status: string; build: { version: string; timestamp: string } } {
    return {
      status: 'ok',
      build: {
        version: '0.1.0-phase-001',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
