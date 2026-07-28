import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatMafiaCountdown, MafiaPhaseTimer } from './mafia-phase-timer';

const { refresh, router } = vi.hoisted(() => {
  const refresh = vi.fn();
  return { refresh, router: { refresh } };
});

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}));

describe('MafiaPhaseTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-25T12:00:00.000Z'));
    refresh.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('formats the countdown with stable Arabic digits', () => {
    expect(formatMafiaCountdown(65)).toBe('٠١:٠٥');
  });

  it('counts down and requests the automatic phase transition at zero', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MafiaPhaseTimer
        phase="NIGHT"
        phaseEndsAt="2026-07-25T12:00:02.000Z"
        durationSeconds={45}
        autoMode
        tickEndpoint="/api/mafia/game-1/tick"
        participantId="player-1"
      />,
    );

    expect(screen.getByTestId('mafia-countdown')).toHaveTextContent('٠٠:٠٢');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });

    expect(screen.getByTestId('mafia-countdown')).toHaveTextContent('٠٠:٠٠');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/mafia/game-1/tick',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          participantId: 'player-1',
        }),
      }),
    );
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('explains when the host controls phases manually', () => {
    render(
      <MafiaPhaseTimer
        phase="DAY"
        phaseEndsAt={null}
        durationSeconds={null}
        autoMode={false}
        tickEndpoint="/api/mafia/game-1/tick"
      />,
    );

    expect(screen.getByText('الانتقال يدوي')).toBeInTheDocument();
  });
});
