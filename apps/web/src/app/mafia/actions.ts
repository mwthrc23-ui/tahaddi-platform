'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getPrismaClient, hasDatabaseUrl } from '@/lib/auth/prisma';
import { requireActiveUser } from '@/lib/auth/session';
import { advanceMafiaGame } from '@/lib/mafia/engine';
import { buildMafiaRoles, resolveMafiaChatChannel, shuffled } from '@/lib/mafia/rules';
import { generateUniqueActivityRoomCode } from '@/lib/quiz/room-code';

function integerField(formData: FormData, key: string, fallback: number) {
  const value = Number(formData.get(key));
  return Number.isInteger(value) ? value : fallback;
}

function requireMafiaDatabase() {
  if (!hasDatabaseUrl()) throw new Error('DATABASE_URL is required for Mafia rooms.');
}

function refreshMafia(gameId: string) {
  revalidatePath('/mafia');
  revalidatePath(`/mafia/${gameId}`);
  revalidatePath(`/mafia/${gameId}/play`);
}

export async function createMafiaGame(formData: FormData) {
  requireMafiaDatabase();
  const user = await requireActiveUser('/mafia');
  const prisma = getPrismaClient();
  const maxPlayers = Math.min(30, Math.max(5, integerField(formData, 'maxPlayers', 12)));
  const killerCount = Math.min(3, Math.max(1, integerField(formData, 'killerCount', 1)));
  const roomCode = await generateUniqueActivityRoomCode(prisma);
  const game = await prisma.mafiaGame.create({
    data: {
      hostId: user.id,
      roomCode,
      maxPlayers,
      killerCount,
      autoMode: formData.get('autoMode') !== 'off',
      chatEnabled: formData.get('chatEnabled') !== 'off',
      slowModeSeconds: Math.min(30, Math.max(0, integerField(formData, 'slowModeSeconds', 2))),
      daySeconds: Math.min(300, Math.max(30, integerField(formData, 'daySeconds', 90))),
      nightSeconds: Math.min(180, Math.max(20, integerField(formData, 'nightSeconds', 45))),
      votingSeconds: Math.min(120, Math.max(20, integerField(formData, 'votingSeconds', 45))),
    },
    select: { id: true },
  });
  redirect(`/mafia/${game.id}`);
}

export async function startMafiaGame(formData: FormData) {
  requireMafiaDatabase();
  const gameId = String(formData.get('gameId') ?? '');
  const user = await requireActiveUser(`/mafia/${gameId}`);
  const prisma = getPrismaClient();
  const game = await prisma.mafiaGame.findFirst({
    where: { id: gameId, hostId: user.id, status: 'LOBBY' },
    select: {
      id: true,
      killerCount: true,
      nightSeconds: true,
      participants: { orderBy: { joinedAt: 'asc' }, select: { id: true } },
    },
  });
  if (!game) redirect(`/mafia/${gameId}?error=not-found`);
  if (game.participants.length < 5) redirect(`/mafia/${gameId}?error=players`);

  const roles = shuffled(buildMafiaRoles(game.participants.length, game.killerCount));
  const now = new Date();
  await prisma.$transaction([
    ...game.participants.map((participant, index) =>
      prisma.mafiaParticipant.update({
        where: { id: participant.id },
        data: { role: roles[index], status: 'ALIVE', privateNote: null, eliminatedAt: null },
      }),
    ),
    prisma.mafiaGame.update({
      where: { id: game.id },
      data: {
        status: 'NIGHT',
        currentRound: 1,
        startedAt: now,
        phaseEndsAt: new Date(now.getTime() + game.nightSeconds * 1000),
      },
    }),
    prisma.mafiaMessage.create({
      data: {
        gameId: game.id,
        channel: 'SYSTEM',
        body: 'بدأت اللعبة. افتح بطاقة دورك سرًا، فالليل قد حل.',
      },
    }),
  ]);
  refreshMafia(game.id);
  redirect(`/mafia/${game.id}`);
}

export async function advanceMafiaPhase(formData: FormData) {
  requireMafiaDatabase();
  const gameId = String(formData.get('gameId') ?? '');
  const user = await requireActiveUser(`/mafia/${gameId}`);
  const ownsGame = await getPrismaClient().mafiaGame.findFirst({
    where: { id: gameId, hostId: user.id },
    select: { id: true },
  });
  if (ownsGame) await advanceMafiaGame(gameId, true);
  refreshMafia(gameId);
}

export async function submitMafiaAction(formData: FormData) {
  requireMafiaDatabase();
  const gameId = String(formData.get('gameId') ?? '');
  const actorId = String(formData.get('participantId') ?? '');
  const participantToken = String(formData.get('participantToken') ?? '');
  const targetId = String(formData.get('targetId') ?? '');
  const prisma = getPrismaClient();
  const game = await prisma.mafiaGame.findUnique({
    where: { id: gameId },
    select: {
      status: true,
      currentRound: true,
      participants: {
        where: { id: { in: [actorId, targetId] }, status: 'ALIVE' },
        select: { id: true, role: true, displayName: true },
      },
    },
  });
  if (!game || game.status !== 'NIGHT') return;
  const actor = game.participants.find((item) => item.id === actorId);
  const target = game.participants.find((item) => item.id === targetId);
  if (!actor?.role || !target) return;
  const authorizedActor = await prisma.mafiaParticipant.findFirst({
    where: { id: actorId, gameId, accessToken: participantToken },
    select: { id: true },
  });
  if (!authorizedActor) return;

  const type =
    actor.role === 'KILLER'
      ? 'KILL'
      : actor.role === 'DETECTIVE'
        ? 'INVESTIGATE'
        : actor.role === 'DOCTOR'
          ? 'HEAL'
          : actor.role === 'GUARD'
            ? 'PROTECT'
            : null;
  if (!type || (type === 'KILL' && target.role === 'KILLER')) return;
  if (type === 'PROTECT' && target.id === actor.id) return;

  const resultIsKiller = type === 'INVESTIGATE' ? target.role === 'KILLER' : null;
  await prisma.mafiaAction.upsert({
    where: {
      gameId_round_type_actorId: {
        gameId,
        round: game.currentRound,
        type,
        actorId,
      },
    },
    update: { targetId, resultIsKiller },
    create: {
      gameId,
      round: game.currentRound,
      actorId,
      targetId,
      type,
      resultIsKiller,
    },
  });
  if (type === 'INVESTIGATE') {
    await prisma.mafiaParticipant.update({
      where: { id: actor.id },
      data: {
        privateNote: `${target.displayName}: ${resultIsKiller ? 'هو القاتل' : 'ليس القاتل'}.`,
      },
    });
  }
  refreshMafia(gameId);
}

