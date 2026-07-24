'use client';

import { useEffect, useRef, useState } from 'react';
import { Settings, SkipForward, Square, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Button, Card } from '@/components/ui';
import { LiveQuestionStage } from './live-question-stage';
import { useLiveGame } from './use-live-game';

export function LiveHostExperience({
  sessionId,
  hostId,
  accessToken,
  roomCode,
  joinUrl,
  initialAutoAdvance,
}: {
  sessionId: string;
  hostId: string;
  accessToken: string;
  roomCode: string;
  joinUrl: string;
  initialAutoAdvance: boolean;
}) {
  const game = useLiveGame({
    sessionId,
    subjectId: hostId,
    accessToken,
    role: 'host',
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(initialAutoAdvance);
  const lastPhase = useRef(game.snapshot?.phase);
  const autoAdvancedQuestion = useRef<string | null>(null);

  useEffect(() => {
    if (!soundEnabled || !game.snapshot?.phase || lastPhase.current === game.snapshot.phase) return;
    lastPhase.current = game.snapshot.phase;
    const AudioContextType =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextType) return;
    const context = new AudioContextType();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = game.snapshot.phase === 'REVEAL' ? 660 : 440;
    gain.gain.value = 0.035;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.08);
    oscillator.addEventListener('ended', () => void context.close(), { once: true });
  }, [game.snapshot?.phase, soundEnabled]);

  const snapshot = game.snapshot;
  const phase = snapshot?.phase;
  const questionId = snapshot?.question?.questionId;
  const nextQuestion = game.nextQuestion;

  useEffect(() => {
    if (
      !autoAdvance ||
      phase !== 'REVEAL' ||
      !questionId ||
      autoAdvancedQuestion.current === questionId
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      autoAdvancedQuestion.current = questionId;
      nextQuestion();
    }, 2_000);
    return () => window.clearTimeout(timer);
  }, [autoAdvance, nextQuestion, phase, questionId]);

  return (
    <div className="live-experience live-host-experience">
      <header className="live-control-bar">
        <div className="live-pin">
          <span>رمز الغرفة</span>
          <strong dir="ltr">{roomCode}</strong>
        </div>
        <div className="live-qr">
          <QRCode value={joinUrl} size={74} bgColor="var(--qr-paper)" fgColor="var(--qr-ink)" />
        </div>
        <div className="live-participant-count">
          <span>المشاركون</span>
          <strong>{(snapshot?.participantCount ?? 0).toLocaleString('ar-SA')}</strong>
        </div>
        <div className="live-control-actions">
          <button
            type="button"
            className="live-icon-button"
            aria-label={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
            aria-pressed={!soundEnabled}
            onClick={() => setSoundEnabled((value) => !value)}
          >
            {soundEnabled ? <Volume2 /> : <VolumeX />}
          </button>
          <button
            type="button"
            className="live-icon-button"
            aria-label="إعدادات العرض"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((value) => !value)}
          >
            <Settings />
          </button>
          <span className={game.connected ? 'live-online' : 'live-offline'}>
            {game.connected ? <Wifi /> : <WifiOff />}
            {game.connected ? 'متصل' : 'يعيد الاتصال'}
          </span>
        </div>
      </header>

      {settingsOpen && (
        <Card className="live-settings-panel">
          <div>
            <strong>إعدادات العرض</strong>
            <p>التوقيت من الخادم، والانتقال لا يحدث إلا بعد الكشف.</p>
          </div>
          <button
            type="button"
            className="live-auto-advance"
            aria-pressed={autoAdvance}
            onClick={() => setAutoAdvance((value) => !value)}
          >
            <span>الانتقال التلقائي</span>
            <strong>{autoAdvance ? 'مفعّل' : 'متوقف'}</strong>
          </button>
        </Card>
      )}
      {game.message && (
        <p className="live-status-message" role="status">
          {game.message}
        </p>
      )}

      {!snapshot || snapshot.phase === 'LOBBY' ? (
        <Card className="live-lobby">
          <span className="eyebrow">الغرفة جاهزة</span>
          <h2>شارك الرمز، ثم ابدأ السؤال الأول</h2>
          <p>سيصل السؤال إلى جميع الأجهزة مع وقت نهاية واحد صادر من الخادم.</p>
          <Button type="button" size="lg" onClick={game.startQuestion} disabled={game.busy}>
            بدء السؤال الأول
          </Button>
        </Card>
      ) : snapshot.phase === 'FINISHED' ? (
        <Leaderboard title="النتائج النهائية" players={snapshot.leaderboard} />
      ) : snapshot.phase === 'LEADERBOARD' ? (
        <Leaderboard title="الترتيب الحالي" players={snapshot.leaderboard} />
      ) : snapshot.question ? (
        <>
          <LiveQuestionStage
            question={snapshot.question}
            phase={snapshot.phase}
            reveal={snapshot.reveal}
            stats={game.stats}
            clockOffset={game.clockOffset}
          />
          <div className="live-host-footer">
            <span role="status">
              {(game.stats?.answeredCount ?? 0).toLocaleString('ar-SA')} من{' '}
              {(game.stats?.participantCount ?? snapshot.participantCount).toLocaleString('ar-SA')}{' '}
              أجابوا
            </span>
            {snapshot.phase === 'REVEAL' && (
              <Button
                type="button"
                onClick={game.nextQuestion}
                disabled={game.busy}
                aria-disabled={game.busy}
              >
                <SkipForward />
                التالي
              </Button>
            )}
          </div>
        </>
      ) : null}

      {snapshot?.phase !== 'FINISHED' && (
        <Button
          type="button"
          variant="destructive"
          className="live-finish-button"
          onClick={game.finishGame}
          disabled={game.busy}
        >
          <Square />
          إنهاء الجلسة
        </Button>
      )}
    </div>
  );
}

function Leaderboard({
  title,
  players,
}: {
  title: string;
  players: { id: string; name: string; score: number; rank: number }[];
}) {
  return (
    <Card className="live-leaderboard">
      <h2>{title}</h2>
      {players.length === 0 ? (
        <p>لا توجد نتائج حتى الآن.</p>
      ) : (
        <ol>
          {players.slice(0, 10).map((player) => (
            <li key={player.id}>
              <span>{player.rank.toLocaleString('ar-SA')}</span>
              <strong>{player.name}</strong>
              <b>{player.score.toLocaleString('ar-SA')}</b>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
