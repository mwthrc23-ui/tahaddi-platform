import { NestFactory } from '@nestjs/core';
import type { Express, Request, Response } from 'express';
import type { Server as HttpServer } from 'node:http';
import { AppModule } from './app.module';
import { AppService } from './app.service.js';
import { getAllowedWebOrigins } from './config/web-origins.js';
import { RedisIoAdapter } from './redis-io.adapter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appService = app.get(AppService);
  const allowedOrigins = getAllowedWebOrigins();
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  const httpAdapter = app.getHttpAdapter();
  const server = httpAdapter.getInstance() as Express;
  server.get('/health', (_req: Request, res: Response) => {
    res.json(appService.getHealth());
  });
  app.setGlobalPrefix('realtime');
  app.enableShutdownHooks();

  const redisAdapter = new RedisIoAdapter(
    app,
    process.env.REDIS_URL ?? 'redis://localhost:6379',
  );
  await redisAdapter.connect();
  app.useWebSocketAdapter(redisAdapter);

  const httpServer = app.getHttpServer() as HttpServer;
  httpServer.once('close', () => {
    void redisAdapter.disconnect();
  });

  await app.listen(process.env.PORT ?? process.env.REALTIME_PORT ?? 3001);
}
void bootstrap();
