import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway.js';
import { GameService } from './game.service.js';
import { RedisService } from './redis.service.js';

@Module({
  providers: [GameGateway, GameService, RedisService],
  exports: [RedisService],
})
export class GameModule {}
