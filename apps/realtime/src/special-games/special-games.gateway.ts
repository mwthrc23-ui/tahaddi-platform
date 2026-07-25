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
} from '@tahaddi/domain';
import type { Server, Socket } from 'socket.io';
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

const getRoundCount = (mode: 'parallel-world' | 'reverse-time') =>
  mode === 'parallel-world'
    ? PARALLEL_WORLD_BANK.length
    : REVERSE_TIME_BANK.length;

@WebSocketGateway({
  cors: { origin: '*', credentials: false },
  namespace: '/special-games',
})
export class SpecialGamesGateway
  implements OnGatewayInit<SpecialServer>, OnGatewayDisconnect<SpecialSocket>
{
  @WebSocketServer()
  server!: SpecialServer;

  private readonly socketRooms = new Map<string, string>();

  constructor(private readonly games: SpecialGamesService) {}

  afterInit(server: SpecialServer) {
    this.games.setServer(server);
  }

  async handleDisconnect(client: SpecialSocket) {
    const pin = this.socketRooms.get(client.id);
    if (!pin) return;
    this.socketRooms.delete(client.id);
    await this.games.playerLeft(client.id, pin);
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

  @SubscribeMessage('special:room:create')
  async createRoom(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { mode?: string },
  ) {
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
    const result = await this.games.joinRoom(
      client.id,
      payload.pin,
      payload.playerName,
    );
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
    });
  }

  @SubscribeMessage('special:game:start')
  async startGame(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { pin?: string },
  ) {
    if (!payload?.pin) return;
    const result = await this.games.startGame(payload.pin, client.id);
    if (!result.ok) this.emitError(client, result);
  }

  @SubscribeMessage('special:round:next')
  async nextRound(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { pin?: string },
  ) {
    if (!payload?.pin) return;
    const result = await this.games.nextRound(payload.pin, client.id);
    if (!result.ok) this.emitError(client, result);
  }

  @SubscribeMessage('parallel:answer:submit')
  async submitParallel(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { pin?: string; roundId?: string; answer?: string },
  ) {
    if (!payload?.pin || !payload.roundId || !payload.answer) return;
    const result = await this.games.submitParallelAnswer(
      client.id,
      payload.pin,
      payload.roundId,
      payload.answer,
    );
    if (!result.ok) this.emitError(client, result);
  }

  @SubscribeMessage('parallel:reveal')
  async revealParallel(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { pin?: string },
  ) {
    if (!payload?.pin) return;
    const result = await this.games.revealParallel(payload.pin, client.id);
    if (!result.ok) this.emitError(client, result);
  }

  @SubscribeMessage('reverse:question:submit')
  async submitReverse(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody()
    payload: { pin?: string; roundId?: string; question?: string },
  ) {
    if (!payload?.pin || !payload.roundId || !payload.question) return;
    const result = await this.games.submitReverseQuestion(
      client.id,
      payload.pin,
      payload.roundId,
      payload.question,
    );
    if (!result.ok) this.emitError(client, result);
  }

  @SubscribeMessage('reverse:voting:start')
  async startVoting(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { pin?: string },
  ) {
    if (!payload?.pin) return;
    const result = await this.games.startReverseVoting(payload.pin, client.id);
    if (!result.ok) this.emitError(client, result);
  }

  @SubscribeMessage('reverse:vote')
  async vote(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { pin?: string; submissionId?: string },
  ) {
    if (!payload?.pin || !payload.submissionId) return;
    const result = await this.games.voteReverse(
      client.id,
      payload.pin,
      payload.submissionId,
    );
    if (!result.ok) this.emitError(client, result);
  }

  @SubscribeMessage('reverse:reveal')
  async revealReverse(
    @ConnectedSocket() client: SpecialSocket,
    @MessageBody() payload: { pin?: string },
  ) {
    if (!payload?.pin) return;
    const result = await this.games.revealReverse(payload.pin, client.id);
    if (!result.ok) this.emitError(client, result);
  }
}
