import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { LiveGameState } from './types.js';

const GAME_TTL_SECONDS = 3 * 60 * 60;
const TRANSITION_LOCK_SECONDS = 8;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.client = new Redis(
      this.config.get<string>('REDIS_URL', 'redis://localhost:6379'),
      {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
      },
    );
    this.client.on('error', (error: Error) => {
      console.error('[Redis] connection error:', error.message);
    });
  }

  onModuleDestroy() {
    void this.client?.quit();
  }

  private stateKey(sessionId: string) {
    return `live:${sessionId}:state`;
  }

  private transitionKey(sessionId: string) {
    return `live:${sessionId}:transition`;
  }

  async saveGameState(state: LiveGameState) {
    await this.client.set(
      this.stateKey(state.sessionId),
      JSON.stringify(state),
      'EX',
      GAME_TTL_SECONDS,
    );
  }

  async loadGameState(sessionId: string): Promise<LiveGameState | null> {
    const raw = await this.client.get(this.stateKey(sessionId));
    return raw ? (JSON.parse(raw) as LiveGameState) : null;
  }

  async acquireTransition(sessionId: string) {
    const result = await this.client.set(
      this.transitionKey(sessionId),
      String(Date.now()),
      'EX',
      TRANSITION_LOCK_SECONDS,
      'NX',
    );
    return result === 'OK';
  }

  async releaseTransition(sessionId: string) {
    await this.client.del(this.transitionKey(sessionId));
  }

  async deleteGameState(sessionId: string) {
    await this.client.del(
      this.stateKey(sessionId),
      this.transitionKey(sessionId),
    );
  }
}
