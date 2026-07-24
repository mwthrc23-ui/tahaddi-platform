import { Injectable } from '@nestjs/common';
import type {
  AnswerRejectionReason,
  ClientToServerEvents,
  GamePhase,
  GameSnapshot,
  PlayerInfo,
  PlayerQuestionResult,
  QuestionPayload,
  QuestionRevealPayload,
  QuestionStatsPayload,
  ServerToClientEvents,
} from '@tahaddi/contracts';
import type { Server } from 'socket.io';
import { DatabaseService } from './database.service.js';
import { calculateQuestionScore, canTransition } from './game-engine.js';
import { RedisService } from './redis.service.js';
import type { LiveGameState, LiveSocketIdentity } from './types.js';

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;
type SessionRecord = Awaited<ReturnType<GameService['loadSession']>>;
type QuestionRecord = NonNullable<ReturnType<GameService['currentQuestion']>>;

const LEADERBOARD_DURATION_MS = 2_500;

function gameRoom(sessionId: string) {
  return `live:${sessionId}`;
}

export function playerRoom(sessionId: string, participantId: string) {
  return `live:${sessionId}:player:${participantId}`;
}

export function hostRoom(sessionId: string) {
  return `live:${sessionId}:host`;
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}

function mediaFromUrl(imageUrl: string | null) {
  if (!imageUrl) return [];
  const isVideo = /\.(mp4|webm|ogg)(?:\?.*)?$/i.test(imageUrl);
  return [
    { type: isVideo ? ('video' as const) : ('image' as const), url: imageUrl },
  ];
}

