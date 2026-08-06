'use client';

import {
  ArrowRight,
  Brain,
  Check,
  Clock3,
  Lightbulb,
  Link,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Button, Card } from '@/components/ui';
import { GAME_GUIDES, GameHowTo } from '@/components/games/shared';
import { toArabicDigits } from '@/lib/utils';
import {
  type MemoryDifficulty,
  type MemorySettings,
  MEMORY_DIFFICULTIES,
  MEMORY_MODE_META,
  MEMORY_SYMBOL_BANK,
  COLOR_RUSH_BANK,
  INSTANT_GAME_META,
  WORD_CODE_BANK,
} from './game-data';

const HIGH_SCORE_KEY = 'tahaddi.memory-flash.high-score';

type ComboState = { count: number; multiplier: number };

function getHighScore(difficulty: MemoryDifficulty) {
  try {
    const raw = localStorage.getItem(`${HIGH_SCORE_KEY}.${difficulty}`);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

function setHighScore(difficulty: MemoryDifficulty, value: number) {
  try {
    localStorage.setItem(`${HIGH_SCORE_KEY}.${difficulty}`, String(value));
  } catch {
    // ignore storage errors
  }
}

function getStage(level: number) {
  if (level >= 25) return { label: 'أسطوري', color: '#fbbf24', icon: Trophy };
  if (level >= 18) return { label: 'خبير', color: '#a78bfa', icon: ShieldCheck };
  if (level >= 11) return { label: 'متقدم', color: '#34d399', icon: Zap };
  if (level >= 6) return { label: 'متوسط', color: '#22d3ee', icon: Lightbulb };
  return { label: 'مبتدئ', color: '#f87171', icon: Brain };
}

function ScoreBar({
  score,
  seconds,
  isPaused,
}: {
  score: number;
  seconds: number;
  isPaused: boolean;
}) {
  return (
    <div className="instant-scorebar" aria-label="حالة اللعبة">
      <span>
        <Sparkles aria-hidden="true" />
        الرصيد <b>{toArabicDigits(score)}</b>
      </span>
      <span data-ending={seconds <= 10 || undefined} className={isPaused ? 'is-paused' : ''}>
        {isPaused ? <Pause aria-hidden="true" /> : <Clock3 aria-hidden="true" />}
        {isPaused ? 'متوقف' : `الوقت ${toArabicDigits(seconds)}`}
      </span>
    </div>
  );
}

function ComboBadge({ combo }: { combo: ComboState }) {
  if (combo.count < 3) return null;
  return (
    <div className="memory-combo" aria-live="polite">
      <Zap aria-hidden="true" />
      <span>
        {toArabicDigits(combo.count)} متتالية ×{toArabicDigits(combo.multiplier)}
      </span>
    </div>
  );
}

function StagePill({ level }: { level: number }) {
  const stage = getStage(level);
  const Icon = stage.icon;
  return (
    <div className="memory-stage" style={{ '--stage-color': stage.color } as React.CSSProperties}>
      <Icon aria-hidden="true" />
      <span>{stage.label}</span>
    </div>
  );
}

function PreviewSequence({ sequence, progress }: { sequence: number[]; progress: number }) {
  return (
    <div className="memory-preview-wrap">
      <div
        className="memory-preview-progress"
        style={{ '--preview-progress': progress } as React.CSSProperties}
      />
      <div className="memory-preview" aria-live="polite" aria-label="شاهد التسلسل">
        {sequence.map((symbolIndex, index) => (
          <span
            key={`${symbolIndex}-${index}`}
            className="memory-preview-chip"
            style={
              { '--symbol-color': MEMORY_SYMBOL_BANK[symbolIndex]?.color } as React.CSSProperties
            }
          >
            {MEMORY_SYMBOL_BANK[symbolIndex]?.value}
          </span>
        ))}
      </div>
    </div>
  );
}

function GameSummary({
  score,
  sequence,
  highScore,
  mode,
  bestStage,
  onRestart,
  onModeChange,
}: {
  score: number;
  sequence: number[];
  highScore: number;
  mode: 'solo' | 'versus';
  bestStage: string;
  onRestart: () => void;
  onModeChange: () => void;
}) {
  const isNewRecord = score > 0 && score >= highScore;

  return (
    <div className="instant-intro memory-summary" role="status">
      <div className="memory-summary-header">
        {isNewRecord ? (
          <Trophy aria-hidden="true" className="memory-summary-trophy" />
        ) : (
          <Sparkles aria-hidden="true" />
        )}
        <h2>{isNewRecord ? 'رقم قياسي جديد!' : 'انتهت الجولة'}</h2>
      </div>

      <div className="memory-summary-grid">
        <div className="memory-summary-card">
          <span>الرصيد</span>
          <strong>{toArabicDigits(score)}</strong>
        </div>
        <div className="memory-summary-card">
          <span>أطول تسلسل</span>
          <strong>{toArabicDigits(sequence.length)}</strong>
        </div>
        <div className="memory-summary-card">
          <span>أفضل مرحلة</span>
          <strong style={{ color: getStage(sequence.length).color }}>{bestStage}</strong>
        </div>
        <div className="memory-summary-card">
          <span>الرقم القياسي</span>
          <strong>{toArabicDigits(highScore)}</strong>
        </div>
      </div>

      <div className="instant-actions">
        <Button variant="gold" size="lg" onClick={onRestart}>
          <RotateCcw aria-hidden="true" />
          {mode === 'versus' ? 'جولة جديدة' : 'العب مرة أخرى'}
        </Button>
        {mode === 'versus' && (
          <Button variant="outline" size="lg" onClick={onModeChange}>
            <Users aria-hidden="true" />
            وضع لاعب منفرد
          </Button>
        )}
      </div>
    </div>
  );
}

export function MemoryFlash() {
  const [difficulty, setDifficulty] = useState<MemoryDifficulty>('medium');
  const [mode, setMode] = useState<'solo' | 'versus'>('solo');
  const [sequence, setSequence] = useState<number[]>([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [preview, setPreview] = useState(false);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(60);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [combo, setCombo] = useState<ComboState>({ count: 0, multiplier: 1 });
  const [mistakeSymbol, setMistakeSymbol] = useState<number | null>(null);
  const [lastChoiceCorrect, setLastChoiceCorrect] = useState<boolean | null>(null);
  const [screen, setScreen] = useState<'setup' | 'play' | 'summary'>('setup');
  const [versusState, setVersusState] = useState<{
    score: number;
    lives: number;
    finished: boolean;
  } | null>(null);

  const settings: MemorySettings = useMemo(() => MEMORY_DIFFICULTIES[difficulty], [difficulty]);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishedRef = useRef(false);

  const highScoreForDiff = useMemo(() => getHighScore(difficulty), [difficulty]);

  const clearTimers = useCallback(() => {
    if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);
    if (countdownRef.current) window.clearInterval(countdownRef.current);
    previewTimerRef.current = null;
    countdownRef.current = null;
  }, []);

  const resetState = useCallback(
    (keepDifficulty = true) => {
      clearTimers();
      if (!keepDifficulty) {
        setDifficulty('medium');
        setMode('solo');
      }
      setSequence([]);
      setInputIndex(0);
      setPreview(false);
      setLives(settings.startingLives);
      setScore(0);
      setSeconds(settings.totalSeconds);
      setPaused(false);
      setCombo({ count: 0, multiplier: 1 });
      setMistakeSymbol(null);
      setLastChoiceCorrect(null);
      setVersusState(null);
    },
    [clearTimers, settings],
  );

  const startGame = useCallback(() => {
    resetState(true);
    setStarted(true);
    setScreen('play');
    setLives(settings.startingLives);
    setSeconds(settings.totalSeconds);
    setSequence([]);
    setInputIndex(0);
    setScore(0);
    setCombo({ count: 0, multiplier: 1 });
    setMistakeSymbol(null);
    setLastChoiceCorrect(null);
    setVersusState({ score: 0, lives: settings.startingLives, finished: false });

    window.setTimeout(() => {
      setSequence((current) => [...current, Math.floor(Math.random() * MEMORY_SYMBOL_BANK.length)]);
      setInputIndex(0);
      setPreview(true);
    }, 0);
  }, [resetState, settings]);

  useEffect(() => {
    if (!preview) return;
    const duration = settings.previewBaseMs + sequence.length * settings.previewStepMs;
    previewTimerRef.current = window.setTimeout(
      () => setPreview(false),
      duration,
    ) as unknown as ReturnType<typeof setTimeout>;
    return () => {
      if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);
    };
  }, [preview, sequence.length, settings]);

  useEffect(() => {
    if (!started || screen !== 'play' || paused) return;
    if (seconds <= 0 || lives <= 0) {
      clearTimers();
      const finalScore = score;
      if (finalScore > 0) setHighScore(difficulty, finalScore);
      finishedRef.current = true;
    }
  }, [clearTimers, difficulty, lives, paused, score, seconds, screen, started]);

  useEffect(() => {
    if (finishedRef.current) {
      finishedRef.current = false;
      setScreen('summary');
    }
  }, [screen, started, paused, lives, seconds]);

  useEffect(() => {
    if (!started || screen !== 'play' || paused) return;
    countdownRef.current = window.setInterval(() => {
      setSeconds((value) => Math.max(0, value - 1));
    }, 1000) as unknown as ReturnType<typeof setInterval>;

    return () => {
      if (countdownRef.current) window.clearInterval(countdownRef.current);
    };
  }, [paused, screen, seconds, started]);

  const choose = useCallback(
    (symbolIndex: number) => {
      if (preview || !started || screen !== 'play' || paused) return;

      if (sequence[inputIndex] !== symbolIndex) {
        setMistakeSymbol(symbolIndex);
        setLastChoiceCorrect(false);
        setCombo({ count: 0, multiplier: 1 });

        const nextLives = lives - 1;
        setLives(nextLives);
        setInputIndex(0);

        if (mode === 'versus') {
          setVersusState((value) => ({
            ...value!,
            lives: nextLives,
            finished: nextLives <= 0,
          }));
        }

        if (nextLives > 0) {
          setPreview(true);
        }
        return;
      }

      setLastChoiceCorrect(true);
      setMistakeSymbol(null);

      const newCombo = {
        count: combo.count + 1,
        multiplier: Math.min(4, 2 + Math.floor(combo.count / 4)),
      };
      setCombo(newCombo);

      const points = settings.pointsPerSymbol * newCombo.multiplier;
      setScore((value) => value + points);

      if (mode === 'versus') {
        setVersusState((value) => ({
          ...value!,
          score: value!.score + points,
        }));
      }

      if (inputIndex + 1 === sequence.length) {
        setPreview(false);
        setInputIndex(0);
        setMistakeSymbol(null);
        setLastChoiceCorrect(null);

        previewTimerRef.current = window.setTimeout(() => {
          setSequence((current) => [
            ...current,
            Math.floor(Math.random() * MEMORY_SYMBOL_BANK.length),
          ]);
          setInputIndex(0);
          setPreview(true);
        }, 300) as unknown as ReturnType<typeof setTimeout>;
      } else {
        setInputIndex((value) => value + 1);
      }
    },
    [
      combo.count,
      inputIndex,
      lives,
      mode,
      paused,
      preview,
      screen,
      sequence,
      settings.pointsPerSymbol,
      started,
    ],
  );

  const togglePause = useCallback(() => {
    setPaused((value) => !value);
  }, []);

  const versusScore = mode === 'versus' ? (versusState?.score ?? 0) : 0;
  const bestStage = getStage(sequence.length).label;

  const previewProgress = useMemo(() => {
    if (!preview || sequence.length === 0) return 0;
    const duration = settings.previewBaseMs + sequence.length * settings.previewStepMs;
    return Math.min(1, (sequence.length * settings.previewStepMs) / duration);
  }, [preview, sequence.length, settings]);

  if (screen === 'setup') {
    return (
      <>
        <ScoreBar score={0} seconds={settings.totalSeconds} isPaused={false} />
        <Card className="instant-board memory-setup">
          <div className="memory-setup-hero">
            <Brain aria-hidden="true" />
            <h2>ومضة الذاكرة</h2>
            <p>احفظ التسلسل المتزايد، ثم أعد كتابته بأسرع ما يمكن.</p>
          </div>

          <div className="memory-setup-section">
            <h3>ال modo</h3>
            <div className="memory-mode-grid">
              {(Object.keys(MEMORY_MODE_META) as Array<'solo' | 'versus'>).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`memory-mode-card ${mode === item ? 'is-active' : ''}`}
                  onClick={() => setMode(item)}
                  aria-pressed={mode === item}
                >
                  {item === 'solo' ? <Brain aria-hidden="true" /> : <Users aria-hidden="true" />}
                  <strong>{MEMORY_MODE_META[item].label}</strong>
                  <span>{MEMORY_MODE_META[item].description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="memory-setup-section">
            <h3>الصعوبة</h3>
            <div className="memory-difficulty-grid">
              {(Object.keys(MEMORY_DIFFICULTIES) as MemoryDifficulty[]).map((item) => {
                const cfg = MEMORY_DIFFICULTIES[item];
                const isActive = difficulty === item;
                return (
                  <button
                    key={item}
                    type="button"
                    className={`memory-difficulty-card ${isActive ? 'is-active' : ''}`}
                    onClick={() => setDifficulty(item)}
                    aria-pressed={isActive}
                  >
                    <strong style={{ color: getStage(0).color }}>{cfg.pointsPerSymbol}</strong>
                    <span>نقطة/رمز</span>
                    <small>
                      {toArabicDigits(cfg.startingLives)} أرواح • {toArabicDigits(cfg.totalSeconds)}{' '}
                      ثانية
                    </small>
                  </button>
                );
              })}
            </div>
          </div>

          <Button variant="gold" size="lg" onClick={startGame} className="memory-start-button">
            <Play aria-hidden="true" />
            ابدأ التحدّي
          </Button>
        </Card>
      </>
    );
  }

  if (screen === 'summary') {
    return (
      <>
        <ScoreBar score={score} seconds={seconds} isPaused={false} />
        <Card className="instant-board">
          <GameSummary
            score={score}
            sequence={sequence}
            highScore={highScoreForDiff}
            mode={mode}
            bestStage={bestStage}
            onRestart={startGame}
            onModeChange={() => {
              resetState(false);
              setScreen('setup');
            }}
          />
        </Card>
      </>
    );
  }

  const versusActive = mode === 'versus';

  return (
    <>
      <ScoreBar score={score} seconds={seconds} isPaused={paused} />
      <Card className="instant-board">
        <div className="memory-progress">
          <span>
            المستوى {toArabicDigits(sequence.length)} • {getStage(sequence.length).label}
          </span>
          <span className="memory-lives" aria-label={`المحاولات المتبقية: ${lives}`}>
            {'●'.repeat(Math.max(0, lives))}
            <span className="memory-lives-empty">
              {'○'.repeat(Math.max(0, settings.startingLives - lives))}
            </span>
          </span>
        </div>

        {versusActive && (
          <div className="memory-versus-bar">
            <div className="memory-versus-player">
              <span>أنت</span>
              <strong>{toArabicDigits(score)}</strong>
            </div>
            <div className="memory-versus-divider" aria-hidden="true">
              <span>ضد</span>
            </div>
            <div className="memory-versus-player">
              <span>صديق</span>
              <strong>{toArabicDigits(versusScore)}</strong>
            </div>
          </div>
        )}

        <StagePill level={sequence.length} />
        <ComboBadge combo={combo} />

        {preview ? (
          <PreviewSequence sequence={sequence} progress={previewProgress} />
        ) : (
          <p className="memory-prompt" aria-live="polite">
            {paused
              ? 'إيقاف مؤقت'
              : `أعد التسلسل — بقي ${toArabicDigits(sequence.length - inputIndex)}`}
          </p>
        )}

        {!paused && (
          <div className="memory-pad" role="group" aria-label="أزرار الرموز">
            {MEMORY_SYMBOL_BANK.map((symbol, index) => (
              <button
                type="button"
                key={symbol.label}
                aria-label={symbol.label}
                disabled={preview || !started || screen !== 'play'}
                onClick={() => choose(index)}
                className={`
                  memory-chip
                  ${preview ? 'is-preview' : ''}
                  ${mistakeSymbol === index ? 'is-mistake' : ''}
                  ${lastChoiceCorrect === true ? 'is-correct' : ''}
                `}
                style={{ '--symbol-color': symbol.color } as React.CSSProperties}
              >
                <span className="memory-chip-glow" aria-hidden="true" />
                <span className="memory-chip-symbol">{symbol.value}</span>
              </button>
            ))}
          </div>
        )}

        <div className="instant-actions">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={togglePause}
            disabled={!started || screen !== 'play'}
          >
            {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
            {paused ? 'استمرار' : 'إيقاف مؤقت'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              clearTimers();
              setScreen('summary');
            }}
          >
            <ArrowRight aria-hidden="true" />
            خروج
          </Button>
        </div>
      </Card>
    </>
  );
}

function WordCode() {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(60);
  const [started, setStarted] = useState(false);
  const [message, setMessage] = useState('');
  const puzzle = WORD_CODE_BANK[index % WORD_CODE_BANK.length]!;

  const reset = () => {
    setIndex(0);
    setAnswer('');
    setScore(0);
    setSeconds(60);
    setMessage('');
    setStarted(true);
  };

  useEffect(() => {
    if (!started || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [seconds, started]);

  const next = useCallback(() => {
    setIndex((value) => value + 1);
    setAnswer('');
  }, []);

  const submit = () => {
    if (answer.trim() === puzzle.word) {
      setScore((value) => value + 100);
      setMessage('إجابة صحيحة! +١٠٠');
      window.setTimeout(() => {
        setMessage('');
        next();
      }, 450);
      return;
    }
    setMessage('ليست الشفرة الصحيحة، حاول مرة أخرى.');
  };

  const finished = started && seconds === 0;

  return (
    <>
      <ScoreBar score={score} seconds={seconds} isPaused={false} />
      <Card className="instant-board">
        {!started ? (
          <div className="instant-intro">
            <Lightbulb aria-hidden="true" />
            <h2>فكّ أكبر عدد من الشفرات</h2>
            <p>رتّب الحروف العربية وفق التلميح. كل كلمة صحيحة تمنحك مئة نقطة.</p>
            <Button variant="gold" size="lg" onClick={reset}>
              ابدأ التحدّي
            </Button>
          </div>
        ) : finished ? (
          <div className="instant-intro" role="status">
            <Check aria-hidden="true" />
            <h2>رصيدك {toArabicDigits(score)} نقطة</h2>
            <p>حللت {toArabicDigits(score / 100)} شفرات خلال دقيقة.</p>
            <Button variant="gold" size="lg" onClick={reset}>
              <RotateCcw aria-hidden="true" />
              جولة جديدة
            </Button>
          </div>
        ) : (
          <form
            className="word-code"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <span className="word-code__hint">
              <Lightbulb aria-hidden="true" />
              {puzzle.hint}
            </span>
            <strong className="word-code__scramble" aria-label={`الحروف: ${puzzle.scrambled}`}>
              {puzzle.scrambled}
            </strong>
            <label htmlFor="word-code-answer">اكتب الكلمة الصحيحة</label>
            <input
              id="word-code-answer"
              value={answer}
              onChange={(event) => {
                setAnswer(event.target.value.slice(0, 20));
                setMessage('');
              }}
              autoComplete="off"
              autoFocus
            />
            <p className="word-code__message" aria-live="polite">
              {message}
            </p>
            <div className="instant-actions">
              <Button type="submit" variant="gold" disabled={!answer.trim()}>
                تحقق
              </Button>
              <Button type="button" variant="outline" onClick={next}>
                تخطّ الكلمة
              </Button>
            </div>
          </form>
        )}
      </Card>
    </>
  );
}

const COLOR_BLIND_KEY = 'tahaddi.color-rush.color-blind';

function readColorBlindPreference(): boolean {
  try {
    return localStorage.getItem(COLOR_BLIND_KEY) === '1';
  } catch {
    return false;
  }
}

const colorBlindListeners = new Set<() => void>();

function subscribeColorBlind(listener: () => void) {
  colorBlindListeners.add(listener);
  return () => {
    colorBlindListeners.delete(listener);
  };
}

function writeColorBlindPreference(value: boolean) {
  try {
    localStorage.setItem(COLOR_BLIND_KEY, value ? '1' : '0');
  } catch {
    // ignore storage errors
  }
  colorBlindListeners.forEach((listener) => listener());
}

const COLOR_RUSH_PRACTICE_ATTEMPTS = 5;

function ColorRush() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(45);
  const [started, setStarted] = useState(false);
  const [practice, setPractice] = useState(false);
  const [message, setMessage] = useState('');
  const colorBlind = useSyncExternalStore(
    subscribeColorBlind,
    readColorBlindPreference,
    () => false,
  );
  const wordIndex = round % COLOR_RUSH_BANK.length;
  const inkIndex = (round * 3 + 1) % COLOR_RUSH_BANK.length;

  const toggleColorBlind = () => {
    writeColorBlindPreference(!colorBlind);
  };

  const start = () => {
    setRound(0);
    setScore(0);
    setSeconds(45);
    setMessage('');
    setPractice(false);
    setStarted(true);
  };

  const startPractice = () => {
    setRound(0);
    setScore(0);
    setSeconds(45);
    setMessage('');
    setPractice(true);
    setStarted(true);
  };

  useEffect(() => {
    if (!started || practice || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [seconds, started, practice]);

  const choose = (index: number) => {
    if (index === inkIndex) {
      setMessage(practice ? 'صحيح! هذا هو لون الحبر.' : 'خاطف! +٧٥');
      if (!practice) setScore((value) => value + 75);
    } else {
      setMessage('ركّز على اللون لا الكلمة.');
      if (!practice) setScore((value) => Math.max(0, value - 25));
    }
    setRound((value) => value + 1);
  };

  const finished = started && !practice && seconds === 0;
  const practiceDone = started && practice && round >= COLOR_RUSH_PRACTICE_ATTEMPTS;

  return (
    <>
      <ScoreBar score={score} seconds={seconds} isPaused={false} />
      <Card className="instant-board">
        {!started ? (
          <div className="instant-intro">
            <Sparkles aria-hidden="true" />
            <h2>لا تثق بما تقرأه</h2>
            <p>اختر لون الحبر الظاهر، وتجاهل معنى الكلمة. كل إصابة تمنحك ٧٥ نقطة.</p>
            <div className="instant-actions">
              <Button variant="gold" size="lg" onClick={start}>
                ابدأ التحدّي
              </Button>
              <Button variant="outline" size="lg" onClick={startPractice}>
                جولة تدريبية
              </Button>
            </div>
          </div>
        ) : finished ? (
          <div className="instant-intro" role="status">
            <Check aria-hidden="true" />
            <h2>جمعت {toArabicDigits(score)} نقطة</h2>
            <p>أنهيت {toArabicDigits(round)} محاولة تركيز.</p>
            <Button variant="gold" size="lg" onClick={start}>
              <RotateCcw aria-hidden="true" />
              تحدٍّ جديد
            </Button>
          </div>
        ) : practiceDone ? (
          <div className="instant-intro" role="status">
            <Check aria-hidden="true" />
            <h2>انتهى التدريب!</h2>
            <p>فهمت الفكرة؟ حان وقت التحدّي الحقيقي مع المؤقّت والنقاط.</p>
            <div className="instant-actions">
              <Button variant="gold" size="lg" onClick={start}>
                ابدأ التحدّي
              </Button>
              <Button variant="outline" size="lg" onClick={startPractice}>
                <RotateCcw aria-hidden="true" />
                تدريب من جديد
              </Button>
            </div>
          </div>
        ) : (
          <div className="color-rush" data-color-blind={colorBlind || undefined}>
            {practice ? (
              <span className="color-rush__practice" role="status">
                تدريب بلا وقت ولا نقاط — المحاولة {toArabicDigits(round + 1)} من{' '}
                {toArabicDigits(COLOR_RUSH_PRACTICE_ATTEMPTS)}
              </span>
            ) : null}
            <span>ما لون الحبر؟</span>
            <strong style={{ color: COLOR_RUSH_BANK[inkIndex]?.value }}>
              {colorBlind ? (
                <span
                  className="color-rush__ink-symbol"
                  aria-label={`رمز الحبر: ${COLOR_RUSH_BANK[inkIndex]?.symbolLabel}`}
                >
                  {COLOR_RUSH_BANK[inkIndex]?.symbol}
                </span>
              ) : null}
              {COLOR_RUSH_BANK[wordIndex]?.label}
            </strong>
            <p aria-live="polite">{message}</p>
            <div>
              {COLOR_RUSH_BANK.map((color, index) => (
                <button
                  type="button"
                  key={color.label}
                  style={{ '--rush-color': color.value } as React.CSSProperties}
                  onClick={() => choose(index)}
                >
                  {colorBlind ? (
                    <span className="color-rush__option-symbol" aria-hidden="true">
                      {color.symbol}
                    </span>
                  ) : null}
                  {color.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="color-rush__cb-toggle"
              aria-pressed={colorBlind}
              onClick={toggleColorBlind}
            >
              {colorBlind ? 'إخفاء رموز الألوان' : 'وضع عمى الألوان: إظهار رموز مميزة'}
            </button>
          </div>
        )}
      </Card>
    </>
  );
}

export function InstantGameRoom({ mode }: { mode: 'memory-flash' | 'word-code' | 'color-rush' }) {
  const meta = useMemo(() => INSTANT_GAME_META[mode], [mode]);

  return (
    <section className="section instant-game" data-game={mode}>
      <div className="container instant-shell">
        <Link className="instant-back" href="/games">
          <ArrowRight aria-hidden="true" />
          كل الألعاب
        </Link>
        <header className="instant-head">
          <span>لعبة فورية — لا تحتاج حسابًا</span>
          <h1>{meta.title}</h1>
          <p>{meta.description}</p>
        </header>
        {mode === 'memory-flash' ? (
          <MemoryFlash />
        ) : mode === 'word-code' ? (
          <WordCode />
        ) : (
          <ColorRush />
        )}
        <GameHowTo guide={GAME_GUIDES[mode]} />
      </div>
    </section>
  );
}
