'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock3, FastForward } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { MafiaPhaseName } from '@/lib/mafia/guidance';
import { mafiaPhaseGuides } from '@/lib/mafia/guidance';
import { mafiaPhaseLabels } from '@/lib/mafia/rules';

const arabicNumber = new Intl.NumberFormat('ar-SA-u-nu-arab', {
  minimumIntegerDigits: 2,
  useGrouping: false,
});

export function formatMafiaCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${arabicNumber.format(minutes)}:${arabicNumber.format(seconds)}`;
}

export function MafiaPhaseTimer({
  phase,
  phaseEndsAt,
  durationSeconds,
  autoMode,
  tickEndpoint,
  participantId,
  participantToken,
}: {
  phase: MafiaPhaseName;
  phaseEndsAt: string | null;
  durationSeconds: number | null;
  autoMode: boolean;
  tickEndpoint: string;
  participantId?: string;
  participantToken?: string;
}) {
  const router = useRouter();
  const deadline = phaseEndsAt ? Date.parse(phaseEndsAt) : null;
  const [now, setNow] = useState(() => Date.now());
  const requestedDeadline = useRef<string | null>(null);
  const remainingSeconds = deadline ? Math.max(0, Math.ceil((deadline - now) / 1_000)) : 0;
  const progress =
    deadline && durationSeconds
      ? Math.max(0, Math.min(100, (remainingSeconds / durationSeconds) * 100))
      : 0;
  const startTime = useMemo(
    () =>
      deadline && durationSeconds
        ? new Date(deadline - durationSeconds * 1_000).toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        : null,
    [deadline, durationSeconds],
  );
  const endTime = useMemo(
    () =>
      deadline
        ? new Date(deadline).toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        : null,
    [deadline],
  );

  useEffect(() => {
    if (!deadline || !autoMode) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [autoMode, deadline]);

  useEffect(() => {
    if (
      !autoMode ||
      !phaseEndsAt ||
      remainingSeconds > 0 ||
      requestedDeadline.current === phaseEndsAt
    ) {
      return;
    }
    requestedDeadline.current = phaseEndsAt;
    const controller = new AbortController();
    void fetch(tickEndpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ participantId, participantToken }),
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((response) => {
        if (response.ok) router.refresh();
      })
      .catch(() => null);
    return () => controller.abort();
  }, [
    autoMode,
    participantId,
    participantToken,
    phaseEndsAt,
    remainingSeconds,
    router,
    tickEndpoint,
  ]);

  if (!autoMode || !deadline || !durationSeconds) {
    return (
      <section className="mafia-phase-timer mafia-phase-timer-manual" aria-label="توقيت المرحلة">
        <Clock3 aria-hidden="true" />
        <div>
          <strong>الانتقال يدوي</strong>
          <span>ينقل المضيف اللعبة عندما تنتهي مناقشة المرحلة.</span>
        </div>
      </section>
    );
  }

  return (
    <section className="mafia-phase-timer" aria-label="العد التنازلي للمرحلة">
      <div className="mafia-timer-heading">
        <div>
          <span>المرحلة الحالية</span>
          <strong>{mafiaPhaseLabels[phase]}</strong>
        </div>
        <div className="mafia-timer-value" role="timer" aria-live="off">
          <Clock3 aria-hidden="true" />
          <span data-testid="mafia-countdown">{formatMafiaCountdown(remainingSeconds)}</span>
        </div>
      </div>
      <div
        className="mafia-timer-track"
        role="progressbar"
        aria-label="الوقت المتبقي"
        aria-valuemin={0}
        aria-valuemax={durationSeconds}
        aria-valuenow={remainingSeconds}
      >
        <span style={{ transform: `scaleX(${progress / 100})` }} />
      </div>
      <div className="mafia-timer-times">
        <span>بدأت {startTime}</span>
        <span>تنتهي {endTime}</span>
      </div>
      <p className="mafia-timer-next" aria-live="polite">
        <FastForward aria-hidden="true" />
        {remainingSeconds > 0
          ? `بعد الصفر: ${mafiaPhaseGuides[phase].next}`
          : 'انتهى الوقت، جارٍ الانتقال تلقائيًا…'}
      </p>
    </section>
  );
}
