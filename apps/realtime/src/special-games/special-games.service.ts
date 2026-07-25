import { Injectable } from '@nestjs/common';
import {
  PARALLEL_WORLD_BANK,
  REVERSE_TIME_BANK,
  SPECIAL_GAME_META,
  type SpecialGameMode,
} from '@tahaddi/domain';
import { Server } from 'socket.io';
import { RedisService } from '../game/redis.service.js';
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
        room.mode === 'parallel-world'
          ? PARALLEL_WORLD_BANK.length
          : REVERSE_TIME_BANK.length,
      players: rankedPlayers(room.players),
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
      parallelAssignments: {},
      parallelAnswers: {},
      reverseSubmissions: [],
      reverseVoterIds: [],
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
      room.phase === 'parallel-reveal' || room.phase === 'reverse-results';
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
      room.mode === 'parallel-world'
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
      });
      return { ok: true, room };
    }

    room.roundIndex = nextIndex;
    room.parallelAssignments = {};
    room.parallelAnswers = {};
    room.reverseSubmissions = [];
    room.reverseVoterIds = [];

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
    } else {
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

  async playerLeft(socketId: string, pin: string) {
    const room = await this.load(pin);
    if (!room) return;
    room.players = room.players.filter((player) => player.id !== socketId);
    room.reverseSubmissions = room.reverseSubmissions.filter(
      (submission) => submission.playerId !== socketId,
    );
    room.reverseVoterIds = room.reverseVoterIds.filter((id) => id !== socketId);
    delete room.parallelAssignments[socketId];
    delete room.parallelAnswers[socketId];
    await this.redis.saveSpecialRoom(room.pin, room);
    this.emitState(room);
  }
}
