import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-streams-adapter';
import Redis from 'ioredis';
import type { Server, ServerOptions } from 'socket.io';

const SOCKET_STREAM_NAME = 'tahaddi:socket.io';

export class RedisIoAdapter extends IoAdapter {
  private readonly redisClient: Redis;

  constructor(app: INestApplicationContext, redisUrl: string) {
    super(app);
    this.redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
    });
    this.redisClient.on('error', (error: Error) => {
      console.error('[Socket.IO Redis] connection error:', error.message);
    });
  }

  async connect() {
    await this.redisClient.connect();
    await this.redisClient.ping();
  }

  override createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, {
      ...options,
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1_000,
        skipMiddlewares: false,
      },
    }) as Server;
    server.adapter(
      createAdapter(this.redisClient, {
        streamName: SOCKET_STREAM_NAME,
        blockTimeInMs: 30_000,
      }),
    );
    return server;
  }

  async disconnect() {
    await this.redisClient.quit();
  }
}
