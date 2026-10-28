import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const port = Number(process.env.API_PORT ?? 3001);
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
  app.setGlobalPrefix('');
  app.enableCors({ origin: process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000' });
  await app.listen(port, '0.0.0.0');
  console.log(`API listening on http://0.0.0.0:${port} — GET /health/live`);
}

bootstrap().catch(err => {
  console.error('Failed to bootstrap API', err);
  process.exit(1);
});
