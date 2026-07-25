import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { validateEnvironment } from './config/environment.js';
import { GameModule } from './game/game.module.js';
import { SpecialGamesModule } from './special-games/special-games.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '../../.env'],
      isGlobal: true,
      validate: validateEnvironment,
    }),
    GameModule,
    SpecialGamesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
