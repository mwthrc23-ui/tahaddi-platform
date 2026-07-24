import { NestFactory } from '@nestjs/core';
import type { Server as HttpServer } from 'node:http';
import { AppModule } from './app.module';
import { getAllowedWebOrigins } from './config/web-origins.js';
import { RedisIoAdapter } from './redis-io.adapter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = getAllowedWebOrigins();
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
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
