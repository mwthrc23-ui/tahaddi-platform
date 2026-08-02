import { SpecialGamesGateway } from './special-games.gateway.js';

function createClient(id = 'socket-1', address = '203.0.113.10') {
  return {
    id,
    handshake: { address },
    emit: jest.fn(),
    join: jest.fn().mockResolvedValue(undefined),
  };
}

describe('SpecialGamesGateway security', () => {
  const room = {
    pin: '123456',
    hostId: 'socket-1',
    mode: 'parallel-world' as const,
    phase: 'lobby' as const,
    roundIndex: 0,
    players: [],
  };

  function setup() {
    const games = {
      setServer: jest.fn(),
      createRoom: jest.fn().mockResolvedValue(room),
    };
    return {
      gateway: new SpecialGamesGateway(games as never),
      games,
    };
  }

  it('uses the configured web origin allowlist instead of a wildcard', () => {
    const options = Reflect.getMetadata(
      'websockets:gateway_options',
      SpecialGamesGateway,
    ) as {
      cors?: {
        origin?: (
          origin: string | undefined,
          callback: (error: Error | null, allowed?: boolean) => void,
        ) => void;
        credentials?: boolean;
      };
      allowRequest?: unknown;
    };

    expect(options.cors?.credentials).toBe(true);
    expect(options.cors?.origin).toEqual(expect.any(Function));
    expect(options.allowRequest).toEqual(expect.any(Function));
  });

  it('limits repeated room creation attempts from one socket', async () => {
    const { gateway, games } = setup();
    const client = createClient();

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await gateway.createRoom(client as never, { mode: 'parallel-world' });
    }

    expect(games.createRoom).toHaveBeenCalledTimes(3);
    expect(client.emit).toHaveBeenLastCalledWith(
      'special:error',
      expect.objectContaining({ code: 'RATE_LIMITED' }),
    );
  });

  it('applies a wider address limit across reconnecting sockets', async () => {
    const { gateway, games } = setup();
    for (let connection = 0; connection < 10; connection += 1) {
      const client = createClient(`socket-${connection}`);
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await gateway.createRoom(client as never, { mode: 'parallel-world' });
      }
    }
    const reconnected = createClient('socket-final');
    await gateway.createRoom(reconnected as never, {
      mode: 'parallel-world',
    });

    expect(games.createRoom).toHaveBeenCalledTimes(30);
    expect(reconnected.emit).toHaveBeenCalledWith(
      'special:error',
      expect.objectContaining({ code: 'RATE_LIMITED' }),
    );
  });
});
