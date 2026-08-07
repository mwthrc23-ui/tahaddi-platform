import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMafiaGame } from './actions';

const mocks = vi.hoisted(() => ({
  requireActiveUser: vi.fn(),
  hasDatabaseUrl: vi.fn(),
  getPrismaClient: vi.fn(),
  generateUniqueActivityRoomCode: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  requireActiveUser: mocks.requireActiveUser,
}));

vi.mock('@/lib/auth/prisma', () => ({
  hasDatabaseUrl: mocks.hasDatabaseUrl,
  getPrismaClient: mocks.getPrismaClient,
}));

vi.mock('@/lib/mafia/access-cookie', () => ({
  getMafiaAccessToken: vi.fn(),
}));

vi.mock('@/lib/mafia/engine', () => ({
  advanceMafiaGame: vi.fn(),
}));

vi.mock('@/lib/mafia/narrative', () => ({
  buildNarrativeEvent: vi.fn(),
  buildNarrative: vi.fn(),
}));

vi.mock('@/lib/mafia/rules', () => ({
  buildMafiaRoles: vi.fn(),
  resolveMafiaChatChannel: vi.fn(),
  shuffled: vi.fn(),
}));

vi.mock('@/lib/mafia/game-modes', () => ({
  MAFIA_GAME_MODES: {
    CLASSIC: { id: 'CLASSIC' },
  },
  applyModeMultipliers: vi.fn((id, timers) => timers),
}));

vi.mock('@/lib/quiz/room-code', () => ({
  generateUniqueActivityRoomCode: mocks.generateUniqueActivityRoomCode,
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}));

function formData(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.append(key, value);
  }
  return fd;
}

describe('createMafiaGame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasDatabaseUrl.mockReturnValue(true);
    mocks.requireActiveUser.mockResolvedValue({ id: 'host-1' } as never);
    mocks.generateUniqueActivityRoomCode.mockResolvedValue('ROOM123');
    mocks.redirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
    mocks.getPrismaClient.mockReturnValue({
      mafiaGame: {
        create: vi.fn().mockResolvedValue({ id: 'game-1' }),
      },
    } as never);
  });

  it('ينشئ غرفة Mafia مع modeId ويمرر القيم المعدّلة', async () => {
    const prisma = mocks.getPrismaClient();
    await expect(
      createMafiaGame(
        formData({
          modeId: 'CLASSIC',
          maxPlayers: '12',
          killerCount: '1',
          nightSeconds: '45',
          daySeconds: '90',
          votingSeconds: '45',
          autoMode: 'on',
          chatEnabled: 'on',
          slowModeSeconds: '2',
        }),
      ),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(prisma.mafiaGame.create).toHaveBeenCalledTimes(1);
    expect(prisma.mafiaGame.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        hostId: 'host-1',
        roomCode: 'ROOM123',
        modeId: 'CLASSIC',
        maxPlayers: 12,
        killerCount: 1,
        nightSeconds: 45,
        daySeconds: 90,
        votingSeconds: 45,
        autoMode: true,
        chatEnabled: true,
        slowModeSeconds: 2,
      }),
      select: { id: true },
    });
    expect(mocks.redirect).toHaveBeenCalledWith('/mafia/game-1');
  });

  it('يستخدم وضع CLASSIC كاحتياطي عند تمرير modeId غير صالح', async () => {
    const prisma = mocks.getPrismaClient();
    await expect(
      createMafiaGame(
        formData({
          modeId: 'INVALID_MODE',
          maxPlayers: '10',
        }),
      ),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(prisma.mafiaGame.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        modeId: 'CLASSIC',
      }),
      select: { id: true },
    });
  });
});