export async function submitMafiaVote(formData: FormData) {
  requireMafiaDatabase();
  const gameId = String(formData.get('gameId') ?? '');
  const voterId = String(formData.get('participantId') ?? '');
  const participantToken = String(formData.get('participantToken') ?? '');
  const targetId = String(formData.get('targetId') ?? '');
  const prisma = getPrismaClient();
  const game = await prisma.mafiaGame.findUnique({
    where: { id: gameId },
    select: {
      status: true,
      currentRound: true,
      participants: {
        where: { id: { in: [voterId, targetId] }, status: 'ALIVE' },
        select: { id: true },
      },
    },
  });
  if (!game || game.status !== 'VOTING' || game.participants.length !== 2) return;
  const authorizedVoter = await prisma.mafiaParticipant.findFirst({
    where: { id: voterId, gameId, accessToken: participantToken },
    select: { id: true },
  });
  if (!authorizedVoter) return;
  await prisma.mafiaVote.upsert({
    where: { gameId_round_voterId: { gameId, round: game.currentRound, voterId } },
    update: { targetId },
    create: { gameId, round: game.currentRound, voterId, targetId },
  });
  refreshMafia(gameId);
}

export async function sendMafiaMessage(formData: FormData) {
  requireMafiaDatabase();
  const gameId = String(formData.get('gameId') ?? '');
  const participantId = String(formData.get('participantId') ?? '');
  const participantToken = String(formData.get('participantToken') ?? '');
  const body = String(formData.get('body') ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 280);
  if (!body) return;
  const prisma = getPrismaClient();
  const participant = await prisma.mafiaParticipant.findFirst({
    where: { id: participantId, gameId, accessToken: participantToken },
    select: {
      id: true,
      role: true,
      status: true,
      isMuted: true,
      lastMessageAt: true,
      game: {
        select: { status: true, chatEnabled: true, slowModeSeconds: true },
      },
    },
  });
  if (!participant || participant.isMuted || !participant.game.chatEnabled) return;
  const elapsed = participant.lastMessageAt
    ? Date.now() - participant.lastMessageAt.getTime()
    : Number.POSITIVE_INFINITY;
  if (elapsed < participant.game.slowModeSeconds * 1000) return;

  const channel = resolveMafiaChatChannel({
    gameStatus: participant.game.status,
    role: participant.role,
    playerStatus: participant.status,
  });
  if (!channel) return;
  const now = new Date();
  const cutoff = new Date(now.getTime() - participant.game.slowModeSeconds * 1000);
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.mafiaParticipant.updateMany({
      where: {
        id: participantId,
        gameId,
        accessToken: participantToken,
        OR: [{ lastMessageAt: null }, { lastMessageAt: { lte: cutoff } }],
      },
      data: { lastMessageAt: now },
    });
    if (claimed.count === 0) return;
    await tx.mafiaMessage.create({ data: { gameId, participantId, channel, body } });
  });
  refreshMafia(gameId);
}

export async function moderateMafiaParticipant(formData: FormData) {
  requireMafiaDatabase();
  const gameId = String(formData.get('gameId') ?? '');
  const participantId = String(formData.get('participantId') ?? '');
  const user = await requireActiveUser(`/mafia/${gameId}`);
  const game = await getPrismaClient().mafiaGame.findFirst({
    where: { id: gameId, hostId: user.id },
    select: { id: true },
  });
  if (game) {
    await getPrismaClient().mafiaParticipant.updateMany({
      where: { id: participantId, gameId },
      data: { isMuted: formData.get('muted') === 'true' },
    });
  }
  refreshMafia(gameId);
}

export async function deleteMafiaMessage(formData: FormData) {
  requireMafiaDatabase();
  const gameId = String(formData.get('gameId') ?? '');
  const messageId = String(formData.get('messageId') ?? '');
  const user = await requireActiveUser(`/mafia/${gameId}`);
  const game = await getPrismaClient().mafiaGame.findFirst({
    where: { id: gameId, hostId: user.id },
    select: { id: true },
  });
  if (game) {
    await getPrismaClient().mafiaMessage.deleteMany({ where: { id: messageId, gameId } });
  }
  refreshMafia(gameId);
}

export async function toggleMafiaChat(formData: FormData) {
  requireMafiaDatabase();
  const gameId = String(formData.get('gameId') ?? '');
  const user = await requireActiveUser(`/mafia/${gameId}`);
  await getPrismaClient().mafiaGame.updateMany({
    where: { id: gameId, hostId: user.id },
    data: { chatEnabled: formData.get('enabled') === 'true' },
  });
  refreshMafia(gameId);
}
