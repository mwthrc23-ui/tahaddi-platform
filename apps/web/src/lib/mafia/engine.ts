import { getPrismaClient } from '@/lib/auth/prisma';
import { determineMafiaWinner, type MafiaRoleName } from './rules';

function deadline(seconds: number, now = new Date()) {
  return new Date(now.getTime() + seconds * 1000);
}

function transitionClaimWhere(
  gameId: string,
  status: 'NIGHT' | 'DAY' | 'VOTING',
  expectedPhaseEndsAt: Date | null,
  force: boolean,
) {
  return {
    id: gameId,
    status,
    ...(force ? {} : { phaseEndsAt: expectedPhaseEndsAt }),
  };
}

async function resolveNight(gameId: string, expectedPhaseEndsAt: Date | null, force: boolean) {
  const prisma = getPrismaClient();
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.mafiaGame.updateMany({
      where: transitionClaimWhere(gameId, 'NIGHT', expectedPhaseEndsAt, force),
      data: { phaseEndsAt: expectedPhaseEndsAt },
    });
    if (claimed.count === 0) return;

    const game = await tx.mafiaGame.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        status: true,
        currentRound: true,
        daySeconds: true,
        participants: {
          where: { status: 'ALIVE' },
          select: { id: true, displayName: true, role: true },
        },
      },
    });
    if (!game || game.status !== 'NIGHT') return;

    const actions = await tx.mafiaAction.findMany({
      where: { gameId, round: game.currentRound },
      select: { type: true, targetId: true },
    });
    const killCounts = new Map<string, number>();
    for (const action of actions.filter((item) => item.type === 'KILL')) {
      killCounts.set(action.targetId, (killCounts.get(action.targetId) ?? 0) + 1);
    }
    const rankedKills = [...killCounts.entries()].sort((a, b) => b[1] - a[1]);
    const killedId =
      rankedKills[0] && rankedKills[0][1] > (rankedKills[1]?.[1] ?? 0) ? rankedKills[0][0] : null;
    const protectedIds = new Set(
      actions
        .filter((item) => item.type === 'HEAL' || item.type === 'PROTECT')
        .map((item) => item.targetId),
    );
    const victim = game.participants.find((player) => player.id === killedId);
    const eliminated = victim && !protectedIds.has(victim.id) ? victim : null;

    if (eliminated) {
      await tx.mafiaParticipant.update({
        where: { id: eliminated.id },
        data: { status: 'ELIMINATED', eliminatedAt: new Date() },
      });
    }

    const aliveRoles = game.participants
      .filter((player) => player.id !== eliminated?.id)
      .map((player) => player.role)
      .filter((role): role is MafiaRoleName => Boolean(role));
    const winner = determineMafiaWinner(aliveRoles);
    const message = eliminated
      ? `انتهى الليل. خرج ${eliminated.displayName} من اللعبة. ابدأوا النقاش لمعرفة من القاتل.`
      : killedId
        ? 'انتهى الليل سالمًا: الحماية أنقذت المستهدف. لا أحد خرج.'
        : 'انتهى الليل من دون ضحية. إما لم يتفق القتلة أو لم يُنفَّذ قرار.';

    const killer = game.participants.find((player) => player.role === 'KILLER');
    const witness = game.participants.find((player) => player.role === 'WITNESS');
    if (killer && witness) {
      await tx.mafiaParticipant.update({
        where: { id: witness.id },
        data: {
          privateNote: `دليل الجولة ${game.currentRound}: يبدأ اسم أحد القتلة بحرف «${killer.displayName.charAt(0)}».`,
        },
      });
    }

    await tx.mafiaMessage.create({
      data: { gameId, channel: 'SYSTEM', body: message },
    });
    await tx.mafiaGame.update({
      where: { id: gameId },
      data: winner
        ? { status: 'FINISHED', winner, endedAt: new Date(), phaseEndsAt: null }
        : { status: 'DAY', phaseEndsAt: deadline(game.daySeconds) },
    });
  });
}

