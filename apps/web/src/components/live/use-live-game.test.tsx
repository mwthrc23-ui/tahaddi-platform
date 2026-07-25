import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const socketIo = vi.hoisted(() => ({ io: vi.fn() }));
vi.mock('socket.io-client', () => socketIo);

import type { GameSnapshot } from '@tahaddi/contracts';
import { useLiveGame } from './use-live-game';

const lobbySnapshot: GameSnapshot = {
  sessionId: 'session-1',
  roomCode: '123456',
  phase: 'LOBBY',
  serverTime: Date.now(),
  question: null,
  reveal: null,
  leaderboard: [],
  participantCount: 1,
  playerAnswer: null,
  playerResult: null,
};

describe('useLiveGame HTTP fallback', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_REALTIME_URL;
    socketIo.io.mockReset();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ ok: true, snapshot: lobbySnapshot, stats: null }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('connects through the authenticated HTTP room endpoint and sends host commands', async () => {
    const { result, unmount } = renderHook(() =>
      useLiveGame({
        sessionId: 'session-1',
        subjectId: 'host-1',
        accessToken: 'signed-token',
        role: 'host',
      }),
    );

    await waitFor(() => expect(result.current.connected).toBe(true));
    expect(result.current.snapshot?.phase).toBe('LOBBY');
    expect(socketIo.io).not.toHaveBeenCalled();

    const firstRequest = vi.mocked(fetch).mock.calls[0];
    expect(firstRequest[0]).toBe('/api/live/session-1/room');
    expect(JSON.parse(String((firstRequest[1] as RequestInit).body))).toMatchObject({
      operation: 'snapshot',
      subjectId: 'host-1',
      accessToken: 'signed-token',
      role: 'host',
    });

    act(() => result.current.startQuestion());
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2));
    expect(
      JSON.parse(String((vi.mocked(fetch).mock.calls[1][1] as RequestInit).body)),
    ).toMatchObject({ operation: 'start' });

    unmount();
  });
});
