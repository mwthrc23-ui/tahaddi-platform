import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  isSpecialGameMode,
  PARALLEL_WORLD_BANK,
  REVERSE_TIME_BANK,
  type SpecialGameMode,
} from '@tahaddi/domain';
import type { Server, Socket } from 'socket.io';
import {
  allowWebSocketOrigin,
  allowWebSocketRequest,
} from '../config/web-origins.js';
import { SocketEventRateLimiter } from './socket-event-rate-limiter.js';
import { SpecialGamesService } from './special-games.service.js';
import type {
  ClientToServerSpecialEvents,
  ServerToClientSpecialEvents,
} from './types.js';

type SpecialSocket = Socket<
  ClientToServerSpecialEvents,
  ServerToClientSpecialEvents
>;
type SpecialServer = Server<
  ClientToServerSpecialEvents,
  ServerToClientSpecialEvents
>;

const getRoundCount = (mode: SpecialGameMode) =>
  mode === 'parallel-world' || mode === 'infiltrator'
    ? PARALLEL_WORLD_BANK.length
    : REVERSE_TIME_BANK.length;

@WebSocketGateway({
  cors: { origin: allowWebSocketOrigin, credentials: true },
  allowRequest: allowWebSocketRequest,
  namespace: '/special-games',
})
export class SpecialGamesGateway
  implements OnGatewayInit<SpecialServer>, OnGatewayDisconnect<SpecialSocket>
{
  @WebSocketServer()
  server!: SpecialServer;

  private readonly socketRooms = new Map<string, string>();
  private readonly rateLimiter = new SocketEventRateLimiter();

  constructor(private readonly games: SpecialGamesService) {}

  afterInit(server: SpecialServer) {
    this.games.setServer(server);
  }

  async handleDisconnect(client: SpecialSocket) {
    this.rateLimiter.clearSocket(client.id);
    const pin = this.socketRooms.get(client.id);
    if (!pin) return;
    this.socketRooms.delete(client.id);
    await this.games.executeWithRoomLock(pin, () =>
      this.games.playerLeft(client.id, pin),
    );
  }

  private emitError(
    client: SpecialSocket,
    result: { ok: false; code: string; message: string },
  ) {
    client.emit('special:error', {
      code: result.code,
      message: result.message,
    });
  }

  private async runLocked<T>(
    client: SpecialSocket,
    pin: string,
    action: () => Promise<T>,
  ): Promise<T | null> {
    const locked = await this.games.executeWithRoomLock(pin, action);
    if (!locked.acquired) {
      client.emit('special:error', {
        code: 'ROOM_BUSY',
        message: 'الغرفة تستقبل إجابات متزامنة. أعد المحاولة بعد لحظة.',
      });
      return null;
    }
    return locked.value;
  }

  private canCreateRoom(client: SpecialSocket) {
    const socketAllowed = this.rateLimiter.consume(
      `socket:${client.id}:room-create`,
      3,
      60_000,
    );
    if (!socketAllowed) return false;

    const address = client.handshake.address?.trim();
    return address
      ? this.rateLimiter.consume(`address:${address}:room-create`, 30, 60_000)
      : true;
  }

  @SubscribeMessage('special:room:create')
  async createRoom(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { mode?: string },
  ) {
    if (!this.canCreateRoom(client)) {
      client.emit('special:error', {
        code: 'RATE_LIMITED',
        message:
          'تم إنشاء غرف كثيرة خلال وقت قصير. انتظر دقيقة ثم حاول مجددًا.',
      });
      return;
    }
    if (!payload?.mode || !isSpecialGameMode(payload.mode)) {
      client.emit('special:error', {
        code: 'INVALID_MODE',
        message: 'اختر لعبة صالحة قبل إنشاء الغرفة.',
      });
      return;
    }
    const room = await this.games.createRoom(client.id, payload.mode);
    await client.join(room.pin);
    this.socketRooms.set(client.id, room.pin);
    client.emit('special:room:state', {
      pin: room.pin,
      hostId: room.hostId,
      mode: room.mode,
      phase: room.phase,
      roundIndex: room.roundIndex,
      roundCount: getRoundCount(room.mode),
      players: room.players,
      readyPlayerIds: room.readyPlayerIds ?? [],
    });
  }

  @SubscribeMessage('special:room:join')
  async joinRoom(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { pin?: string; playerName?: string },
  ) {
    if (!payload?.pin || !payload?.playerName) {
      client.emit('special:error', {
        code: 'INVALID_JOIN',
        message: 'أدخل رمز الغرفة واسم اللاعب.',
      });
      return;
    }
    const result = await this.runLocked(client, payload.pin, () =>
      this.games.joinRoom(client.id, payload.pin!, payload.playerName!),
    );
    if (!result) return;
    if (!result.ok) {
      this.emitError(client, result);
      return;
    }
    await client.join(result.room.pin);
    this.socketRooms.set(client.id, result.room.pin);
    this.server.to(result.room.pin).emit('special:room:state', {
      pin: result.room.pin,
      hostId: result.room.hostId,
      mode: result.room.mode,
      phase: result.room.phase,
      roundIndex: result.room.roundIndex,
      roundCount: getRoundCount(result.room.mode),
      players: [...result.room.players].sort((a, b) => b.score - a.score),
      readyPlayerIds: result.room.readyPlayerIds ?? [],
    });
  }

  @SubscribeMessage('special:room:leave')
  async leaveRoom(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { pin?: string },
  ) {
    if (!payload?.pin) return;
    const pin = payload.pin;
    const result = await this.runLocked(client, pin, () =>
      this.games.leaveRoom(client.id, pin),
    );
    if (!result) return;
    if (!result.ok) {
      await client.leave(pin);
      this.socketRooms.delete(client.id);
      this.emitError(client, result);
      return;
    }
    await client.leave(pin);
    this.socketRooms.delete(client.id);
    this.server.to(pin).emit('special:room:state', {
      pin: result.room.pin,
      hostId: result.room.hostId,
      mode: result.room.mode,
      phase: result.room.phase,
      roundIndex: result.room.roundIndex,
      roundCount: getRoundCount(result.room.mode),
      players: result.room.players,
      readyPlayerIds: result.room.readyPlayerIds ?? [],
    });
  }

  @SubscribeMessage('special:player:ready')
  async playerReady(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { pin?: string },
  ) {
    if (!payload?.pin) return;
    const result = await this.runLocked(client, payload.pin, () =>
      this.games.playerReady(client.id, payload.pin!),
    );
    if (!result) return;
    if (!result.ok) {
      this.emitError(client, result);
      return;
    }
    this.server.to(result.room.pin).emit('special:room:state', {
      pin: result.room.pin,
      hostId: result.room.hostId,
      mode: result.room.mode,
      phase: result.room.phase,
      roundIndex: result.room.roundIndex,
      roundCount: getRoundCount(result.room.mode),
      players: result.room.players,
      readyPlayerIds: result.room.readyPlayerIds ?? [],
    });
  }

  @SubscribeMessage('special:game:start')
  async startGame(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { pin?: string },
  ) {
    if (!payload?.pin) return;
    const result = await this.runLocked(client, payload.pin, () =>
      this.games.startGame(payload.pin!, client.id),
    );
    if (!result) return;
    if (!result.ok) this.emitError(client, result);
  }

  @SubscribeMessage('special:round:next')
  async nextRound(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { pin?: string },
  ) {
    if (!payload?.pin) return;
    const result = await this.runLocked(client, payload.pin, () =>
      this.games.nextRound(payload.pin!, client.id),
    );
    if (!result) return;
    if (!result.ok) this.emitError(client, result);
  }

  @SubscribeMessage('parallel:answer:submit')
  async submitParallel(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { pin?: string; roundId?: string; answer?: string },
  ) {
    if (!payload?.pin || !payload.roundId || !payload.answer) return;
    const result = await this.runLocked(client, payload.pin, () =>
      this.games.submitParallelAnswer(
        client.id,
        payload.pin!,
        payload.roundId!,
        payload.answer!,
      ),
    );
    if (!result) return;
    if (!result.ok) this.emitError(client, result);
  }

  @SubscribeMessage('parallel:reveal')
  async revealParallel(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { pin?: string },
  ) {
    if (!payload?.pin) return;
    const result = await this.runLocked(client, payload.pin, () =>
      this.games.revealParallel(payload.pin!, client.id),
    );
    if (!result) return;
    if (!result.ok) this.emitError(client, result);
  }

  @SubscribeMessage('reverse:question:submit')
  async submitReverse(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody()
    payload: { pin?: string; roundId?: string; question?: string },
  ) {
    if (!payload?.pin || !payload.roundId || !payload.question) return;
    const result = await this.runLocked(client, payload.pin, () =>
      this.games.submitReverseQuestion(
        client.id,
        payload.pin!,
        payload.roundId!,
        payload.question!,
      ),
    );
    if (!result) return;
    if (!result.ok) this.emitError(client, result);
  }

  @SubscribeMessage('reverse:voting:start')
  async startVoting(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { pin?: string },
  ) {
    if (!payload?.pin) return;
    const result = await this.runLocked(client, payload.pin, () =>
      this.games.startReverseVoting(payload.pin!, client.id),
    );
    if (!result) return;
    if (!result.ok) this.emitError(client, result);
  }

  @SubscribeMessage('reverse:vote')
  async vote(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { pin?: string; submissionId?: string },
  ) {
    if (!payload?.pin || !payload.submissionId) return;
    const result = await this.runLocked(client, payload.pin, () =>
      this.games.voteReverse(client.id, payload.pin!, payload.submissionId!),
    );
    if (!result) return;
    if (!result.ok) this.emitError(client, result);
  }

  @SubscribeMessage('reverse:reveal')
  async revealReverse(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { pin?: string },
  ) {
    if (!payload?.pin) return;
    const result = await this.runLocked(client, payload.pin, () =>
      this.games.revealReverse(payload.pin!, client.id),
    );
    if (!result) return;
    if (!result.ok) this.emitError(client, result);
  }

  @SubscribeMessage('infiltrator:answer:submit')
  async submitInfiltratorAnswer(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { pin?: string; roundId?: string; answer?: string },
  ) {
    if (!payload?.pin || !payload.roundId || !payload.answer) return;
    const result = await this.runLocked(client, payload.pin, () =>
      this.games.submitInfiltratorAnswer(
        client.id,
        payload.pin!,
        payload.roundId!,
        payload.answer!,
      ),
    );
    if (!result) return;
    if (!result.ok) this.emitError(client, result);
  }

  @SubscribeMessage('infiltrator:voting:start')
  async startInfiltratorVoting(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { pin?: string },
  ) {
    if (!payload?.pin) return;
    const result = await this.runLocked(client, payload.pin, () =>
      this.games.startInfiltratorVoting(payload.pin!, client.id),
    );
    if (!result) return;
    if (!result.ok) this.emitError(client, result);
  }

  @SubscribeMessage('infiltrator:vote')
  async voteInfiltrator(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { pin?: string; playerId?: string },
  ) {
    if (!payload?.pin || !payload.playerId) return;
    const result = await this.runLocked(client, payload.pin, () =>
      this.games.voteInfiltrator(client.id, payload.pin!, payload.playerId!),
    );
    if (!result) return;
    if (!result.ok) this.emitError(client, result);
  }

  @SubscribeMessage('infiltrator:majority:guess')
  async guessInfiltratorMajority(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { pin?: string; question?: string },
  ) {
    if (!payload?.pin || !payload.question) return;
    const result = await this.runLocked(client, payload.pin, () =>
      this.games.guessInfiltratorMajority(
        client.id,
        payload.pin!,
        payload.question!,
      ),
    );
    if (!result) return;
    if (!result.ok) this.emitError(client, result);
  }

  @SubscribeMessage('infiltrator:reveal')
  async revealInfiltrator(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { pin?: string },
  ) {
    if (!payload?.pin) return;
    const result = await this.runLocked(client, payload.pin, () =>
      this.games.revealInfiltrator(payload.pin!, client.id),
    );
    if (!result) return;
    if (!result.ok) this.emitError(client, result);
  }
}
