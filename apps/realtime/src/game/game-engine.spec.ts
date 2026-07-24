import { calculateQuestionScore, canTransition } from './game-engine.js';

describe('live game engine', () => {
  it('allows only the documented state-machine transitions', () => {
    expect(canTransition('LOBBY', 'QUESTION')).toBe(true);
    expect(canTransition('QUESTION', 'REVEAL')).toBe(true);
    expect(canTransition('REVEAL', 'LEADERBOARD')).toBe(true);
    expect(canTransition('LEADERBOARD', 'QUESTION')).toBe(true);
    expect(canTransition('FINISHED', 'QUESTION')).toBe(false);
    expect(canTransition('QUESTION', 'QUESTION')).toBe(false);
  });

  it('awards more points to a faster correct server-received answer', () => {
    const fast = calculateQuestionScore({
      correct: true,
      basePoints: 1_000,
      questionStartedAt: 1_000,
      questionEndsAt: 11_000,
      receivedAt: 2_000,
    });
    const slow = calculateQuestionScore({
      correct: true,
      basePoints: 1_000,
      questionStartedAt: 1_000,
      questionEndsAt: 11_000,
      receivedAt: 10_000,
    });
    expect(fast).toBeGreaterThan(slow);
    expect(slow).toBeGreaterThan(0);
  });

  it('returns zero for wrong, early, or late answers', () => {
    const base = {
      basePoints: 1_000,
      questionStartedAt: 1_000,
      questionEndsAt: 11_000,
    };
    expect(
      calculateQuestionScore({ ...base, correct: false, receivedAt: 2_000 }),
    ).toBe(0);
    expect(
      calculateQuestionScore({ ...base, correct: true, receivedAt: 999 }),
    ).toBe(0);
    expect(
      calculateQuestionScore({ ...base, correct: true, receivedAt: 11_001 }),
    ).toBe(0);
  });
});
