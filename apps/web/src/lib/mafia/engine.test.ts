import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { advanceMafiaGame } from './engine';

const { prisma } = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn(),
    mafiaGame: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    mafiaMessage: {
      create: vi.fn(),
    },
    mafiaAction: {
      findMany: vi.fn(),
    },
    mafiaParticipant: {
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth/prisma', () => ({
  getPrismaClient: () => prisma,
}));

describe('advanceMafiaGame', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-25T12:00:00.000Z'));
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation(async (callback: (client: typeof prisma) => unknown) =>
      callback(prisma),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('claims and completes an expired automatic transition in one transaction', async () => {
    const expiredDeadline = new Date('2026-07-25T11:59:59.000Z');
    prisma.mafiaGame.findUnique
      .mockResolvedValueOnce({
        status: 'DAY',
        autoMode: true,
        phaseEndsAt: expiredDeadline,
      })
      .mockResolvedValueOnce({
        status: 'DAY',
        votingSeconds: 30,
      });
    prisma.mafiaGame.updateMany.mockResolvedValue({ count: 1 });
    prisma.mafiaGame.update.mockResolvedValue({});
    prisma.mafiaMessage.create.mockResolvedValue({});

    await advanceMafiaGame('game-1');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.mafiaGame.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'game-1',
        status: 'DAY',
        phaseEndsAt: expiredDeadline,
      },
      data: {
        phaseEndsAt: expiredDeadline,
      },
    });
    expect(prisma.mafiaGame.update).toHaveBeenCalledTimes(1);
    expect(prisma.mafiaMessage.create).toHaveBeenCalledTimes(1);
  });

  it('does not let a stale lease holder complete a duplicate transition', async () => {
    const expiredDeadline = new Date('2026-07-25T11:59:59.000Z');
    prisma.mafiaGame.findUnique.mockResolvedValueOnce({
      status: 'DAY',
      autoMode: true,
      phaseEndsAt: expiredDeadline,
    });
    prisma.mafiaGame.updateMany.mockResolvedValueOnce({ count: 0 });

    await advanceMafiaGame('game-1');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.mafiaGame.update).not.toHaveBeenCalled();
    expect(prisma.mafiaMessage.create).not.toHaveBeenCalled();
  });

  it('forces a host-controlled transition without requiring the timer deadline to match', async () => {
    const futureDeadline = new Date('2026-07-25T12:05:00.000Z');
    prisma.mafiaGame.findUnique
      .mockResolvedValueOnce({
        status: 'DAY',
        autoMode: false,
        phaseEndsAt: futureDeadline,
      })
      .mockResolvedValueOnce({
        status: 'DAY',
        votingSeconds: 30,
      });
    prisma.mafiaGame.updateMany.mockResolvedValue({ count: 1 });
    prisma.mafiaGame.update.mockResolvedValue({});
    prisma.mafiaMessage.create.mockResolvedValue({});

    await advanceMafiaGame('game-1', true);

    expect(prisma.mafiaGame.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'game-1',
        status: 'DAY',
      },
      data: {
        phaseEndsAt: futureDeadline,
      },
    });
    expect(prisma.mafiaGame.update).toHaveBeenCalledTimes(1);
    expect(prisma.mafiaMessage.create).toHaveBeenCalledTimes(1);
  });

  it('announces the killed victim by name when night resolves', async () => {
    const expiredDeadline = new Date('2026-07-25T11:59:59.000Z');
    prisma.mafiaGame.findUnique
      .mockResolvedValueOnce({
        status: 'NIGHT',
        autoMode: true,
        phaseEndsAt: expiredDeadline,
      })
      .mockResolvedValueOnce({
        id: 'game-1',
        status: 'NIGHT',
        currentRound: 1,
        daySeconds: 90,
        participants: [
          { id: 'p-killer', displayName: 'خالد', role: 'KILLER' },
          { id: 'p-victim', displayName: 'نورة', role: 'CITIZEN' },
          { id: 'p-doc', displayName: 'فهد', role: 'DOCTOR' },
          { id: 'p-det', displayName: 'ليان', role: 'DETECTIVE' },
          { id: 'p-cit', displayName: 'ماجد', role: 'CITIZEN' },
        ],
      });
    prisma.mafiaGame.updateMany.mockResolvedValue({ count: 1 });
    prisma.mafiaAction.findMany.mockResolvedValue([{ type: 'KILL', targetId: 'p-victim' }]);
    prisma.mafiaParticipant.update.mockResolvedValue({});
    prisma.mafiaGame.update.mockResolvedValue({});
    prisma.mafiaMessage.create.mockResolvedValue({});

    await advanceMafiaGame('game-1');

    expect(prisma.mafiaParticipant.update).toHaveBeenCalledWith({
      where: { id: 'p-victim' },
      data: { status: 'ELIMINATED', eliminatedAt: expect.any(Date) },
    });
    expect(prisma.mafiaMessage.create).toHaveBeenCalledWith({
      data: {
        gameId: 'game-1',
        channel: 'SYSTEM',
        body: expect.stringContaining('تم قتل الضحية «نورة»'),
      },
    });
  });
});