async function openVoting(gameId: string, expectedPhaseEndsAt: Date | null, force: boolean) {
  const prisma = getPrismaClient();
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.mafiaGame.updateMany({
      where: transitionClaimWhere(gameId, 'DAY', expectedPhaseEndsAt, force),
      data: { phaseEndsAt: expectedPhaseEndsAt },
    });
    if (claimed.count === 0) return;

    const game = await tx.mafiaGame.findUnique({
      where: { id: gameId },
      select: { status: true, votingSeconds: true },
    });
    if (!game || game.status !== 'DAY') return;
    await tx.mafiaGame.update({
      where: { id: gameId },
      data: { status: 'VOTING', phaseEndsAt: deadline(game.votingSeconds) },
    });
    await tx.mafiaMessage.create({
      data: {
        gameId,
        channel: 'SYSTEM',
        body: 'بدأ التصويت. ثبّت كل لاعب حي صوته ضد مشتبه واحد قبل انتهاء المؤقت.',
      },
    });
  });
}

async function resolveVoting(gameId: string, expectedPhaseEndsAt: Date | null, force: boolean) {
  const prisma = getPrismaClient();
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.mafiaGame.updateMany({
      where: transitionClaimWhere(gameId, 'VOTING', expectedPhaseEndsAt, force),
      data: { phaseEndsAt: expectedPhaseEndsAt },
    });
    if (claimed.count === 0) return;

    const game = await tx.mafiaGame.findUnique({
      where: { id: gameId },
      select: {
        status: true,
        currentRound: true,
        nightSeconds: true,
        participants: {
          where: { status: 'ALIVE' },
          select: { id: true, displayName: true, role: true },
        },
      },
    });
    if (!game || game.status !== 'VOTING') return;

    const votes = await tx.mafiaVote.groupBy({
      by: ['targetId'],
      where: { gameId, round: game.currentRound },
      _count: { targetId: true },
      orderBy: { _count: { targetId: 'desc' } },
    });
    const top = votes[0];
    const tied = top && votes[1]?._count.targetId === top._count.targetId;
    const eliminated = !tied
      ? game.participants.find((player) => player.id === top?.targetId)
      : null;

    if (eliminated) {
      await tx.mafiaParticipant.update({
        where: { id: eliminated.id },
        data: { status: 'ELIMINATED', eliminatedAt: new Date() },
      });
    }
    const aliveRoles = game.participants
      .filter((player) => player.id !== eliminated?.id)
      .map((player) => player.role)
      .filter((role): role is MafiaRoleName => Boolean(role));
    const winner = determineMafiaWinner(aliveRoles);
    await tx.mafiaMessage.create({
      data: {
        gameId,
        channel: 'SYSTEM',
        body: eliminated
          ? `نتيجة التصويت: خرج ${eliminated.displayName} من اللعبة. الأدوار تبقى سرية حتى النهاية.`
          : 'تعادلت الأصوات؛ لم يخرج أحد. يستمر الليل التالي بنفس العدد.',
      },
    });
    await tx.mafiaGame.update({
      where: { id: gameId },
      data: winner
        ? { status: 'FINISHED', winner, endedAt: new Date(), phaseEndsAt: null }
        : {
            status: 'NIGHT',
            currentRound: { increment: 1 },
            phaseEndsAt: deadline(game.nightSeconds),
          },
    });
  });
}

export async function advanceMafiaGame(gameId: string, force = false) {
  const prisma = getPrismaClient();
  const game = await prisma.mafiaGame.findUnique({
    where: { id: gameId },
    select: { status: true, autoMode: true, phaseEndsAt: true },
  });
  if (!game || game.status === 'LOBBY' || game.status === 'FINISHED') return;
  if (!force && (!game.autoMode || !game.phaseEndsAt || game.phaseEndsAt.getTime() > Date.now())) {
    return;
  }
  if (game.status === 'NIGHT') await resolveNight(gameId, game.phaseEndsAt, force);
  if (game.status === 'DAY') await openVoting(gameId, game.phaseEndsAt, force);
  if (game.status === 'VOTING') await resolveVoting(gameId, game.phaseEndsAt, force);
}

export async function markMafiaParticipantSeen(
  gameId: string,
  participantId: string,
  accessToken: string,
) {
  const result = await getPrismaClient().mafiaParticipant.updateMany({
    where: { id: participantId, gameId, accessToken },
    data: { lastSeenAt: new Date() },
  });
  return result.count === 1;
}
