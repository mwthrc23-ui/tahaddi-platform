import { Injectable } from '@nestjs/common';
import type {
  ClientToServerEvents,
  PlayerInfo,
  RevealPayload,
  ServerToClientEvents,
} from './types.js';
import { Server } from 'socket.io';
import { RedisService } from './redis.service.js';
import type { GameQuestion, GameSession, PlayerState } from './types.js';

// ─── Demo question bank (used when no DB is configured) ──────────────────────
const DEMO_QUESTIONS: GameQuestion[] = [
  {
    id: 'q-demo-1',
    prompt: 'ما هي أكبر دولة عربية من حيث المساحة؟',
    explanation: 'الجزائر هي أكبر دولة عربية وإفريقية من حيث المساحة.',
    category: 'جغرافيا',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    timeLimit: 20,
    basePoints: 1000,
    options: [
      { id: 'a', text: 'المملكة العربية السعودية', isCorrect: false },
      { id: 'b', text: 'الجزائر', isCorrect: true },
      { id: 'c', text: 'السودان', isCorrect: false },
      { id: 'd', text: 'مصر', isCorrect: false },
    ],
  },
  {
    id: 'q-demo-2',
    prompt: 'كم عدد أركان الإسلام؟',
    explanation: 'أركان الإسلام خمسة: الشهادتان، الصلاة، الزكاة، الصوم، والحج.',
    category: 'ثقافة إسلامية',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    timeLimit: 15,
    basePoints: 1000,
    options: [
      { id: 'a', text: 'خمسة', isCorrect: true },
      { id: 'b', text: 'أربعة', isCorrect: false },
      { id: 'c', text: 'ستة', isCorrect: false },
      { id: 'd', text: 'ثلاثة', isCorrect: false },
    ],
  },
  {
    id: 'q-demo-3',
    prompt: 'الماء يتكوّن من عنصري الهيدروجين والأكسجين.',
    explanation: 'صيغة الماء H₂O: ذرتا هيدروجين وذرة أكسجين واحدة.',
    category: 'علوم',
    difficulty: 'EASY',
    type: 'TRUE_FALSE',
    timeLimit: 15,
    basePoints: 800,
    options: [
      { id: 'a', text: 'صحيح', isCorrect: true },
      { id: 'b', text: 'خطأ', isCorrect: false },
    ],
  },
  {
    id: 'q-demo-4',
    prompt: 'ما هو أكبر كوكب في المجموعة الشمسية؟',
    explanation: 'كوكب المشتري هو أكبر كواكب المجموعة الشمسية.',
    category: 'علوم',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    timeLimit: 15,
    basePoints: 800,
    options: [
      { id: 'a', text: 'المشتري', isCorrect: true },
      { id: 'b', text: 'زحل', isCorrect: false },
      { id: 'c', text: 'الشمس', isCorrect: false },
      { id: 'd', text: 'أورانوس', isCorrect: false },
    ],
  },
  {
    id: 'q-demo-5',
    prompt: 'من هو مؤلف رواية «مدن الملح»؟',
    explanation: 'عبد الرحمن منيف هو مؤلف الخماسية الروائية «مدن الملح».',
    category: 'أدب',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    timeLimit: 25,
    basePoints: 1000,
    options: [
      { id: 'a', text: 'عبد الرحمن منيف', isCorrect: true },
      { id: 'b', text: 'نجيب محفوظ', isCorrect: false },
      { id: 'c', text: 'غسان كنفاني', isCorrect: false },
      { id: 'd', text: 'الطيب صالح', isCorrect: false },
    ],
  },
];

// ─── Scoring ──────────────────────────────────────────────────────────────────

function streakMultiplier(streak: number): number {
  if (streak >= 5) return 1.5;
  if (streak >= 3) return 1.35;
  if (streak >= 2) return 1.2;
  if (streak >= 1) return 1.1;
  return 1.0;
}

function calcScore(
  basePoints: number,
  timeLimit: number,
  elapsedMs: number,
  streak: number,
): number {
  const elapsedS = elapsedMs / 1000;
  const base = Math.round((1 - elapsedS / (2 * timeLimit)) * basePoints);
  return Math.max(0, Math.round(base * streakMultiplier(streak)));
}

function rankPlayers(players: Map<string, PlayerState>): PlayerInfo[] {
  const sorted = [...players.values()].sort((a, b) => b.score - a.score);
  return sorted.map((p, i) => ({
    id: p.id,
    name: p.name,
    score: p.score,
    streak: p.streak,
    rank: i + 1,
  }));
}

function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ─── Service ──────────────────────────────────────────────────────────────────

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;

@Injectable()
export class GameService {
  private io!: IoServer;
  // In-memory question store — keyed by question ID
  private readonly questions = new Map<string, GameQuestion>(
    DEMO_QUESTIONS.map((q) => [q.id, q]),
  );

