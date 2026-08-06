import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  PARALLEL_WORLD_BANK,
  REVERSE_TIME_BANK,
  SPECIAL_GAME_META,
  type SpecialGameMode,
} from '@tahaddi/domain';
import { Server } from 'socket.io';
import { RedisService } from '../game/redis.service.js';
import {
  resolveInfiltratorRound,
  selectInfiltratorId,
} from './infiltrator.logic.js';
import type {
  ClientToServerSpecialEvents,
  ServerToClientSpecialEvents,
  SpecialGamePlayer,
  SpecialGameRoom,
  SpecialRoomSnapshot,
} from './types.js';

type SpecialIoServer = Server<
  ClientToServerSpecialEvents,
  ServerToClientSpecialEvents
>;

type ActionResult =
  | { ok: true; room: SpecialGameRoom }
  | { ok: false; code: string; message: string };

function normalizePin(pin: string) {
  return pin.trim().replace(/\s+/g, '').toUpperCase();
}

function rankedPlayers(players: SpecialGamePlayer[]) {
  return [...players].sort(
    (a, b) => b.score - a.score || a.name.localeCompare(b.name, 'ar'),
  );
}

@Injectable()
export class SpecialGamesService {
  private io!: SpecialIoServer;

  constructor(private readonly redis: RedisService) {}

  setServer(io: SpecialIoServer) {
    this.io = io;
  }

