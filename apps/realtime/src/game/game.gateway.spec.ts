import { createLiveAccessToken } from '@tahaddi/contracts';
import { GameGateway } from './game.gateway.js';

const secret = 'test-live-access-secret-value';

function createClient() {
  return {
    id: 'socket-1',
    emit: jest.fn(),
    join: jest.fn().mockResolvedValue(undefined),
    leave: jest.fn().mockResolvedValue(undefined),
  };
}

describe('GameGateway', () => {
  const snapshot = {
    sessionId: 'session-1',
    roomCode: 'ABC123',
    phase: 'LOBBY' as const,
    serverTime: 1,
    question: null,
    reveal: null,
    leaderboard: [],
    participantCount: 1,
    playerAnswer: null,
    playerResult: null,
  };

  function setup() {
    const gameService = {
      setServer: jest.fn(),
      validateIdentity: jest.fn().mockResolvedValue(true),
      joined: jest.fn().mockResolvedValue(snapshot),
      disconnected: jest.fn(),
      startQuestion: jest.fn(),
      next: jest.fn(),
      submitAnswer: jest.fn(),
      finishGame: jest.fn(),
    };
    const config = { get: jest.fn().mockReturnValue(secret) };
    return {
      gateway: new GameGateway(gameService as never, config as never),
      gameService,
    };
  }

  it('joins a valid player and returns a reconnect snapshot', async () => {
    const { gateway, gameService } = setup();
    const client = createClient();
    const token = createLiveAccessToken(secret, {
      sessionId: 'session-1',
      subjectId: 'player-1',
      role: 'player',
    });

    await gateway.handleGameJoin(client as never, {
      sessionId: 'session-1',
      subjectId: 'player-1',
      accessToken: token,
      role: 'player',
    });

    expect(gameService.validateIdentity).toHaveBeenCalled();
    expect(client.join).toHaveBeenCalledWith('live:session-1');
    expect(client.join).toHaveBeenCalledWith('live:session-1:player:player-1');
    expect(client.emit).toHaveBeenCalledWith('game:snapshot', snapshot);
  });

  it('rejects a forged join token', async () => {
    const { gateway, gameService } = setup();
    const client = createClient();
    await gateway.handleGameJoin(client as never, {
      sessionId: 'session-1',
      subjectId: 'player-1',
      accessToken: 'forged',
      role: 'player',
    });
    expect(gameService.validateIdentity).not.toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalledWith(
      'game:error',
      expect.objectContaining({ code: 'JOIN_DENIED' }),
    );
  });

  it('prevents a player from starting a host-only question', async () => {
    const { gateway, gameService } = setup();
    const client = createClient();
    const token = createLiveAccessToken(secret, {
      sessionId: 'session-1',
      subjectId: 'player-1',
      role: 'player',
    });

    await gateway.handleGameJoin(client as never, {
      sessionId: 'session-1',
      subjectId: 'player-1',
      accessToken: token,
      role: 'player',
    });
    client.emit.mockClear();

    await gateway.handleQuestionStart(client as never, {
      sessionId: 'session-1',
    });

    expect(gameService.startQuestion).not.toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalledWith(
      'game:error',
      expect.objectContaining({ code: 'HOST_ONLY' }),
    );
  });

  it('uses clock ping/pong without a server-side countdown stream', () => {
    const { gateway } = setup();
    const client = createClient();
    const now = jest.spyOn(Date, 'now').mockReturnValue(456);
    gateway.handleClockPing(client as never, { clientSentAt: 123 });
    expect(client.emit).toHaveBeenCalledWith('clock:pong', {
      clientSentAt: 123,
      serverTime: 456,
    });
    now.mockRestore();
  });
});
