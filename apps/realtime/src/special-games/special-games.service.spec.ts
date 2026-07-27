import {
  PARALLEL_WORLD_BANK,
  REVERSE_TIME_BANK,
  SPECIAL_GAME_META,
  SPECIAL_GAME_ORDER,
} from '@tahaddi/domain';
import type { RedisService } from '../game/redis.service.js';
import { SpecialGamesService } from './special-games.service.js';
import type { SpecialGameRoom } from './types.js';

class MemoryRoomStore {
  rooms = new Map<string, SpecialGameRoom>();
  activePins = new Set<string>();
  locks = new Map<string, string>();

  saveSpecialRoom(pin: string, room: SpecialGameRoom) {
    this.rooms.set(pin, structuredClone(room));
    return Promise.resolve();
  }

  loadSpecialRoom<T>(pin: string): Promise<T | null> {
    return Promise.resolve(
      (structuredClone(this.rooms.get(pin)) as T | undefined) ?? null,
    );
  }

  deleteSpecialRoom(pin: string) {
    this.rooms.delete(pin);
    return Promise.resolve();
  }

  addActivePin(pin: string) {
    this.activePins.add(pin);
    return Promise.resolve();
  }

  removeActivePin(pin: string) {
    this.activePins.delete(pin);
    return Promise.resolve();
  }

  isPinActive(pin: string) {
    return Promise.resolve(this.activePins.has(pin));
  }

  acquireSpecialRoomLock(pin: string, token: string) {
    if (this.locks.has(pin)) return Promise.resolve(false);
    this.locks.set(pin, token);
    return Promise.resolve(true);
  }

  releaseSpecialRoomLock(pin: string, token: string) {
    if (this.locks.get(pin) === token) this.locks.delete(pin);
    return Promise.resolve();
  }
}

type EmittedEvent = { target: string; event: string; payload: unknown };

function createIoRecorder() {
  const events: EmittedEvent[] = [];
  return {
    events,
    server: {
      to(target: string) {
        return {
          emit(event: string, payload: unknown) {
            events.push({ target, event, payload });
          },
        };
      },
    },
  };
}