  async executeWithRoomLock<T>(
    pin: string,
    action: () => Promise<T>,
  ): Promise<{ acquired: true; value: T } | { acquired: false }> {
    const normalizedPin = normalizePin(pin);
    const token = randomUUID();
    for (let attempt = 0; attempt < 80; attempt += 1) {
      if (await this.redis.acquireSpecialRoomLock(normalizedPin, token)) {
        try {
          return { acquired: true, value: await action() };
        } finally {
          await this.redis.releaseSpecialRoomLock(normalizedPin, token);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    return { acquired: false };
  }

  private async load(pin: string) {
    return this.redis.loadSpecialRoom<SpecialGameRoom>(normalizePin(pin));
  }

  private snapshot(room: SpecialGameRoom): SpecialRoomSnapshot {
    return {
      pin: room.pin,
      hostId: room.hostId,
      mode: room.mode,
      phase: room.phase,
      roundIndex: room.roundIndex,
      roundCount:
        room.mode === 'parallel-world' || room.mode === 'infiltrator'
          ? PARALLEL_WORLD_BANK.length
          : REVERSE_TIME_BANK.length,
      players: rankedPlayers(room.players),
      readyPlayerIds: room.readyPlayerIds ?? [],
    };
  }

  private emitState(room: SpecialGameRoom) {
    this.io.to(room.pin).emit('special:room:state', this.snapshot(room));
  }

  async createRoom(
    hostId: string,
    mode: SpecialGameMode,
  ): Promise<SpecialGameRoom> {
    const pin = await this.generatePin();
    const room: SpecialGameRoom = {
      pin,
      hostId,
      mode,
      phase: 'lobby',
      roundIndex: -1,
      players: [],
      readyPlayerIds: [],
      parallelAssignments: {},
      parallelAnswers: {},
      reverseSubmissions: [],
      reverseVoterIds: [],
      infiltratorId: null,
      infiltratorAssignments: {},
      infiltratorAnswers: {},
      infiltratorVotes: {},
      infiltratorMajorityGuess: null,
      createdAt: Date.now(),
    };
    await this.redis.saveSpecialRoom(pin, room);
    await this.redis.addActivePin(pin);
    return room;
  }

  private async generatePin() {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const pin = String(Math.floor(100000 + Math.random() * 900000));
      if (!(await this.redis.isPinActive(pin))) return pin;
    }
    throw new Error('تعذّر إنشاء رمز غرفة فريد. أعد المحاولة.');
  }

  async joinRoom(
    socketId: string,
    pinValue: string,
    playerNameValue: string,
  ): Promise<ActionResult> {
    const pin = normalizePin(pinValue);
    const room = await this.load(pin);
    if (!room) {
      return {
        ok: false,
        code: 'ROOM_NOT_FOUND',
        message: 'لم نجد غرفة مفتوحة بهذا الرمز.',
      };
    }
    if (room.phase !== 'lobby') {
      return {
        ok: false,
        code: 'GAME_STARTED',
        message: 'بدأت هذه الجولة بالفعل.',
      };
    }

    const name = playerNameValue.trim().replace(/\s+/g, ' ').slice(0, 30);
    if (name.length < 2) {
      return {
        ok: false,
        code: 'INVALID_NAME',
        message: 'اكتب اسمًا من حرفين على الأقل.',
      };
    }
    if (
      room.players.some(
        (player) =>
          player.name.toLocaleLowerCase('ar') === name.toLocaleLowerCase('ar'),
      )
    ) {
      return {
        ok: false,
        code: 'NAME_TAKEN',
        message: 'هذا الاسم مستخدم في الغرفة.',
      };
    }

    room.players.push({ id: socketId, name, score: 0 });
    await this.redis.saveSpecialRoom(pin, room);
    return { ok: true, room };
  }

  async leaveRoom(
    socketId: string,
    pinValue: string,
  ): Promise<ActionResult> {
    const pin = normalizePin(pinValue);
    const room = await this.load(pin);
    if (!room || room.phase !== 'lobby') {
      return { ok: false, code: 'LEAVE_FAILED', message: 'تعذّرت المغادرة.' };
    }
    room.players = room.players.filter((p) => p.id !== socketId);
    room.readyPlayerIds = (room.readyPlayerIds ?? []).filter(
      (id) => id !== socketId,
    );
    if (room.players.length === 0) {
      await this.redis.removeActivePin(pin);
    } else {
      await this.redis.saveSpecialRoom(pin, room);
    }
    return { ok: true, room };
  }

  async playerReady(
    socketId: string,
    pinValue: string,
  ): Promise<ActionResult> {
    const pin = normalizePin(pinValue);
    const room = await this.load(pin);
    if (!room) {
      return {
        ok: false,
        code: 'ROOM_NOT_FOUND',
        message: 'الغرفة غير موجودة.',
      };
    }
    if (room.phase !== 'lobby') {
      return {
        ok: false,
        code: 'GAME_STARTED',
        message: 'اللعبة بدأت بالفعل.',
      };
    }
    if (!room.players.some((p) => p.id === socketId)) {
      return {
        ok: false,
        code: 'NOT_PLAYER',
        message: 'انضم إلى الغرفة أولًا.',
      };
    }
    if (!(room.readyPlayerIds ?? []).includes(socketId)) {
      room.readyPlayerIds = [...(room.readyPlayerIds ?? []), socketId];
      await this.redis.saveSpecialRoom(pin, room);
    }
    return { ok: true, room };
  }

  async startGame(pin: string, hostId: string): Promise<ActionResult> {
    const room = await this.load(pin);
    if (!room) {
      return {
        ok: false,
        code: 'ROOM_NOT_FOUND',
        message: 'الغرفة غير موجودة.',
      };
    }
    if (room.hostId !== hostId) {
      return {
        ok: false,
        code: 'NOT_HOST',
        message: 'المضيف وحده يبدأ اللعبة.',
      };
    }
    const minimumPlayers = SPECIAL_GAME_META[room.mode].minimumPlayers;
    if (room.players.length < minimumPlayers) {
      return {
        ok: false,
        code: 'NOT_ENOUGH_PLAYERS',
        message: `تحتاج اللعبة إلى ${minimumPlayers.toLocaleString('ar-SA')} لاعبين على الأقل.`,
      };
    }
    if (room.phase !== 'lobby') {
      return {
        ok: false,
        code: 'ALREADY_STARTED',
        message: 'اللعبة بدأت بالفعل.',
      };
    }

    return this.advanceRound(room, hostId);
  }

  async nextRound(pin: string, hostId: string): Promise<ActionResult> {
    const room = await this.load(pin);
    if (!room) {
      return {
        ok: false,
        code: 'ROOM_NOT_FOUND',
        message: 'الغرفة غير موجودة.',
      };
    }
    if (room.hostId !== hostId) {
      return {
        ok: false,
        code: 'NOT_HOST',
        message: 'المضيف وحده ينقل الجولة.',
      };
    }
    const validPhase =
      room.phase === 'parallel-reveal' ||
      room.phase === 'reverse-results' ||
      room.phase === 'infiltrator-reveal';
    if (!validPhase) {
      return {
        ok: false,
        code: 'ROUND_OPEN',
        message: 'اكشف نتيجة الجولة أولًا.',
      };
    }
    return this.advanceRound(room, hostId);
  }

  private async advanceRound(
    room: SpecialGameRoom,
    hostId: string,
  ): Promise<ActionResult> {
    if (room.hostId !== hostId) {
      return {
        ok: false,
        code: 'NOT_HOST',
        message: 'المضيف وحده ينقل الجولة.',
      };
    }

    const nextIndex = room.roundIndex + 1;
    const roundCount =
      room.mode === 'parallel-world' || room.mode === 'infiltrator'
        ? PARALLEL_WORLD_BANK.length
        : REVERSE_TIME_BANK.length;
    if (nextIndex >= roundCount) {
      room.phase = 'finished';
      await this.redis.saveSpecialRoom(room.pin, room);
      await this.redis.removeActivePin(room.pin);
      this.emitState(room);
      this.io.to(room.pin).emit('special:game:end', {
        mode: room.mode,
        players: rankedPlayers(room.players),
        durationMs: room.gameStartedAt ? Date.now() - room.gameStartedAt : 0,
      });
      return { ok: true, room };
    }

    if (nextIndex === 0) {
      room.gameStartedAt = Date.now();
    }
    room.roundIndex = nextIndex;
    room.parallelAssignments = {};
    room.parallelAnswers = {};
    room.reverseSubmissions = [];
    room.reverseVoterIds = [];
    room.infiltratorId = null;
    room.infiltratorAssignments = {};
    room.infiltratorAnswers = {};
    room.infiltratorVotes = {};
    room.infiltratorMajorityGuess = null;

    if (room.mode === 'parallel-world') {
      room.phase = 'parallel-answering';
      const round = PARALLEL_WORLD_BANK[nextIndex];
      if (!round) {
        return {
          ok: false,
          code: 'ROUND_MISSING',
          message: 'تعذّر تحميل الجولة.',
        };
      }
      room.players.forEach((player, index) => {
        room.parallelAssignments[player.id] = index % round.variants.length;
      });
      await this.redis.saveSpecialRoom(room.pin, room);
      this.emitState(room);
      const startsAt = Date.now() + 500;
      for (const player of room.players) {
        const variantIndex = room.parallelAssignments[player.id] ?? 0;
        const variant = round.variants[variantIndex];
        if (!variant) continue;
        this.io.to(player.id).emit('parallel:round', {
          roundId: round.id,
          roundNumber: nextIndex + 1,
          roundCount,
          face: variant.face,
          faceLabel: variant.faceLabel,
          prompt: variant.prompt,
          options: variant.options,
          startsAt,
          timeLimit: SPECIAL_GAME_META[room.mode].roundSeconds,
        });
      }
    } else if (room.mode === 'reverse-time') {
      room.phase = 'reverse-writing';
      const round = REVERSE_TIME_BANK[nextIndex];
      if (!round) {
        return {
          ok: false,
          code: 'ROUND_MISSING',
          message: 'تعذّر تحميل الجولة.',
        };
      }
      await this.redis.saveSpecialRoom(room.pin, room);
      this.emitState(room);
      this.io.to(room.pin).emit('reverse:round', {
        roundId: round.id,
        roundNumber: nextIndex + 1,
        roundCount,
        answer: round.answer,
        category: round.category,
        hint: round.hint,
        startsAt: Date.now() + 500,
        timeLimit: SPECIAL_GAME_META[room.mode].roundSeconds,
      });
    } else {
      room.phase = 'infiltrator-answering';
      const majorityRound = PARALLEL_WORLD_BANK[nextIndex];
      const infiltratorBankIndex = (nextIndex + 1) % PARALLEL_WORLD_BANK.length;
      const infiltratorRound = PARALLEL_WORLD_BANK[infiltratorBankIndex];
      if (!majorityRound || !infiltratorRound) {
        return {
          ok: false,
          code: 'ROUND_MISSING',
          message: 'تعذّر تحميل الجولة.',
        };
      }

      room.infiltratorId = selectInfiltratorId(room.players);
      const majorityVariantIndex = nextIndex % majorityRound.variants.length;
      const infiltratorVariantIndex =
        (nextIndex + 1) % infiltratorRound.variants.length;
      for (const player of room.players) {
        room.infiltratorAssignments[player.id] = {
          bankIndex:
            player.id === room.infiltratorId ? infiltratorBankIndex : nextIndex,
          variantIndex:
            player.id === room.infiltratorId
              ? infiltratorVariantIndex
              : majorityVariantIndex,
        };
      }
      await this.redis.saveSpecialRoom(room.pin, room);
      this.emitState(room);
      const startsAt = Date.now() + 500;
      for (const player of room.players) {
        const assignment = room.infiltratorAssignments[player.id];
        const assignedRound = assignment
          ? PARALLEL_WORLD_BANK[assignment.bankIndex]
          : undefined;
        const variant = assignedRound?.variants[assignment?.variantIndex ?? 0];
        if (!assignedRound || !variant) continue;
        this.io.to(player.id).emit('infiltrator:round', {
          roundId: majorityRound.id,
          roundNumber: nextIndex + 1,
          roundCount,
          prompt: variant.prompt,
          options: variant.options,
          isInfiltrator: player.id === room.infiltratorId,
          startsAt,
          timeLimit: SPECIAL_GAME_META[room.mode].roundSeconds,
        });
      }
    }

    return { ok: true, room };
  }

  async submitParallelAnswer(
    socketId: string,
    pin: string,
    roundId: string,
    answer: string,
  ): Promise<ActionResult> {
    const room = await this.load(pin);
    const round = room ? PARALLEL_WORLD_BANK[room.roundIndex] : undefined;
    if (!room || !round || room.mode !== 'parallel-world') {
      return {
        ok: false,
        code: 'ROUND_NOT_FOUND',
        message: 'الجولة غير متاحة.',
      };
    }
    if (room.phase !== 'parallel-answering' || round.id !== roundId) {
      return {
        ok: false,
        code: 'ROUND_CLOSED',
        message: 'أُغلقت الإجابات لهذه الجولة.',
      };
    }
    if (!room.players.some((player) => player.id === socketId)) {
      return {
        ok: false,
        code: 'NOT_PLAYER',
        message: 'انضم إلى الغرفة قبل الإجابة.',
      };
    }
    if (room.parallelAnswers[socketId]) {
      return {
        ok: false,
        code: 'ALREADY_ANSWERED',
        message: 'سُجلت إجابتك بالفعل.',
      };
    }

    room.parallelAnswers[socketId] = answer;
    const correct = answer === round.answer;
    const player = room.players.find((candidate) => candidate.id === socketId);
    const earned = correct ? 10 : 0;
    if (player) player.score += earned;
    await this.redis.saveSpecialRoom(room.pin, room);
    this.io.to(socketId).emit('parallel:answer:ack', {
      correct,
      earned,
      selectedAnswer: answer,
    });
    this.emitState(room);

    if (Object.keys(room.parallelAnswers).length === room.players.length) {
      await this.revealParallel(room.pin, room.hostId);
    }
    return { ok: true, room };
  }

  async revealParallel(pin: string, hostId: string): Promise<ActionResult> {
    const room = await this.load(pin);
    const round = room ? PARALLEL_WORLD_BANK[room.roundIndex] : undefined;
    if (!room || !round || room.mode !== 'parallel-world') {
      return {
        ok: false,
        code: 'ROUND_NOT_FOUND',
        message: 'الجولة غير متاحة.',
      };
    }
    if (room.hostId !== hostId) {
      return {
        ok: false,
        code: 'NOT_HOST',
        message: 'المضيف وحده يكشف العوالم.',
      };
    }
    if (room.phase !== 'parallel-answering') {
      return {
        ok: false,
        code: 'ROUND_CLOSED',
        message: 'كُشفت الجولة بالفعل.',
      };
    }

    room.phase = 'parallel-reveal';
    await this.redis.saveSpecialRoom(room.pin, room);
    this.emitState(room);
    this.io.to(room.pin).emit('parallel:reveal', {
      answer: round.answer,
      reveal: round.reveal,
      results: room.players.map((player) => {
        const variant =
          round.variants[room.parallelAssignments[player.id] ?? 0];
        const selectedAnswer = room.parallelAnswers[player.id] ?? null;
        return {
          playerId: player.id,
          playerName: player.name,
          faceLabel: variant?.faceLabel ?? 'عالم',
          prompt: variant?.prompt ?? '',
          selectedAnswer,
          correct: selectedAnswer === round.answer,
        };
      }),
    });
    return { ok: true, room };
  }

  async submitReverseQuestion(
    socketId: string,
    pin: string,
    roundId: string,
    questionValue: string,
  ): Promise<ActionResult> {
    const room = await this.load(pin);
    const round = room ? REVERSE_TIME_BANK[room.roundIndex] : undefined;
    if (!room || !round || room.mode !== 'reverse-time') {
      return {
        ok: false,
        code: 'ROUND_NOT_FOUND',
        message: 'الجولة غير متاحة.',
      };
    }
    if (room.phase !== 'reverse-writing' || round.id !== roundId) {
      return {
        ok: false,
        code: 'ROUND_CLOSED',
        message: 'أُغلق استقبال الأسئلة.',
      };
    }
    const player = room.players.find((candidate) => candidate.id === socketId);
    if (!player) {
      return {
        ok: false,
        code: 'NOT_PLAYER',
        message: 'انضم إلى الغرفة قبل المشاركة.',
      };
    }
    if (
      room.reverseSubmissions.some(
        (submission) => submission.playerId === socketId,
      )
    ) {
      return {
        ok: false,
        code: 'ALREADY_SUBMITTED',
        message: 'سُجل سؤالك بالفعل.',
      };
    }
    const question = questionValue.trim().replace(/\s+/g, ' ').slice(0, 180);
    if (question.length < 8) {
      return {
        ok: false,
        code: 'QUESTION_SHORT',
        message: 'اكتب سؤالًا من 8 أحرف على الأقل.',
      };
    }

    room.reverseSubmissions.push({
      id: `submission-${room.roundIndex}-${socketId}`,
      playerId: socketId,
      playerName: player.name,
      text: question,
      voterIds: [],
    });
    await this.redis.saveSpecialRoom(room.pin, room);
    this.io.to(socketId).emit('reverse:question:ack', { question });
    this.emitState(room);

    if (room.reverseSubmissions.length === room.players.length) {
      await this.startReverseVoting(room.pin, room.hostId);
    }
    return { ok: true, room };
  }

  async startReverseVoting(pin: string, hostId: string): Promise<ActionResult> {
    const room = await this.load(pin);
    const round = room ? REVERSE_TIME_BANK[room.roundIndex] : undefined;
    if (!room || !round || room.mode !== 'reverse-time') {
      return {
        ok: false,
        code: 'ROUND_NOT_FOUND',
        message: 'الجولة غير متاحة.',
      };
    }
    if (room.hostId !== hostId) {
      return {
        ok: false,
        code: 'NOT_HOST',
        message: 'المضيف وحده يبدأ التصويت.',
      };
    }
    if (room.phase !== 'reverse-writing') {
      return {
        ok: false,
        code: 'VOTING_STARTED',
        message: 'بدأ التصويت بالفعل.',
      };
    }
    if (room.reverseSubmissions.length < 2) {
      return {
        ok: false,
        code: 'NOT_ENOUGH_SUBMISSIONS',
        message: 'نحتاج سؤالين على الأقل للتصويت.',
      };
    }

    room.phase = 'reverse-voting';
    await this.redis.saveSpecialRoom(room.pin, room);
    this.emitState(room);
    for (const player of room.players) {
      this.io.to(player.id).emit('reverse:voting', {
        answer: round.answer,
        submissions: room.reverseSubmissions.map((submission) => ({
          id: submission.id,
          text: submission.text,
          isOwn: submission.playerId === player.id,
        })),
      });
    }
    return { ok: true, room };
  }

  async voteReverse(
    socketId: string,
    pin: string,
    submissionId: string,
  ): Promise<ActionResult> {
    const room = await this.load(pin);
    if (
      !room ||
      room.mode !== 'reverse-time' ||
      room.phase !== 'reverse-voting'
    ) {
      return {
        ok: false,
        code: 'VOTING_CLOSED',
        message: 'التصويت غير مفتوح الآن.',
      };
    }
    if (!room.players.some((player) => player.id === socketId)) {
      return {
        ok: false,
        code: 'NOT_PLAYER',
        message: 'انضم إلى الغرفة قبل التصويت.',
      };
    }
    if (room.reverseVoterIds.includes(socketId)) {
      return { ok: false, code: 'ALREADY_VOTED', message: 'سُجل صوتك بالفعل.' };
    }
    const submission = room.reverseSubmissions.find(
      (candidate) => candidate.id === submissionId,
    );
    if (!submission) {
      return {
        ok: false,
        code: 'SUBMISSION_NOT_FOUND',
        message: 'السؤال المختار غير موجود.',
      };
    }
    if (submission.playerId === socketId) {
      return { ok: false, code: 'SELF_VOTE', message: 'اختر سؤال لاعب آخر.' };
    }

    submission.voterIds.push(socketId);
    room.reverseVoterIds.push(socketId);
    await this.redis.saveSpecialRoom(room.pin, room);
    this.io.to(socketId).emit('reverse:vote:ack', { submissionId });
    this.emitState(room);

    if (room.reverseVoterIds.length === room.players.length) {
      await this.revealReverse(room.pin, room.hostId);
    }
    return { ok: true, room };
  }

  async revealReverse(pin: string, hostId: string): Promise<ActionResult> {
    const room = await this.load(pin);
    const round = room ? REVERSE_TIME_BANK[room.roundIndex] : undefined;
    if (!room || !round || room.mode !== 'reverse-time') {
      return {
        ok: false,
        code: 'ROUND_NOT_FOUND',
        message: 'الجولة غير متاحة.',
      };
    }
    if (room.hostId !== hostId) {
      return {
        ok: false,
        code: 'NOT_HOST',
        message: 'المضيف وحده يكشف النتيجة.',
      };
    }
    if (room.phase !== 'reverse-voting') {
      return {
        ok: false,
        code: 'VOTING_CLOSED',
        message: 'ابدأ التصويت قبل كشف النتيجة.',
      };
    }

    for (const submission of room.reverseSubmissions) {
      const player = room.players.find(
        (candidate) => candidate.id === submission.playerId,
      );
      if (player) player.score += submission.voterIds.length * 10;
    }
    room.phase = 'reverse-results';
    await this.redis.saveSpecialRoom(room.pin, room);
    this.emitState(room);
    this.io.to(room.pin).emit('reverse:results', {
      answer: round.answer,
      results: [...room.reverseSubmissions]
        .sort((a, b) => b.voterIds.length - a.voterIds.length)
        .map((submission) => ({
          id: submission.id,
          playerName: submission.playerName,
          text: submission.text,
          votes: submission.voterIds.length,
        })),
    });
    return { ok: true, room };
  }

  async submitInfiltratorAnswer(
    socketId: string,
    pin: string,
    roundId: string,
    answer: string,
  ): Promise<ActionResult> {
    const room = await this.load(pin);
    const majorityRound = room
      ? PARALLEL_WORLD_BANK[room.roundIndex]
      : undefined;
    if (!room || !majorityRound || room.mode !== 'infiltrator') {
      return {
        ok: false,
        code: 'ROUND_NOT_FOUND',
        message: 'الجولة غير متاحة.',
      };
    }
    if (
      room.phase !== 'infiltrator-answering' ||
      majorityRound.id !== roundId
    ) {
      return {
        ok: false,
        code: 'ROUND_CLOSED',
        message: 'أُغلقت الإجابات لهذه الجولة.',
      };
    }
    const assignment = room.infiltratorAssignments[socketId];
    const assignedRound = assignment
      ? PARALLEL_WORLD_BANK[assignment.bankIndex]
      : undefined;
    const variant = assignedRound?.variants[assignment?.variantIndex ?? 0];
    if (!assignment || !variant) {
      return {
        ok: false,
        code: 'NOT_PLAYER',
        message: 'انضم إلى الغرفة قبل الإجابة.',
      };
    }
    if (room.infiltratorAnswers[socketId]) {
      return {
        ok: false,
        code: 'ALREADY_ANSWERED',
        message: 'سُجلت إجابتك بالفعل.',
      };
    }
    if (!variant.options.includes(answer)) {
      return {
        ok: false,
        code: 'INVALID_ANSWER',
        message: 'اختر إجابة من الخيارات المعروضة.',
      };
    }

    room.infiltratorAnswers[socketId] = answer;
    await this.redis.saveSpecialRoom(room.pin, room);
    this.io.to(socketId).emit('infiltrator:answer:ack', {
      selectedAnswer: answer,
    });
    this.emitState(room);
    if (Object.keys(room.infiltratorAnswers).length === room.players.length) {
      await this.startInfiltratorVoting(room.pin, room.hostId);
    }
    return { ok: true, room };
  }

  async startInfiltratorVoting(
    pin: string,
    hostId: string,
  ): Promise<ActionResult> {
    const room = await this.load(pin);
    const majorityRound = room
      ? PARALLEL_WORLD_BANK[room.roundIndex]
      : undefined;
    if (!room || !majorityRound || room.mode !== 'infiltrator') {
      return {
        ok: false,
        code: 'ROUND_NOT_FOUND',
        message: 'الجولة غير متاحة.',
      };
    }
    if (room.hostId !== hostId) {
      return {
        ok: false,
        code: 'NOT_HOST',
        message: 'المضيف وحده يبدأ التصويت.',
      };
    }
    if (room.phase !== 'infiltrator-answering') {
      return {
        ok: false,
        code: 'VOTING_STARTED',
        message: 'بدأ التصويت بالفعل.',
      };
    }
    if (Object.keys(room.infiltratorAnswers).length !== room.players.length) {
      return {
        ok: false,
        code: 'ANSWERS_PENDING',
        message: 'انتظر إجابة جميع اللاعبين قبل بدء التصويت.',
      };
    }

    room.phase = 'infiltrator-voting';
    await this.redis.saveSpecialRoom(room.pin, room);
    this.emitState(room);
    for (const player of room.players) {
      this.io.to(player.id).emit('infiltrator:voting', {
        answers: room.players
          .filter((candidate) => room.infiltratorAnswers[candidate.id])
          .map((candidate) => ({
            playerId: candidate.id,
            answer: room.infiltratorAnswers[candidate.id] ?? '',
            isOwn: candidate.id === player.id,
          })),
        isInfiltrator: player.id === room.infiltratorId,
        majorityOptions:
          player.id === room.infiltratorId
            ? majorityRound.variants.map((variant) => variant.prompt)
            : [],
      });
    }
    return { ok: true, room };
  }

  async voteInfiltrator(
    socketId: string,
    pin: string,
    playerId: string,
  ): Promise<ActionResult> {
    const room = await this.load(pin);
    if (
      !room ||
      room.mode !== 'infiltrator' ||
      room.phase !== 'infiltrator-voting'
    ) {
      return {
        ok: false,
        code: 'VOTING_CLOSED',
        message: 'التصويت غير مفتوح الآن.',
      };
    }
    if (!room.players.some((player) => player.id === socketId)) {
      return {
        ok: false,
        code: 'NOT_PLAYER',
        message: 'انضم إلى الغرفة قبل التصويت.',
      };
    }
    if (!room.players.some((player) => player.id === playerId)) {
      return {
        ok: false,
        code: 'PLAYER_NOT_FOUND',
        message: 'بطاقة الإجابة المختارة غير موجودة.',
      };
    }
    if (socketId === playerId) {
      return {
        ok: false,
        code: 'SELF_VOTE',
        message: 'اختر إجابة لاعب آخر.',
      };
    }
    if (room.infiltratorVotes[socketId]) {
      return {
        ok: false,
        code: 'ALREADY_VOTED',
        message: 'سُجل صوتك بالفعل.',
      };
    }

    room.infiltratorVotes[socketId] = playerId;
    await this.redis.saveSpecialRoom(room.pin, room);
    this.io.to(socketId).emit('infiltrator:vote:ack', { playerId });
    this.emitState(room);
    await this.maybeRevealInfiltrator(room);
    return { ok: true, room };
  }

  async guessInfiltratorMajority(
    socketId: string,
    pin: string,
    question: string,
  ): Promise<ActionResult> {
    const room = await this.load(pin);
    const majorityRound = room
      ? PARALLEL_WORLD_BANK[room.roundIndex]
      : undefined;
    const majorityAssignment = room?.players
      .filter((player) => player.id !== room.infiltratorId)
      .map((player) => room.infiltratorAssignments[player.id])
      .find(Boolean);
    const majorityVariant =
      majorityRound?.variants[majorityAssignment?.variantIndex ?? 0];
    if (
      !room ||
      !majorityRound ||
      room.mode !== 'infiltrator' ||
      room.phase !== 'infiltrator-voting'
    ) {
      return {
        ok: false,
        code: 'GUESS_CLOSED',
        message: 'تخمين سؤال الأغلبية غير متاح الآن.',
      };
    }
    if (socketId !== room.infiltratorId) {
      return {
        ok: false,
        code: 'NOT_INFILTRATOR',
        message: 'هذا التخمين متاح للدخيل فقط.',
      };
    }
    if (room.infiltratorMajorityGuess) {
      return {
        ok: false,
        code: 'ALREADY_GUESSED',
        message: 'سُجل تخمينك بالفعل.',
      };
    }
    if (
      !majorityVariant ||
      !majorityRound.variants.some((variant) => variant.prompt === question)
    ) {
      return {
        ok: false,
        code: 'INVALID_GUESS',
        message: 'اختر تخمينًا من الخيارات المعروضة.',
      };
    }

    room.infiltratorMajorityGuess = question;
    await this.redis.saveSpecialRoom(room.pin, room);
    this.io.to(socketId).emit('infiltrator:majority:guess:ack', { question });
    this.emitState(room);
    await this.maybeRevealInfiltrator(room);
    return { ok: true, room };
  }

  private async maybeRevealInfiltrator(room: SpecialGameRoom) {
    if (
      Object.keys(room.infiltratorVotes).length === room.players.length &&
      room.infiltratorMajorityGuess
    ) {
      await this.revealInfiltrator(room.pin, room.hostId);
    }
  }

  async revealInfiltrator(pin: string, hostId: string): Promise<ActionResult> {
    const room = await this.load(pin);
    const majorityRound = room
      ? PARALLEL_WORLD_BANK[room.roundIndex]
      : undefined;
    if (
      !room ||
      !majorityRound ||
      room.mode !== 'infiltrator' ||
      !room.infiltratorId
    ) {
      return {
        ok: false,
        code: 'ROUND_NOT_FOUND',
        message: 'الجولة غير متاحة.',
      };
    }
    if (room.hostId !== hostId) {
      return {
        ok: false,
        code: 'NOT_HOST',
        message: 'المضيف وحده يكشف الدخيل.',
      };
    }
    if (room.phase !== 'infiltrator-voting') {
      return {
        ok: false,
        code: 'VOTING_CLOSED',
        message: 'ابدأ التصويت قبل كشف النتيجة.',
      };
    }
    if (Object.keys(room.infiltratorVotes).length !== room.players.length) {
      return {
        ok: false,
        code: 'VOTES_PENDING',
        message: 'انتظر تصويت جميع اللاعبين قبل كشف النتيجة.',
      };
    }

    const majorityAssignment = room.players
      .filter((player) => player.id !== room.infiltratorId)
      .map((player) => room.infiltratorAssignments[player.id])
      .find(Boolean);
    const majorityVariant =
      majorityRound.variants[majorityAssignment?.variantIndex ?? 0];
    const outcome = resolveInfiltratorRound({
      players: room.players,
      infiltratorId: room.infiltratorId,
      votes: room.infiltratorVotes,
      majorityGuess: room.infiltratorMajorityGuess,
      majorityQuestion: majorityVariant?.prompt ?? '',
    });
    for (const player of room.players) {
      player.score += outcome.scoreDeltas[player.id] ?? 0;
    }
    const infiltrator = room.players.find(
      (player) => player.id === room.infiltratorId,
    );
    room.phase = 'infiltrator-reveal';
    await this.redis.saveSpecialRoom(room.pin, room);
    this.emitState(room);
    this.io.to(room.pin).emit('infiltrator:reveal', {
      infiltratorId: room.infiltratorId,
      infiltratorName: infiltrator?.name ?? 'الدخيل',
      caught: outcome.caught,
      survived: outcome.survived,
      guessedMajority: outcome.guessedMajority,
      infiltratorWon: outcome.infiltratorWon,
      majorityQuestion: majorityVariant?.prompt ?? '',
      answers: room.players.map((player) => ({
        playerId: player.id,
        playerName: player.name,
        answer: room.infiltratorAnswers[player.id] ?? 'لم يجب',
      })),
      voteCounts: outcome.voteCounts,
    });
    return { ok: true, room };
  }

  async playerLeft(socketId: string, pin: string) {
    const room = await this.load(pin);
    if (!room) return;
    if (room.hostId === socketId) {
      this.io.to(room.pin).emit('special:error', {
        code: 'HOST_LEFT',
        message: 'غادر المضيف وانتهت الغرفة. أنشئ غرفة جديدة للمتابعة.',
      });
      await this.redis.deleteSpecialRoom(room.pin);
      await this.redis.removeActivePin(room.pin);
      return;
    }

    const wasInfiltrator = room.infiltratorId === socketId;
    room.players = room.players.filter((player) => player.id !== socketId);
    room.readyPlayerIds = (room.readyPlayerIds ?? []).filter(
      (id) => id !== socketId,
    );
    room.reverseSubmissions = room.reverseSubmissions.filter(
      (submission) => submission.playerId !== socketId,
    );
    for (const submission of room.reverseSubmissions) {
      submission.voterIds = submission.voterIds.filter(
        (voterId) => voterId !== socketId,
      );
    }
    room.reverseVoterIds = room.reverseVoterIds.filter((id) => id !== socketId);
    delete room.parallelAssignments[socketId];
    delete room.parallelAnswers[socketId];
    delete room.infiltratorAssignments[socketId];
    delete room.infiltratorAnswers[socketId];
    delete room.infiltratorVotes[socketId];
    for (const [voterId, targetId] of Object.entries(room.infiltratorVotes)) {
      if (targetId === socketId) delete room.infiltratorVotes[voterId];
    }

    const activeRound = room.phase !== 'lobby' && room.phase !== 'finished';
    const belowMinimum =
      room.players.length < SPECIAL_GAME_META[room.mode].minimumPlayers;
    if (activeRound && (belowMinimum || wasInfiltrator)) {
      room.phase = 'lobby';
      room.roundIndex = Math.max(-1, room.roundIndex - 1);
      room.parallelAssignments = {};
      room.parallelAnswers = {};
      room.reverseSubmissions = [];
      room.reverseVoterIds = [];
      room.infiltratorId = null;
      room.infiltratorAssignments = {};
      room.infiltratorAnswers = {};
      room.infiltratorVotes = {};
      room.infiltratorMajorityGuess = null;
      this.io.to(room.pin).emit('special:error', {
        code: 'ROUND_RESET',
        message: 'غادر لاعب أساسي، فأُعيدت الجولة إلى الانتظار لحماية النتيجة.',
      });
    }
    await this.redis.saveSpecialRoom(room.pin, room);
    this.emitState(room);
  }
}
