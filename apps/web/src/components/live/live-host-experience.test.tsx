import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveHostExperience } from './live-host-experience';

const nextQuestion = vi.fn();

vi.mock('./use-live-game', () => ({
  useLiveGame: () => ({
    snapshot: {
      sessionId: 'session-1',
      roomCode: 'ABC123',
      phase: 'REVEAL',
      serverTime: Date.now(),
      question: {
        questionId: 'question-1',
        prompt: 'ما الإجابة؟',
        options: [
          { id: 'option-1', text: 'الأولى', position: 0 },
          { id: 'option-2', text: 'الثانية', position: 1 },
        ],
        media: [],
        questionStartedAt: Date.now() - 5_000,
        questionEndsAt: Date.now(),
        questionNumber: 1,
        totalQuestions: 2,
      },
      reveal: null,
      leaderboard: [],
      participantCount: 2,
      playerAnswer: null,
      playerResult: null,
    },
    stats: null,
    clockOffset: 0,
    connected: true,
    message: '',
    busy: false,
    startQuestion: vi.fn(),
    nextQuestion,
    finishGame: vi.fn(),
    submitAnswer: vi.fn(),
  }),
}));

describe('LiveHostExperience auto advance', () => {
  beforeEach(() => {
    nextQuestion.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lets the host disable or enable the automatic next question request', () => {
    render(
      <LiveHostExperience
        sessionId="session-1"
        hostId="host-1"
        accessToken="token"
        roomCode="ABC123"
        joinUrl="https://example.test/join/ABC123"
        initialAutoAdvance
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'إعدادات العرض' }));
    const toggle = screen.getByRole('button', { name: /الانتقال التلقائي/ });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(toggle);
    act(() => vi.advanceTimersByTime(2_000));
    expect(nextQuestion).not.toHaveBeenCalled();

    fireEvent.click(toggle);
    act(() => vi.advanceTimersByTime(2_000));
    expect(nextQuestion).toHaveBeenCalledTimes(1);
  });
});
