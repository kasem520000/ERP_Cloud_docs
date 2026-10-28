import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { logger } from './infra/observability/logger.js';
import { initOtel } from './infra/observability/otel.js';

async function bootstrap(): Promise<void> {
  await initOtel();
  const port = Number(process.env.API_PORT ?? 3001);
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
  });
  app.setGlobalPrefix('');
  app.enableCors({ origin: process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000' });
  await app.listen(port, '0.0.0.0');
  logger.info({ port }, `API listening on http://0.0.0.0:${port}`);
  if (process.env.WORKER_MODE === '1') {
    logger.info('Worker mode enabled (WORKER_MODE=1) — pg-boss will start via JobsService');
  }
}

bootstrap().catch(err => {
  logger.error({ err }, 'Failed to bootstrap API');
  process.exit(1);
});
