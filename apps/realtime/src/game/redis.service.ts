import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { GameSession, PlayerState } from './types.js';

const GAME_TTL_SECONDS = 3 * 60 * 60; // 3 hours

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
    this.client.on('error', (err: Error) => {
      console.error('[Redis] connection error:', err.message);
    });
  }

  onModuleDestroy() {
    void this.client.quit();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private sessionKey(pin: string) {
    return `game:${pin}:session`;
  }
  private playersKey(pin: string) {
    return `game:${pin}:players`;
  }
  private answersKey(pin: string, questionId: string) {
    return `game:${pin}:answers:${questionId}`;
  }

  // ── Session ────────────────────────────────────────────────────────────────

  async saveSession(session: GameSession): Promise<void> {
    await this.client.set(
      this.sessionKey(session.pin),
      JSON.stringify(session),
      'EX',
      GAME_TTL_SECONDS,
    );
  }

  async loadSession(pin: string): Promise<GameSession | null> {
    const raw = await this.client.get(this.sessionKey(pin));
    return raw ? (JSON.parse(raw) as GameSession) : null;
  }

  async deleteSession(pin: string): Promise<void> {
    await this.client.del(this.sessionKey(pin));
  }

  // ── Players ────────────────────────────────────────────────────────────────

  async savePlayers(
    pin: string,
    players: Map<string, PlayerState>,
  ): Promise<void> {
    const obj: Record<string, PlayerState> = {};
    for (const [id, p] of players) obj[id] = p;
    await this.client.set(
      this.playersKey(pin),
      JSON.stringify(obj),
      'EX',
      GAME_TTL_SECONDS,
    );
  }

  async loadPlayers(pin: string): Promise<Map<string, PlayerState>> {
    const raw = await this.client.get(this.playersKey(pin));
    if (!raw) return new Map();
    const obj = JSON.parse(raw) as Record<string, PlayerState>;
    return new Map(Object.entries(obj));
  }

  async deletePlayers(pin: string): Promise<void> {
    await this.client.del(this.playersKey(pin));
  }

  // ── Answers ────────────────────────────────────────────────────────────────

  async recordAnswer(
    pin: string,
    questionId: string,
    playerId: string,
    optionId: string,
    serverTs: number,
  ): Promise<void> {
    const key = this.answersKey(pin, questionId);
    await this.client.hset(
      key,
      playerId,
      JSON.stringify({ optionId, serverTs }),
    );
    await this.client.expire(key, GAME_TTL_SECONDS);
  }

  async loadAnswers(
    pin: string,
    questionId: string,
  ): Promise<Map<string, { optionId: string; serverTs: number }>> {
    const raw = await this.client.hgetall(this.answersKey(pin, questionId));
    const result = new Map<string, { optionId: string; serverTs: number }>();
    for (const [playerId, json] of Object.entries(raw)) {
      result.set(
        playerId,
        JSON.parse(json) as { optionId: string; serverTs: number },
      );
    }
    return result;
  }

  // ── Active PIN set ─────────────────────────────────────────────────────────

  async addActivePin(pin: string): Promise<void> {
    await this.client.sadd('pins:active', pin);
    await this.client.expire('pins:active', GAME_TTL_SECONDS);
  }

  async removeActivePin(pin: string): Promise<void> {
    await this.client.srem('pins:active', pin);
  }

  async isPinActive(pin: string): Promise<boolean> {
    return (await this.client.sismember('pins:active', pin)) === 1;
  }
}
