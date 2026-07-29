'use client';

import { useEffect, useMemo, useState } from 'react';
import { Medal, RotateCcw, SkipForward, Sparkles, Trophy } from 'lucide-react';
import { WinnerPodium } from '@/components/quiz';
import { Button } from '@/components/ui';

export const FINALE_REVEAL_DELAY = 900;
export const FINALE_REVEAL_INTERVAL = 1_400;

export type FinalePlayer = {
  id: string;
  name: string;
  score: number;
  rank: number;
  correctAnswers?: number;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? '؟') + (parts[1]?.[0] ?? '');
}

function playRevealTone(rank: number) {
  const AudioContextType =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextType) return;

  try {
    const context = new AudioContextType();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequencies = { 1: 784, 2: 659, 3: 523 } as const;
    oscillator.type = rank === 1 ? 'triangle' : 'sine';
    oscillator.frequency.value = frequencies[rank as keyof typeof frequencies] ?? 440;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.24);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.25);
    oscillator.addEventListener('ended', () => void context.close(), { once: true });
  } catch {
    // Browsers may block audio until the user interacts with the page.
  }
}

function getPersonalMessage(rank: number) {
  if (rank === 1) return 'أنت بطل هذه الجولة';
  if (rank <= 3) return 'أنهيت الجولة على منصة التتويج';
  return 'أكملت الجولة وسُجل ترتيبك النهائي';
}

export function LiveFinaleExperience({
  players,
  participantId,
  soundEnabled = true,
  roomCode,
  quizTitle,
}: {
  players: FinalePlayer[];
  participantId?: string;
  soundEnabled?: boolean;
  roomCode?: string;
  quizTitle?: string;
}) {
  const rankedPlayers = useMemo(
    () => [...players].sort((first, second) => first.rank - second.rank),
    [players],
  );
  const revealPlayers = useMemo(() => rankedPlayers.slice(0, 3).reverse(), [rankedPlayers]);
  const [revealStep, setRevealStep] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const [runId, setRunId] = useState(0);
  const finalStep = revealPlayers.length + 1;
  const isFinal = revealStep === finalStep;
  const revealedPlayer =
    revealStep > 0 && revealStep <= revealPlayers.length
      ? revealPlayers[revealStep - 1]
      : undefined;
  const personalResult = participantId
    ? rankedPlayers.find((player) => player.id === participantId)
    : undefined;
  const winners = rankedPlayers.slice(0, 3).map((player) => ({
    name: player.name,
    initials: getInitials(player.name),
    score: player.score,
    correctAnswers: player.correctAnswers,
  }));

  useEffect(() => {
    if (skipped) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const timer = window.setTimeout(() => setRevealStep(finalStep), 0);
      return () => window.clearTimeout(timer);
    }

    const timers = revealPlayers.map((_, index) =>
      window.setTimeout(
        () => setRevealStep(index + 1),
        FINALE_REVEAL_DELAY + index * FINALE_REVEAL_INTERVAL,
      ),
    );
    timers.push(
      window.setTimeout(
        () => setRevealStep(finalStep),
        FINALE_REVEAL_DELAY + revealPlayers.length * FINALE_REVEAL_INTERVAL,
      ),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [finalStep, revealPlayers, runId, skipped]);

  useEffect(() => {
    if (soundEnabled && revealedPlayer) playRevealTone(revealedPlayer.rank);
  }, [revealedPlayer, soundEnabled]);

  const replay = () => {
    setRevealStep(0);
    setSkipped(false);
    setRunId((value) => value + 1);
  };

  const skipToResult = () => {
    setSkipped(true);
    setRevealStep(finalStep);
  };

  return (
    <section className="finale-stage" aria-labelledby="finale-title">
      <header className="finale-header">
        <div>
          <span className="eyebrow">{roomCode ? `غرفة ${roomCode}` : 'لحظة الحسم'}</span>
          <h1 id="finale-title">{isFinal ? 'النتيجة النهائية' : 'إعلان الفائزين'}</h1>
          {quizTitle && <p>{quizTitle}</p>}
        </div>
        <div className="finale-actions">
          {!isFinal ? (
            <Button type="button" variant="secondary" onClick={skipToResult}>
              <SkipForward />
              عرض النتيجة الآن
            </Button>
          ) : (
            <Button type="button" variant="secondary" onClick={replay}>
              <RotateCcw />
              إعادة التتويج
            </Button>
          )}
        </div>
      </header>

      {rankedPlayers.length === 0 ? (
        <div className="finale-empty">
          <Trophy aria-hidden="true" />
          <h2>لا توجد نتائج مسجلة</h2>
          <p>لم ينضم أي متسابق إلى هذه الجولة.</p>
        </div>
      ) : isFinal ? (
        <div className="finale-summary">
          <div className="finale-celebration" aria-hidden="true">
            {Array.from({ length: 12 }, (_, index) => (
              <i key={index} />
            ))}
          </div>
          <div className="finale-podium-panel">
            <div className="finale-section-title">
              <Sparkles aria-hidden="true" />
              <div>
                <span>اكتمل التتويج</span>
                <h2>منصة الأبطال</h2>
              </div>
            </div>
            <WinnerPodium winners={winners} />
          </div>

          {personalResult && (
            <aside className="finale-personal-result" aria-label="نتيجتك الشخصية">
              <span>نتيجتك</span>
              <strong>{getPersonalMessage(personalResult.rank)}</strong>
              <div className="finale-personal-metrics">
                <div>
                  <span>المركز</span>
                  <b>{personalResult.rank.toLocaleString('ar-SA')}</b>
                </div>
                <div>
                  <span>النقاط</span>
                  <b>{personalResult.score.toLocaleString('ar-SA')}</b>
                </div>
                <div>
                  <span>المتسابقون</span>
                  <b>{rankedPlayers.length.toLocaleString('ar-SA')}</b>
                </div>
              </div>
            </aside>
          )}

          <div className="finale-ranking">
            <h2>ترتيب المتسابقين</h2>
            <ol>
              {rankedPlayers.slice(0, 10).map((player) => (
                <li
                  key={player.id}
                  className={player.id === participantId ? 'is-current-player' : undefined}
                >
                  <span>{player.rank.toLocaleString('ar-SA')}</span>
                  <strong>{player.name}</strong>
                  <b>{player.score.toLocaleString('ar-SA')}</b>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : revealedPlayer ? (
        <div
          className={`finale-reveal finale-reveal-${revealedPlayer.rank}`}
          role="status"
          aria-live="polite"
        >
          <div className="finale-rank-mark">
            {revealedPlayer.rank === 1 ? <Trophy /> : <Medal />}
            <span>المركز</span>
            <strong>{revealedPlayer.rank.toLocaleString('ar-SA')}</strong>
          </div>
          <div className="finale-reveal-player">
            <span className="finale-avatar">{getInitials(revealedPlayer.name)}</span>
            <h2>{revealedPlayer.name}</h2>
            <p>{revealedPlayer.score.toLocaleString('ar-SA')} نقطة</p>
          </div>
        </div>
      ) : (
        <div className="finale-intro" role="status" aria-live="polite">
          <span className="finale-intro-icon">
            <Trophy aria-hidden="true" />
          </span>
          <p>اكتملت الإجابات</p>
          <h2>استعدوا لإعلان المراكز الثلاثة الأولى</h2>
        </div>
      )}
    </section>
  );
}
