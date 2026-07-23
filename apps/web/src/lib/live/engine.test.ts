import { describe, expect, it } from 'vitest';
import { calculateTimedScore } from './engine';

describe('calculateTimedScore', () => {
  const startedAt = new Date('2026-07-24T00:00:00.000Z');

  it('يعطي النقاط الكاملة للإجابة الفورية الصحيحة', () => {
    expect(
      calculateTimedScore({
        basePoints: 1000,
        timeLimitSeconds: 20,
        questionStartedAt: startedAt,
        receivedAt: startedAt,
        speedScoring: true,
      }),
    ).toBe(1000);
  });

  it('يحافظ على نصف النقاط على الأقل عند انتهاء الوقت', () => {
    expect(
      calculateTimedScore({
        basePoints: 1000,
        timeLimitSeconds: 20,
        questionStartedAt: startedAt,
        receivedAt: new Date('2026-07-24T00:00:20.000Z'),
        speedScoring: true,
      }),
    ).toBe(500);
  });

  it('يعيد النقاط الأساسية عند تعطيل احتساب السرعة', () => {
    expect(
      calculateTimedScore({
        basePoints: 1000,
        timeLimitSeconds: 20,
        questionStartedAt: startedAt,
        receivedAt: new Date('2026-07-24T00:00:19.000Z'),
        speedScoring: false,
      }),
    ).toBe(1000);
  });
});