  constructor(private readonly redis: RedisService) {}

  setServer(io: IoServer) {
    this.io = io;
  }

  // ─── PIN generation ────────────────────────────────────────────────────────

  async generateUniquePin(): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt++) {
      const pin = generatePin();
      if (!(await this.redis.isPinActive(pin))) return pin;
    }
    throw new Error('Could not generate a unique PIN after 20 attempts');
  }

  // ─── Join ──────────────────────────────────────────────────────────────────

  async joinRoom(
    socketId: string,
    pin: string,
    playerName: string,
  ): Promise<
    | { ok: true; session: GameSession; players: PlayerInfo[] }
    | { ok: false; error: string }
  > {
    const session = await this.redis.loadSession(pin);
    if (!session) return { ok: false, error: 'ROOM_NOT_FOUND' };
    if (session.phase !== 'lobby')
      return { ok: false, error: 'GAME_ALREADY_STARTED' };

    const players = await this.redis.loadPlayers(pin);
    const player: PlayerState = {
      id: socketId,
      name: playerName.trim().slice(0, 30) || 'لاعب',
      score: 0,
      streak: 0,
      rank: players.size + 1,
      answeredCurrentQuestion: false,
    };
    players.set(socketId, player);
    await this.redis.savePlayers(pin, players);

    return { ok: true, session, players: rankPlayers(players) };
  }

  // ─── Create room (called by host) ─────────────────────────────────────────

  async createRoom(hostSocketId: string): Promise<GameSession> {
    const pin = await this.generateUniquePin();
    const questionIds = DEMO_QUESTIONS.map((q) => q.id);
    const gameId = `game-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const session: GameSession = {
      pin,
      hostId: hostSocketId,
      phase: 'lobby',
      questionIds,
      currentIndex: -1,
      currentQuestionId: null,
      questionStartedAt: null,
      gameId,
    };

    await this.redis.saveSession(session);
    await this.redis.addActivePin(pin);
    return session;
  }

  // ─── Start game ────────────────────────────────────────────────────────────

  async startGame(
    pin: string,
    hostSocketId: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const session = await this.redis.loadSession(pin);
    if (!session) return { ok: false, error: 'ROOM_NOT_FOUND' };
    if (session.hostId !== hostSocketId)
      return { ok: false, error: 'NOT_HOST' };
    if (session.phase !== 'lobby')
      return { ok: false, error: 'ALREADY_STARTED' };

    session.phase = 'starting';
    await this.redis.saveSession(session);

    // Broadcast countdown
    this.io.to(pin).emit('room:starting', { countdownSeconds: 3 });

    // After countdown → first question
    setTimeout(() => void this.advanceToNextQuestion(pin), 3500);
    return { ok: true };
  }

  // ─── Advance to next question ──────────────────────────────────────────────

  async advanceToNextQuestion(pin: string): Promise<void> {
    const session = await this.redis.loadSession(pin);
    if (!session) return;

    const nextIndex = session.currentIndex + 1;
    if (nextIndex >= session.questionIds.length) {
      await this.endGame(pin);
      return;
    }

    const questionId = session.questionIds[nextIndex];
    if (!questionId) {
      await this.endGame(pin);
      return;
    }

    const question = this.questions.get(questionId);
    if (!question) {
      await this.endGame(pin);
      return;
    }

    // Reset answeredCurrentQuestion for all players
    const players = await this.redis.loadPlayers(pin);
    for (const p of players.values()) {
      p.answeredCurrentQuestion = false;
    }
    await this.redis.savePlayers(pin, players);

    // Brief intro phase
    session.phase = 'question_intro';
    session.currentIndex = nextIndex;
    session.currentQuestionId = questionId;
    session.questionStartedAt = null;
    await this.redis.saveSession(session);

    this.io.to(pin).emit('question:intro', {
      index: nextIndex + 1,
      total: session.questionIds.length,
      category: question.category,
      difficulty: question.difficulty,
      basePoints: question.basePoints,
      timeLimit: question.timeLimit,
    });

    // After 2 seconds → live question with server-authoritative timer
    setTimeout(() => {
      void (async () => {
        const s = await this.redis.loadSession(pin);
        if (!s) return;
        const startsAt = Date.now() + 500; // small buffer
        s.phase = 'question_live';
        s.questionStartedAt = startsAt;
        await this.redis.saveSession(s);

        const payload = {
          questionId: question.id,
          index: nextIndex + 1,
          total: s.questionIds.length,
          prompt: question.prompt,
          category: question.category,
          difficulty: question.difficulty,
          type: question.type,
          // Strip isCorrect from client payload
          options: question.options.map((o) => ({ id: o.id, text: o.text })),
          timeLimit: question.timeLimit,
          basePoints: question.basePoints,
          startsAt,
        };
        this.io.to(pin).emit('question:show', payload);

        // Server-side timer — auto-reveal when time is up
        setTimeout(
          () => void this.revealQuestion(pin, questionId),
          question.timeLimit * 1000 + 1000,
        );
      })();
    }, 2000);
  }

  // ─── Submit answer ─────────────────────────────────────────────────────────

  async submitAnswer(
    socketId: string,
    pin: string,
    questionId: string,
    optionId: string,
  ): Promise<void> {
    const session = await this.redis.loadSession(pin);
    if (!session) return;
    if (session.phase !== 'question_live') return;
    if (session.currentQuestionId !== questionId) return; // stale answer

    const players = await this.redis.loadPlayers(pin);
    const player = players.get(socketId);
    if (!player) return;
    if (player.answeredCurrentQuestion) return; // already answered

    const serverTs = Date.now();
    player.answeredCurrentQuestion = true;
    await this.redis.savePlayers(pin, players);
    await this.redis.recordAnswer(
      pin,
      questionId,
      socketId,
      optionId,
      serverTs,
    );

    const question = this.questions.get(questionId);
    if (!question) return;

    const correctOption = question.options.find((o) => o.isCorrect);
    const correct = correctOption?.id === optionId;
    const elapsed = session.questionStartedAt
      ? serverTs - session.questionStartedAt
      : 0;
    const earned = correct
      ? calcScore(
          question.basePoints,
          question.timeLimit,
          elapsed,
          player.streak,
        )
      : 0;

    const newStreak = correct ? player.streak + 1 : 0;
    player.score += earned;
    player.streak = newStreak;
    await this.redis.savePlayers(pin, players);

    // ACK to the answering player only
    this.io.to(socketId).emit('answer:ack', {
      questionId,
      earned,
      correct,
      streak: newStreak,
    });

    // If everyone answered, reveal early
    const allAnswered = [...players.values()].every(
      (p) => p.answeredCurrentQuestion,
    );
    if (allAnswered) {
      await this.revealQuestion(pin, questionId);
    }
  }

  // ─── Reveal question ───────────────────────────────────────────────────────

  async revealQuestion(pin: string, questionId: string): Promise<void> {
    const session = await this.redis.loadSession(pin);
    if (!session) return;
    // Prevent double-reveal
    if (
      session.phase === 'question_reveal' ||
      session.phase === 'interim_leaderboard'
    )
      return;
    if (session.currentQuestionId !== questionId) return;

    session.phase = 'question_reveal';
    await this.redis.saveSession(session);

    const question = this.questions.get(questionId);
    if (!question) return;

    const correctOption = question.options.find((o) => o.isCorrect);
    const players = await this.redis.loadPlayers(pin);
    const leaderboard = rankPlayers(players);

    const payload: RevealPayload = {
      questionId,
      correctOptionId: correctOption?.id ?? '',
      explanation: question.explanation,
      leaderboard,
    };

    this.io.to(pin).emit('question:reveal', payload);

    // After 4 seconds → interim leaderboard or next question
    setTimeout(() => {
      void (async () => {
        const s = await this.redis.loadSession(pin);
        if (!s || s.phase !== 'question_reveal') return;

        const isLast = s.currentIndex >= s.questionIds.length - 1;
        if (isLast) {
          await this.endGame(pin);
        } else {
          s.phase = 'interim_leaderboard';
          await this.redis.saveSession(s);
          this.io.to(pin).emit('game:leaderboard', { leaderboard });
          setTimeout(() => void this.advanceToNextQuestion(pin), 4000);
        }
      })();
    }, 5000);
  }

  // ─── End game ─────────────────────────────────────────────────────────────

  async endGame(pin: string): Promise<void> {
    const session = await this.redis.loadSession(pin);
    if (!session) return;

    session.phase = 'ended';
    await this.redis.saveSession(session);
    await this.redis.removeActivePin(pin);

    const players = await this.redis.loadPlayers(pin);
    const leaderboard = rankPlayers(players);

    this.io.to(pin).emit('game:end', { leaderboard, gameId: session.gameId });

    // Clean up after 10 minutes
    setTimeout(
      () => {
        void Promise.all([
          this.redis.deleteSession(pin),
          this.redis.deletePlayers(pin),
        ]);
      },
      10 * 60 * 1000,
    );
  }

  // ─── Player disconnect ─────────────────────────────────────────────────────

  async playerLeft(socketId: string, pin: string): Promise<void> {
    const players = await this.redis.loadPlayers(pin);
    if (!players.has(socketId)) return;
    players.delete(socketId);
    await this.redis.savePlayers(pin, players);
    this.io.to(pin).emit('room:player_left', { playerId: socketId });
  }
}
