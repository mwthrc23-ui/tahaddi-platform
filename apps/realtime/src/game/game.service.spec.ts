import { GameService } from './game.service.js';

function makeSession() {
  const startedAt = new Date(Date.now() - 1_000);
  return {
    id: 'session-1',
    roomCode: 'ABC123',
    hostId: 'host-1',
    status: 'ACTIVE',
    currentQuestionPosition: 0,
    questionStartedAt: startedAt,
    endedAt: null,
    quiz: {
      autoAdvance: true,
      questions: [
        {
          position: 0,
          question: {
            id: 'question-1',
            prompt: 'ما الإجابة؟',
            imageUrl: null,
            explanation: 'شرح',
            timeLimit: 20,
            basePoints: 1_000,
            options: [
              { id: 'option-1', text: 'الأولى', position: 0, isCorrect: true },
              {
                id: 'option-2',
                text: 'الثانية',
                position: 1,
                isCorrect: false,
              },
            ],
          },
        },
      ],
    },
    participants: [
      {
        id: 'player-1',
        displayName: 'لاعب',
        score: 0,
        correctCount: 0,
        status: 'CONNECTED',
        joinedAt: new Date(startedAt.getTime() - 500),
      },
    ],
    answers: [],
  };
}

describe('GameService live safety', () => {
  function setup(session = makeSession()) {
    const redis = {
      loadGameState: jest.fn().mockResolvedValue({
        sessionId: session.id,
        roomCode: session.roomCode,
        phase: 'QUESTION',
        currentQuestionPosition: 0,
        questionStartedAt: session.questionStartedAt.getTime(),
        questionEndsAt: session.questionStartedAt.getTime() + 20_000,
      }),
      saveGameState: jest.fn(),
      acquireTransition: jest.fn().mockResolvedValue(true),
      releaseTransition: jest.fn(),
    };
    const transaction = {
      liveAnswer: { create: jest.fn() },
      liveParticipant: { update: jest.fn() },
    };
    const database = {
      client: {
        liveSession: {
          findUnique: jest.fn().mockResolvedValue(session),
          update: jest.fn(),
        },
        liveParticipant: {
          updateMany: jest.fn(),
          count: jest.fn().mockResolvedValue(1),
        },
        $transaction: jest.fn(
          async (callback: (value: typeof transaction) => Promise<void>) =>
            callback(transaction),
        ),
      },
    };
    const io = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    const service = new GameService(redis as never, database as never);
    service.setServer(io as never);
    return { service, redis, database, transaction, io, session };
  }

  it('authorizes only the stored host or a participant in the session', async () => {
    const { service } = setup();

    await expect(
      service.validateIdentity({
        sessionId: 'session-1',
        subjectId: 'host-1',
        role: 'host',
      }),
    ).resolves.toBe(true);
    await expect(
      service.validateIdentity({
        sessionId: 'session-1',
        subjectId: 'player-1',
        role: 'player',
      }),
    ).resolves.toBe(true);
    await expect(
      service.validateIdentity({
        sessionId: 'session-1',
        subjectId: 'intruder',
        role: 'player',
      }),
    ).resolves.toBe(false);
  });

  it('does not expose the correct answer in a QUESTION snapshot', async () => {
    const { service } = setup();
    const snapshot = await service.getSnapshot({
      sessionId: 'session-1',
      subjectId: 'player-1',
      role: 'player',
    });
    expect(snapshot?.phase).toBe('QUESTION');
    expect(snapshot?.reveal).toBeNull();
    expect(snapshot?.question?.options).toEqual([
      { id: 'option-1', text: 'الأولى', position: 0 },
      { id: 'option-2', text: 'الثانية', position: 1 },
    ]);
    expect(JSON.stringify(snapshot)).not.toContain('isCorrect');
    expect(snapshot?.leaderboard).toEqual([]);
  });

  it('rejects a late answer using server time', async () => {
    const { service, redis, io, database } = setup();
    redis.loadGameState.mockResolvedValue({
      sessionId: 'session-1',
      roomCode: 'ABC123',
      phase: 'QUESTION',
      currentQuestionPosition: 0,
      questionStartedAt: Date.now() - 30_000,
      questionEndsAt: Date.now() - 1,
    });
    await service.submitAnswer(
      { sessionId: 'session-1', subjectId: 'player-1', role: 'player' },
      'socket-1',
      { questionId: 'question-1', optionId: 'option-1' },
    );
    expect(database.client.$transaction).not.toHaveBeenCalled();
    expect(io.emit).toHaveBeenCalledWith('answer:rejected', {
      questionId: 'question-1',
      reason: 'ANSWER_TOO_LATE',
    });
  });

  it('rejects a duplicate answer even after reconnect', async () => {
    const { service, database, io } = setup();
    database.client.$transaction.mockRejectedValue({ code: 'P2002' });
    await service.submitAnswer(
      { sessionId: 'session-1', subjectId: 'player-1', role: 'player' },
      'new-socket-after-reconnect',
      { questionId: 'question-1', optionId: 'option-1' },
    );
    expect(io.emit).toHaveBeenCalledWith('answer:rejected', {
      questionId: 'question-1',
      reason: 'DUPLICATE_ANSWER',
    });
  });

  it('restores the player answer without exposing other players', async () => {
    const session = makeSession();
    session.answers.push({
      participantId: 'player-1',
      questionId: 'question-1',
      optionId: 'option-2',
      isCorrect: false,
      earnedPoints: 0,
      receivedAt: new Date(),
    } as never);
    const { service } = setup(session);
    const snapshot = await service.getSnapshot({
      sessionId: 'session-1',
      subjectId: 'player-1',
      role: 'player',
    });
    expect(snapshot?.playerAnswer?.optionId).toBe('option-2');
    expect(snapshot?.leaderboard).toEqual([]);
  });
});
