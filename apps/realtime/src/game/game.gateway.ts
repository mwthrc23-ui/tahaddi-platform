import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { ClientToServerEvents, ServerToClientEvents } from './types.js';
import type { Server, Socket } from 'socket.io';
import { GameService } from './game.service.js';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;

@WebSocketGateway({ cors: { origin: '*', credentials: false }, namespace: '/' })
export class GameGateway
  implements
    OnGatewayInit<GameServer>,
    OnGatewayConnection<GameSocket>,
    OnGatewayDisconnect<GameSocket>
{
  @WebSocketServer()
  server!: GameServer;

  /** Map from socketId → PIN (to track which room a player is in) */
  private readonly socketRooms = new Map<string, string>();

  constructor(private readonly gameService: GameService) {}

  afterInit(server: GameServer) {
    this.gameService.setServer(server);
  }

  handleConnection(client: GameSocket) {
    console.log(`[Gateway] client connected: ${client.id}`);
  }

  async handleDisconnect(client: GameSocket) {
    const pin = this.socketRooms.get(client.id);
    if (pin) {
      this.socketRooms.delete(client.id);
      await this.gameService.playerLeft(client.id, pin);
    }
    console.log(`[Gateway] client disconnected: ${client.id}`);
  }

  // ─── Create room ────────────────────────────────────────────────────────────

  @SubscribeMessage('room:start')
  async handleRoomCreate(@ConnectedSocket() client: GameSocket) {
    try {
      const session = await this.gameService.createRoom(client.id);
      await client.join(session.pin);
      this.socketRooms.set(client.id, session.pin);

      client.emit('room:state', {
        pin: session.pin,
        phase: session.phase,
        players: [],
        hostId: session.hostId,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      client.emit('game:error', { code: 'CREATE_FAILED', message });
    }
  }

  // ─── Join room ──────────────────────────────────────────────────────────────

  @SubscribeMessage('room:join')
  async handleRoomJoin(
    @ConnectedSocket() client: GameSocket,
    @MessageBody() payload: { pin: string; playerName: string },
  ) {
    if (!payload?.pin || !payload?.playerName) {
      client.emit('game:error', {
        code: 'INVALID_PAYLOAD',
        message: 'pin and playerName required',
      });
      return;
    }

    const result = await this.gameService.joinRoom(
      client.id,
      payload.pin,
      payload.playerName,
    );
    if (!result.ok) {
      client.emit('game:error', { code: result.error, message: result.error });
      return;
    }

    await client.join(payload.pin);
    this.socketRooms.set(client.id, payload.pin);

    // Tell the joining player the current room state
    client.emit('room:state', {
      pin: payload.pin,
      phase: result.session.phase,
      players: result.players,
      hostId: result.session.hostId,
    });

    // Broadcast new player to everyone in the room
    const newPlayer = result.players.find((p) => p.id === client.id);
    if (newPlayer) {
      client.to(payload.pin).emit('room:player_joined', { player: newPlayer });
    }
  }

  // ─── Start game ─────────────────────────────────────────────────────────────

  @SubscribeMessage('question:next')
  async handleStartGame(
    @ConnectedSocket() client: GameSocket,
    @MessageBody() payload: { pin: string },
  ) {
    if (!payload?.pin) {
      client.emit('game:error', {
        code: 'INVALID_PAYLOAD',
        message: 'pin required',
      });
      return;
    }

    const result = await this.gameService.startGame(payload.pin, client.id);
    if (!result.ok) {
      client.emit('game:error', {
        code: result.error ?? 'START_FAILED',
        message: result.error ?? 'start failed',
      });
    }
  }

  // ─── Submit answer ──────────────────────────────────────────────────────────

  @SubscribeMessage('answer:submit')
  async handleAnswerSubmit(
    @ConnectedSocket() client: GameSocket,
    @MessageBody()
    payload: {
      pin: string;
      questionId: string;
      optionId: string;
      clientTs: number;
    },
  ) {
    if (!payload?.pin || !payload?.questionId || !payload?.optionId) {
      client.emit('game:error', {
        code: 'INVALID_PAYLOAD',
        message: 'pin, questionId, optionId required',
      });
      return;
    }

    await this.gameService.submitAnswer(
      client.id,
      payload.pin,
      payload.questionId,
      payload.optionId,
    );
  }
}
