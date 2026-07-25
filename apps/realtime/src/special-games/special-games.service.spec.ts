import { PARALLEL_WORLD_BANK, REVERSE_TIME_BANK } from '@tahaddi/domain';
import type { RedisService } from '../game/redis.service.js';
import { SpecialGamesService } from './special-games.service.js';
import type { SpecialGameRoom } from './types.js';

class MemoryRoomStore {
  rooms = new Map<string, SpecialGameRoom>();
  activePins = new Set<string>();

  saveSpecialRoom(pin: string, room: SpecialGameRoom) {
    this.rooms.set(pin, structuredClone(room));
    return Promise.resolve();
  }

  loadSpecialRoom<T>(pin: string): Promise<T | null> {
    return Promise.resolve(
      (structuredClone(this.rooms.get(pin)) as T | undefined) ?? null,
    );
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
    const room = await service.createRoom('host-1', 'parallel-world');

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
    const room = await service.createRoom('host-1', 'parallel-world');
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

  it('runs reverse-time writing, anonymous voting, and results', async () => {
    const { service, events } = setup();
    const room = await service.createRoom('host-1', 'reverse-time');
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

  it('rejects starting before the minimum player count is reached', async () => {
    const { service } = setup();
    const room = await service.createRoom('host-1', 'reverse-time');
    await service.joinRoom('player-1', room.pin, 'سارة');

    const result = await service.startGame(room.pin, 'host-1');

    expect(result).toEqual(
      expect.objectContaining({ ok: false, code: 'NOT_ENOUGH_PLAYERS' }),
    );
  });
});