describe('SpecialGamesService', () => {
  function setup() {
    const store = new MemoryRoomStore();
    const io = createIoRecorder();
    const service = new SpecialGamesService(store as unknown as RedisService);
    service.setServer(io.server as never);
    return { service, store, events: io.events };
  }

  it('distributes different parallel questions that share one answer', async () => {
    const { service, events } = setup();
    const room = await service.createRoom('host-1', SPECIAL_GAME_ORDER[0]);

    await service.joinRoom('player-1', room.pin, 'سارة');
    await service.joinRoom('player-2', room.pin, 'فيصل');
    const started = await service.startGame(room.pin, 'host-1');

    expect(started.ok).toBe(true);
    const questions = events
      .filter((event) => event.event === 'parallel:round')
      .map((event) => event.payload as { prompt: string; options: string[] });
    expect(questions).toHaveLength(2);
    expect(questions[0]?.prompt).not.toBe(questions[1]?.prompt);
    expect(
      questions.every((question) =>
        question.options.includes(PARALLEL_WORLD_BANK[0].answer),
      ),
    ).toBe(true);
  });

  it('scores parallel answers and reveals automatically when everyone answered', async () => {
    const { service, events } = setup();
    const room = await service.createRoom('host-1', SPECIAL_GAME_ORDER[0]);
    await service.joinRoom('player-1', room.pin, 'سارة');
    await service.joinRoom('player-2', room.pin, 'فيصل');
    await service.startGame(room.pin, 'host-1');
    const round = PARALLEL_WORLD_BANK[0];

    await service.submitParallelAnswer(
      'player-1',
      room.pin,
      round.id,
      round.answer,
    );
    await service.submitParallelAnswer(
      'player-2',
      room.pin,
      round.id,
      'إجابة أخرى',
    );

    const reveal = events.find((event) => event.event === 'parallel:reveal');
    expect(reveal).toBeDefined();
    const result = reveal?.payload as {
      answer: string;
      results: Array<{ correct: boolean }>;
    };
    expect(result.answer).toBe(round.answer);
    expect(result.results.map((item) => item.correct)).toEqual([true, false]);
  });

  it('serializes simultaneous answers so no player update is lost', async () => {
    const { service, store, events } = setup();
    const room = await service.createRoom('host-1', SPECIAL_GAME_ORDER[0]);
    const playerIds = ['player-1', 'player-2', 'player-3'];
    for (const [index, playerId] of playerIds.entries()) {
      await service.joinRoom(playerId, room.pin, `لاعب ${index + 1}`);
    }
    await service.startGame(room.pin, 'host-1');
    const round = PARALLEL_WORLD_BANK[0];

    await Promise.all(
      playerIds.map((playerId) =>
        service.executeWithRoomLock(room.pin, () =>
          service.submitParallelAnswer(
            playerId,
            room.pin,
            round.id,
            round.answer,
          ),
        ),
      ),
    );

    expect(
      Object.keys(store.rooms.get(room.pin)?.parallelAnswers ?? {}),
    ).toHaveLength(3);
    expect(
      events.filter((event) => event.event === 'parallel:reveal'),
    ).toHaveLength(1);
  });

  it('runs writing, anonymous voting, and results for the second room mode', async () => {
    const { service, events } = setup();
    const room = await service.createRoom('host-1', SPECIAL_GAME_ORDER[1]);
    await service.joinRoom('player-1', room.pin, 'سارة');
    await service.joinRoom('player-2', room.pin, 'فيصل');
    await service.joinRoom('player-3', room.pin, 'نور');
    await service.startGame(room.pin, 'host-1');
    const round = REVERSE_TIME_BANK[0];

    await service.submitReverseQuestion(
      'player-1',
      room.pin,
      round.id,
      'في أي مدينة يقع قصر المصمك؟',
    );
    await service.submitReverseQuestion(
      'player-2',
      room.pin,
      round.id,
      'أين يُقام أكبر موسم ترفيهي في المملكة؟',
    );
    await service.submitReverseQuestion(
      'player-3',
      room.pin,
      round.id,
      'ما المدينة التي تتوسط المملكة؟',
    );

    const votingEvents = events.filter(
      (event) => event.event === 'reverse:voting',
    );
    expect(votingEvents).toHaveLength(3);
    const playerOneBallot = votingEvents.find(
      (event) => event.target === 'player-1',
    )?.payload as {
      submissions: Array<{ id: string; isOwn: boolean }>;
    };
    expect(
      playerOneBallot.submissions.filter((item) => item.isOwn),
    ).toHaveLength(1);

    const ids = playerOneBallot.submissions.map((item) => item.id);
    await service.voteReverse('player-1', room.pin, ids[1]);
    await service.voteReverse('player-2', room.pin, ids[0]);
    await service.voteReverse('player-3', room.pin, ids[0]);

    const results = events.find((event) => event.event === 'reverse:results')
      ?.payload as {
      answer: string;
      results: Array<{ votes: number }>;
    };
    expect(results.answer).toBe(round.answer);
    expect(results.results[0]?.votes).toBe(2);
  });

  it('rejects every room mode below its declared minimum with a clear Arabic message', async () => {
    const { service } = setup();
    for (const mode of SPECIAL_GAME_ORDER) {
      const room = await service.createRoom(`host-${mode}`, mode);
      const minimum = SPECIAL_GAME_META[mode].minimumPlayers;
      for (let index = 0; index < minimum - 1; index += 1) {
        await service.joinRoom(
          `${mode}-player-${index}`,
          room.pin,
          `لاعب ${index + 1}`,
        );
      }

      const result = await service.startGame(room.pin, `host-${mode}`);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe('NOT_ENOUGH_PLAYERS');
        expect(result.message).toMatch(/لاعبين على الأقل/);
      }
    }
  });

  it('runs distribution, anonymous answers, voting, guess, and reveal for the third mode', async () => {
    const { service, store, events } = setup();
    const room = await service.createRoom('host-1', SPECIAL_GAME_ORDER[2]);
    const playerIds = ['player-1', 'player-2', 'player-3', 'player-4'];
    for (const [index, playerId] of playerIds.entries()) {
      await service.joinRoom(playerId, room.pin, `لاعب ${index + 1}`);
    }

    const started = await service.startGame(room.pin, 'host-1');
    expect(started.ok).toBe(true);
    const distributed = events.filter(
      (event) => event.event === 'infiltrator:round',
    );
    expect(distributed).toHaveLength(4);
    expect(
      distributed.filter(
        (event) => (event.payload as { isInfiltrator: boolean }).isInfiltrator,
      ),
    ).toHaveLength(1);

    const activeRoom = store.rooms.get(room.pin);
    expect(activeRoom?.infiltratorId).toBeTruthy();
    for (const playerId of playerIds) {
      const assignment = activeRoom?.infiltratorAssignments[playerId];
      const assignedRound = assignment
        ? PARALLEL_WORLD_BANK[assignment.bankIndex]
        : undefined;
      const variant = assignedRound?.variants[assignment?.variantIndex ?? 0];
      expect(variant).toBeDefined();
      await service.submitInfiltratorAnswer(
        playerId,
        room.pin,
        PARALLEL_WORLD_BANK[0].id,
        variant?.options[0] ?? '',
      );
    }

    const ballots = events.filter(
      (event) => event.event === 'infiltrator:voting',
    );
    expect(ballots).toHaveLength(4);
    expect(
      ballots.every((event) =>
        (
          event.payload as { answers: Array<{ playerName?: string }> }
        ).answers.every((answer) => answer.playerName === undefined),
      ),
    ).toBe(true);

    const infiltratorId = activeRoom?.infiltratorId;
    expect(infiltratorId).toBeTruthy();
    for (const playerId of playerIds) {
      await service.voteInfiltrator(
        playerId,
        room.pin,
        playerId === infiltratorId
          ? (playerIds.find((candidate) => candidate !== playerId) ??
              playerIds[0])
          : (infiltratorId ?? ''),
      );
    }
    await service.guessInfiltratorMajority(
      infiltratorId ?? '',
      room.pin,
      PARALLEL_WORLD_BANK[0].variants[0].prompt,
    );

    const reveal = events.find((event) => event.event === 'infiltrator:reveal')
      ?.payload as { caught: boolean; infiltratorId: string };
    expect(reveal).toMatchObject({ caught: true, infiltratorId });
  });

  it('returns an active round to the lobby if its infiltrator disconnects', async () => {
    const { service, store, events } = setup();
    const room = await service.createRoom('host-1', SPECIAL_GAME_ORDER[2]);
    for (let index = 0; index < 4; index += 1) {
      await service.joinRoom(`player-${index}`, room.pin, `لاعب ${index + 1}`);
    }
    await service.startGame(room.pin, 'host-1');
    const infiltratorId = store.rooms.get(room.pin)?.infiltratorId;
    expect(infiltratorId).toBeTruthy();

    await service.playerLeft(infiltratorId ?? '', room.pin);

    expect(store.rooms.get(room.pin)?.phase).toBe('lobby');
    expect(
      events.some(
        (event) =>
          event.event === 'special:error' &&
          (event.payload as { code: string }).code === 'ROUND_RESET',
      ),
    ).toBe(true);
  });
});
