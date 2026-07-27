import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { LiveGameState } from './types.js';

const GAME_TTL_SECONDS = 3 * 60 * 60;
const TRANSITION_LOCK_SECONDS = 8;
const SPECIAL_ROOM_LOCK_MILLISECONDS = 10_000;

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
  private specialRoomKey(pin: string) {
    return `special-game:${pin}:room`;
  }
  private specialRoomLockKey(pin: string) {
    return `special-game:${pin}:lock`;
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

  // ── Special game rooms ───────────────────────────────────────────────────

  async saveSpecialRoom<T>(pin: string, room: T): Promise<void> {
    await this.client.set(
      this.specialRoomKey(pin),
      JSON.stringify(room),
      'EX',
      GAME_TTL_SECONDS,
    );
  }

  async loadSpecialRoom<T>(pin: string): Promise<T | null> {
    const raw = await this.client.get(this.specialRoomKey(pin));
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async deleteSpecialRoom(pin: string): Promise<void> {
    await this.client.del(this.specialRoomKey(pin));
  }

  async acquireSpecialRoomLock(pin: string, token: string): Promise<boolean> {
    const result = await this.client.set(
      this.specialRoomLockKey(pin),
      token,
      'PX',
      SPECIAL_ROOM_LOCK_MILLISECONDS,
      'NX',
    );
    return result === 'OK';
  }

  async releaseSpecialRoomLock(pin: string, token: string): Promise<void> {
    await this.client.eval(
      `
        if redis.call("GET", KEYS[1]) == ARGV[1] then
          return redis.call("DEL", KEYS[1])
        end
        return 0
      `,
      1,
      this.specialRoomLockKey(pin),
      token,
    );
  }

  async addActivePin(pin: string): Promise<void> {
    await this.client.sadd('special-game:pins:active', pin);
    await this.client.expire('special-game:pins:active', GAME_TTL_SECONDS);
  }

  async removeActivePin(pin: string): Promise<void> {
    await this.client.srem('special-game:pins:active', pin);
  }

  async isPinActive(pin: string): Promise<boolean> {
    return (await this.client.sismember('special-game:pins:active', pin)) === 1;
  }
}