@Injectable()
export class GameService {
  private io!: IoServer;
  private readonly revealTimers = new Map<string, NodeJS.Timeout>();
  private readonly leaderboardTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly redis: RedisService,
    private readonly database: DatabaseService,
  ) {}

  setServer(io: IoServer) {
    this.io = io;
  }

  private loadSession(sessionId: string) {
    return this.database.client.liveSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        roomCode: true,
        hostId: true,
        status: true,
        currentQuestionPosition: true,
        questionStartedAt: true,
        endedAt: true,
        quiz: {
          select: {
            autoAdvance: true,
            questions: {
              orderBy: { position: 'asc' },
              select: {
                position: true,
                question: {
                  select: {
                    id: true,
                    prompt: true,
                    imageUrl: true,
                    explanation: true,
                    timeLimit: true,
                    basePoints: true,
                    options: {
                      orderBy: { position: 'asc' },
                      select: {
                        id: true,
                        text: true,
                        position: true,
                        isCorrect: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        participants: {
          orderBy: [{ score: 'desc' }, { joinedAt: 'asc' }],
          select: {
            id: true,
            displayName: true,
            score: true,
            correctCount: true,
            status: true,
            joinedAt: true,
          },
        },
        answers: {
          select: {
            participantId: true,
            questionId: true,
            optionId: true,
            isCorrect: true,
            earnedPoints: true,
            receivedAt: true,
          },
        },
      },
    });
  }

  private currentQuestion(
    session: NonNullable<SessionRecord>,
    position: number,
  ) {
    return session.quiz.questions[position]?.question ?? null;
  }

  private toLeaderboard(session: NonNullable<SessionRecord>): PlayerInfo[] {
    return [...session.participants]
      .sort(
        (left, right) =>
          right.score - left.score ||
          left.joinedAt.getTime() - right.joinedAt.getTime(),
      )
      .map((participant, index) => ({
        id: participant.id,
        name: participant.displayName,
        score: participant.score,
        streak: participant.correctCount,
        rank: index + 1,
      }));
  }

  private toQuestionPayload(
    session: NonNullable<SessionRecord>,
    state: LiveGameState,
    question: QuestionRecord,
  ): QuestionPayload {
    return {
      questionId: question.id,
      prompt: question.prompt,
      options: question.options.map((option) => ({
        id: option.id,
        text: option.text,
        position: option.position,
      })),
      media: mediaFromUrl(question.imageUrl),
      questionStartedAt: state.questionStartedAt ?? Date.now(),
      questionEndsAt: state.questionEndsAt ?? Date.now(),
      questionNumber: state.currentQuestionPosition + 1,
      totalQuestions: session.quiz.questions.length,
    };
  }

  private async ensureState(session: NonNullable<SessionRecord>) {
    const stored = await this.redis.loadGameState(session.id);
    if (stored) return stored;

    const question = this.currentQuestion(
      session,
      session.currentQuestionPosition,
    );
    const startedAt = session.questionStartedAt?.getTime() ?? null;
    const phase: GamePhase =
      session.status === 'FINISHED'
        ? 'FINISHED'
        : session.status === 'WAITING' || !question || !startedAt
          ? 'LOBBY'
          : 'QUESTION';
    const state: LiveGameState = {
      sessionId: session.id,
      roomCode: session.roomCode,
      phase,
      currentQuestionPosition: session.currentQuestionPosition,
      questionStartedAt: startedAt,
      questionEndsAt:
        startedAt && question ? startedAt + question.timeLimit * 1_000 : null,
    };
    await this.redis.saveGameState(state);
    if (phase === 'QUESTION' && state.questionEndsAt) {
      this.scheduleReveal(session.id, question.id, state.questionEndsAt);
    }
    return state;
  }

  async validateIdentity(identity: LiveSocketIdentity) {
    const session = await this.database.client.liveSession.findUnique({
      where: { id: identity.sessionId },
      select: {
        hostId: true,
        participants: {
          where: { id: identity.subjectId },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!session) return false;
    if (identity.role === 'host') return session.hostId === identity.subjectId;
    return session.participants.some(
      (participant) => participant.id === identity.subjectId,
    );
  }

  async joined(identity: LiveSocketIdentity) {
    if (identity.role === 'player') {
      await this.database.client.liveParticipant.updateMany({
        where: { id: identity.subjectId, sessionId: identity.sessionId },
        data: { status: 'CONNECTED', lastSeenAt: new Date() },
      });
    }
    const snapshot = await this.getSnapshot(identity);
    if (!snapshot) return null;
    if (identity.role === 'player') {
      const player = snapshot.leaderboard.find(
        (item) => item.id === identity.subjectId,
      );
      if (player) {
        this.io.to(gameRoom(identity.sessionId)).emit('game:player_joined', {
          player,
          participantCount: snapshot.participantCount,
        });
      }
    }
    return snapshot;
  }

  async disconnected(identity: LiveSocketIdentity) {
    if (identity.role !== 'player') return;
    await this.database.client.liveParticipant.updateMany({
      where: { id: identity.subjectId, sessionId: identity.sessionId },
      data: { status: 'DISCONNECTED', lastSeenAt: new Date() },
    });
    const count = await this.database.client.liveParticipant.count({
      where: { sessionId: identity.sessionId, status: 'CONNECTED' },
    });
    this.io.to(gameRoom(identity.sessionId)).emit('game:player_left', {
      playerId: identity.subjectId,
      participantCount: count,
    });
  }

  async getSnapshot(
    identity: LiveSocketIdentity,
  ): Promise<GameSnapshot | null> {
    let session = await this.loadSession(identity.sessionId);
    if (!session) return null;
    let state = await this.ensureState(session);
    const question = this.currentQuestion(
      session,
      state.currentQuestionPosition,
    );

    if (
      state.phase === 'QUESTION' &&
      question &&
      state.questionEndsAt &&
      Date.now() > state.questionEndsAt
    ) {
      await this.revealQuestion(session.id, question.id);
      session = await this.loadSession(identity.sessionId);
      if (!session) return null;
      state = (await this.redis.loadGameState(session.id)) ?? state;
    }

    const current = this.currentQuestion(
      session,
      state.currentQuestionPosition,
    );
    const answer =
      identity.role === 'player' && current
        ? session.answers.find(
            (item) =>
              item.participantId === identity.subjectId &&
              item.questionId === current.id,
          )
        : null;
    const leaderboard = this.toLeaderboard(session);
    const playerResult =
      answer && (state.phase === 'REVEAL' || state.phase === 'LEADERBOARD')
        ? this.toPlayerResult(answer, leaderboard)
        : null;
    const reveal =
      current && (state.phase === 'REVEAL' || state.phase === 'LEADERBOARD')
        ? this.buildReveal(session, current, playerResult)
        : null;

    return {
      sessionId: session.id,
      roomCode: session.roomCode,
      phase: state.phase,
      serverTime: Date.now(),
      question:
        current && state.phase !== 'LOBBY' && state.phase !== 'FINISHED'
          ? this.toQuestionPayload(session, state, current)
          : null,
      reveal,
      leaderboard: identity.role === 'host' ? leaderboard : [],
      participantCount: session.participants.filter(
        (participant) => participant.status === 'CONNECTED',
      ).length,
      playerAnswer: answer
        ? { optionId: answer.optionId, receivedAt: answer.receivedAt.getTime() }
        : null,
      playerResult,
    };
  }

  async startQuestion(sessionId: string, hostId: string) {
    const locked = await this.redis.acquireTransition(sessionId);
    if (!locked) return false;
    try {
      const session = await this.loadSession(sessionId);
      if (
        !session ||
        session.hostId !== hostId ||
        session.status === 'FINISHED'
      )
        return false;
      const state = await this.ensureState(session);
      const targetPosition =
        state.phase === 'LOBBY'
          ? session.currentQuestionPosition
          : state.phase === 'LEADERBOARD'
            ? state.currentQuestionPosition + 1
            : -1;
      if (targetPosition < 0 || !canTransition(state.phase, 'QUESTION'))
        return false;
      const question = this.currentQuestion(session, targetPosition);
      if (!question) {
        await this.finishGame(sessionId, hostId, true);
        return true;
      }

      const questionStartedAt = Date.now() + 350;
      const questionEndsAt = questionStartedAt + question.timeLimit * 1_000;
      const nextState: LiveGameState = {
        sessionId,
        roomCode: session.roomCode,
        phase: 'QUESTION',
        currentQuestionPosition: targetPosition,
        questionStartedAt,
        questionEndsAt,
      };
      await Promise.all([
        this.database.client.liveSession.update({
          where: { id: sessionId },
          data: {
            status: 'ACTIVE',
            startedAt:
              session.status === 'WAITING'
                ? new Date(questionStartedAt)
                : undefined,
            currentQuestionPosition: targetPosition,
            questionStartedAt: new Date(questionStartedAt),
            questionAdvanceAt: null,
          },
        }),
        this.redis.saveGameState(nextState),
      ]);

      const freshSession = await this.loadSession(sessionId);
      if (!freshSession) return false;
      const payload = this.toQuestionPayload(freshSession, nextState, question);
      this.io.to(gameRoom(sessionId)).emit('question:started', payload);
      this.scheduleReveal(sessionId, question.id, questionEndsAt);
      return true;
    } finally {
      await this.redis.releaseTransition(sessionId);
    }
  }

  async submitAnswer(
    identity: LiveSocketIdentity,
    socketId: string,
    input: { questionId: string; optionId: string },
  ) {
    const rejected = (reason: AnswerRejectionReason) => {
      this.io.to(socketId).emit('answer:rejected', {
        questionId: input.questionId,
        reason,
      });
      return false;
    };

    if (identity.role !== 'player') return rejected('INVALID_PLAYER');
    const session = await this.loadSession(identity.sessionId);
    if (!session) return rejected('INVALID_SESSION');
    const state = await this.ensureState(session);
    if (state.phase !== 'QUESTION') return rejected('QUESTION_NOT_ACTIVE');
    const question = this.currentQuestion(
      session,
      state.currentQuestionPosition,
    );
    if (!question || question.id !== input.questionId)
      return rejected('QUESTION_MISMATCH');
    const option = question.options.find((item) => item.id === input.optionId);
    if (!option) return rejected('INVALID_OPTION');

    const receivedAt = Date.now();
    if (state.questionStartedAt && receivedAt < state.questionStartedAt) {
      return rejected('QUESTION_NOT_ACTIVE');
    }
    if (!state.questionEndsAt || receivedAt > state.questionEndsAt) {
      return rejected('ANSWER_TOO_LATE');
    }
    const participant = session.participants.find(
      (item) => item.id === identity.subjectId,
    );
    if (!participant) return rejected('INVALID_PLAYER');
    const earnedPoints = calculateQuestionScore({
      correct: option.isCorrect,
      basePoints: question.basePoints,
      questionStartedAt: state.questionStartedAt ?? receivedAt,
      questionEndsAt: state.questionEndsAt,
      receivedAt,
    });

    try {
      await this.database.client.$transaction(async (transaction) => {
        await transaction.liveAnswer.create({
          data: {
            sessionId: session.id,
            participantId: participant.id,
            questionId: question.id,
            optionId: option.id,
            isCorrect: option.isCorrect,
            earnedPoints,
            receivedAt: new Date(receivedAt),
          },
        });
        await transaction.liveParticipant.update({
          where: { id: participant.id },
          data: {
            lastSeenAt: new Date(receivedAt),
            score: { increment: earnedPoints },
            correctCount: option.isCorrect ? { increment: 1 } : undefined,
          },
        });
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) return rejected('DUPLICATE_ANSWER');
      throw error;
    }

    this.io.to(socketId).emit('answer:accepted', {
      questionId: question.id,
      receivedAt,
    });
    const freshSession = await this.loadSession(session.id);
    if (!freshSession) return true;
    const stats = this.buildStats(freshSession, question);
    this.io.to(gameRoom(session.id)).emit('question:stats', stats);

    const eligible = freshSession.participants.filter(
      (item) =>
        item.status === 'CONNECTED' &&
        (!state.questionStartedAt ||
          item.joinedAt.getTime() <= state.questionStartedAt),
    );
    const answered = new Set(
      freshSession.answers
        .filter((item) => item.questionId === question.id)
        .map((item) => item.participantId),
    );
    if (
      eligible.length > 0 &&
      eligible.every((item) => answered.has(item.id))
    ) {
      await this.revealQuestion(session.id, question.id);
    }
    return true;
  }

  private buildStats(
    session: NonNullable<SessionRecord>,
    question: QuestionRecord,
  ): QuestionStatsPayload {
    const answers = session.answers.filter(
      (item) => item.questionId === question.id,
    );
    const counts = new Map<string, number>();
    for (const answer of answers) {
      counts.set(answer.optionId, (counts.get(answer.optionId) ?? 0) + 1);
    }
    return {
      questionId: question.id,
      answeredCount: answers.length,
      participantCount: session.participants.length,
      options: question.options.map((option) => {
        const count = counts.get(option.id) ?? 0;
        return {
          optionId: option.id,
          count,
          percentage:
            answers.length === 0
              ? 0
              : Math.round((count / answers.length) * 100),
        };
      }),
    };
  }

  private toPlayerResult(
    answer: NonNullable<SessionRecord>['answers'][number],
    leaderboard: PlayerInfo[],
  ): PlayerQuestionResult {
    const player = leaderboard.find((item) => item.id === answer.participantId);
    return {
      optionId: answer.optionId,
      correct: answer.isCorrect,
      earnedPoints: answer.earnedPoints,
      totalScore: player?.score ?? 0,
      rank: player?.rank ?? leaderboard.length,
    };
  }

  private buildReveal(
    session: NonNullable<SessionRecord>,
    question: QuestionRecord,
    playerResult: PlayerQuestionResult | null = null,
  ): QuestionRevealPayload {
    return {
      questionId: question.id,
      correctOptionId:
        question.options.find((option) => option.isCorrect)?.id ?? '',
      explanation: question.explanation,
      stats: this.buildStats(session, question),
      playerResult,
    };
  }

  async revealQuestion(sessionId: string, questionId: string) {
    const locked = await this.redis.acquireTransition(sessionId);
    if (!locked) return false;
    try {
      const session = await this.loadSession(sessionId);
      if (!session) return false;
      const state = await this.ensureState(session);
      const question = this.currentQuestion(
        session,
        state.currentQuestionPosition,
      );
      if (
        state.phase !== 'QUESTION' ||
        !question ||
        question.id !== questionId ||
        !canTransition(state.phase, 'REVEAL')
      ) {
        return false;
      }

      state.phase = 'REVEAL';
      await this.redis.saveGameState(state);
      this.clearRevealTimer(sessionId);
      const freshSession = await this.loadSession(sessionId);
      if (!freshSession) return false;
      const leaderboard = this.toLeaderboard(freshSession);
      const reveal = this.buildReveal(freshSession, question);
      this.io.to(hostRoom(sessionId)).emit('question:revealed', reveal);
      const answers = new Map(
        freshSession.answers
          .filter((item) => item.questionId === question.id)
          .map((answer) => [answer.participantId, answer]),
      );
      for (const participant of freshSession.participants) {
        const answer = answers.get(participant.id);
        this.io
          .to(playerRoom(sessionId, participant.id))
          .emit('question:revealed', {
            ...reveal,
            playerResult: answer
              ? this.toPlayerResult(answer, leaderboard)
              : null,
          });
      }
      return true;
    } finally {
      await this.redis.releaseTransition(sessionId);
    }
  }

  async next(sessionId: string, hostId: string) {
    const locked = await this.redis.acquireTransition(sessionId);
    if (!locked) return false;
    try {
      const session = await this.loadSession(sessionId);
      if (!session || session.hostId !== hostId) return false;
      const state = await this.ensureState(session);
      if (
        state.phase !== 'REVEAL' ||
        !canTransition(state.phase, 'LEADERBOARD')
      ) {
        return false;
      }
      state.phase = 'LEADERBOARD';
      await this.redis.saveGameState(state);
      const leaderboard = this.toLeaderboard(session);
      this.io
        .to(gameRoom(sessionId))
        .emit('leaderboard:shown', { leaderboard: [] });
      this.io
        .to(hostRoom(sessionId))
        .emit('leaderboard:shown', { leaderboard });

      const oldTimer = this.leaderboardTimers.get(sessionId);
      if (oldTimer) clearTimeout(oldTimer);
      this.leaderboardTimers.set(
        sessionId,
        setTimeout(() => {
          this.leaderboardTimers.delete(sessionId);
          void this.startQuestion(sessionId, hostId);
        }, LEADERBOARD_DURATION_MS),
      );
      return true;
    } finally {
      await this.redis.releaseTransition(sessionId);
    }
  }

  async finishGame(sessionId: string, hostId: string, internal = false) {
    if (!internal) {
      const session = await this.database.client.liveSession.findUnique({
        where: { id: sessionId },
        select: { hostId: true },
      });
      if (!session || session.hostId !== hostId) return false;
    }
    const session = await this.loadSession(sessionId);
    if (!session) return false;
    const state = await this.ensureState(session);
    state.phase = 'FINISHED';
    state.questionEndsAt = null;
    await Promise.all([
      this.database.client.liveSession.update({
        where: { id: sessionId },
        data: {
          status: 'FINISHED',
          endedAt: new Date(),
          questionAdvanceAt: null,
        },
      }),
      this.redis.saveGameState(state),
    ]);
    this.clearRevealTimer(sessionId);
    const leaderboardTimer = this.leaderboardTimers.get(sessionId);
    if (leaderboardTimer) clearTimeout(leaderboardTimer);
    this.leaderboardTimers.delete(sessionId);
    const freshSession = await this.loadSession(sessionId);
    const leaderboard = freshSession ? this.toLeaderboard(freshSession) : [];
    this.io
      .to(gameRoom(sessionId))
      .emit('game:finished', { leaderboard: [], sessionId });
    this.io
      .to(hostRoom(sessionId))
      .emit('game:finished', { leaderboard, sessionId });
    return true;
  }

  private scheduleReveal(
    sessionId: string,
    questionId: string,
    questionEndsAt: number,
  ) {
    this.clearRevealTimer(sessionId);
    const delay = Math.max(0, questionEndsAt - Date.now());
    this.revealTimers.set(
      sessionId,
      setTimeout(() => {
        this.revealTimers.delete(sessionId);
        void this.revealQuestion(sessionId, questionId);
      }, delay),
    );
  }

  private clearRevealTimer(sessionId: string) {
    const timer = this.revealTimers.get(sessionId);
    if (timer) clearTimeout(timer);
    this.revealTimers.delete(sessionId);
  }
}

export { gameRoom };
