'use client';

import { ArrowRight, Brain, Check, Clock3, Lightbulb, RotateCcw, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card } from '@/components/ui';
import { toArabicDigits } from '@/lib/utils';
import {
  COLOR_RUSH_BANK,
  INSTANT_GAME_META,
  MEMORY_SYMBOL_BANK,
  type InstantGameMode,
  WORD_CODE_BANK,
} from './game-data';

function ScoreBar({ score, seconds }: { score: number; seconds: number }) {
  return (
    <div className="instant-scorebar" aria-label="حالة اللعبة">
      <span>
        <Sparkles aria-hidden="true" />
        الرصيد <b>{toArabicDigits(score)}</b>
      </span>
      <span data-ending={seconds <= 10 || undefined}>
        <Clock3 aria-hidden="true" />
        الوقت <b>{toArabicDigits(seconds)}</b>
      </span>
    </div>
  );
}

function MemoryFlash() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [preview, setPreview] = useState(false);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(60);
  const [started, setStarted] = useState(false);

  const addLevel = useCallback(() => {
    setSequence((current) => [...current, Math.floor(Math.random() * MEMORY_SYMBOL_BANK.length)]);
    setInputIndex(0);
    setPreview(true);
  }, []);

  const start = () => {
    setSequence([]);
    setLives(3);
    setScore(0);
    setSeconds(60);
    setStarted(true);
    window.setTimeout(addLevel, 0);
  };

  useEffect(() => {
    if (!preview) return;
    const timer = window.setTimeout(() => setPreview(false), 900 + sequence.length * 220);
    return () => window.clearTimeout(timer);
  }, [preview, sequence.length]);

  useEffect(() => {
    if (!started || seconds <= 0 || lives <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [lives, seconds, started]);

  const finished = started && (seconds === 0 || lives === 0);

  const choose = (symbolIndex: number) => {
    if (preview || finished) return;
    if (sequence[inputIndex] !== symbolIndex) {
      const nextLives = lives - 1;
      setLives(nextLives);
      setInputIndex(0);
      if (nextLives > 0) setPreview(true);
      return;
    }
    if (inputIndex + 1 === sequence.length) {
      setScore((value) => value + sequence.length * 25);
      window.setTimeout(addLevel, 260);
      return;
    }
    setInputIndex((value) => value + 1);
  };

  return (
    <>
      <ScoreBar score={score} seconds={seconds} />
      <Card className="instant-board">
        {!started ? (
          <div className="instant-intro">
            <Brain aria-hidden="true" />
            <h2>احفظ الومضة وأعد ترتيبها</h2>
            <p>يُضاف رمز جديد في كل مستوى. لديك ثلاث محاولات وستون ثانية.</p>
            <Button variant="gold" size="lg" onClick={start}>
              ابدأ التحدّي
            </Button>
          </div>
        ) : finished ? (
          <div className="instant-intro" role="status">
            <Sparkles aria-hidden="true" />
            <h2>جمعت {toArabicDigits(score)} نقطة</h2>
            <p>وصلت إلى تسلسل من {toArabicDigits(sequence.length)} رموز.</p>
            <Button variant="gold" size="lg" onClick={start}>
              <RotateCcw aria-hidden="true" />
              العب مرة أخرى
            </Button>
          </div>
        ) : (
          <>
            <div className="memory-progress">
              <span>المستوى {toArabicDigits(sequence.length)}</span>
              <span>المحاولات {'●'.repeat(lives)}</span>
            </div>
            <div className="memory-preview" aria-live="polite">
              {preview
                ? sequence.map((item, index) => (
                    <strong key={`${item}-${index}`}>{MEMORY_SYMBOL_BANK[item]?.value}</strong>
                  ))
                : `أعد التسلسل — بقي ${toArabicDigits(sequence.length - inputIndex)}`}
            </div>
            <div className="memory-pad">
              {MEMORY_SYMBOL_BANK.map((symbol, index) => (
                <button
                  type="button"
                  key={symbol.label}
                  aria-label={symbol.label}
                  disabled={preview}
                  onClick={() => choose(index)}
                >
                  {symbol.value}
                </button>
              ))}
            </div>
          </>
        )}
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
      <ScoreBar score={score} seconds={seconds} />
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

function ColorRush() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(45);
  const [started, setStarted] = useState(false);
  const [message, setMessage] = useState('');
  const wordIndex = round % COLOR_RUSH_BANK.length;
  const inkIndex = (round * 3 + 1) % COLOR_RUSH_BANK.length;

  const start = () => {
    setRound(0);
    setScore(0);
    setSeconds(45);
    setMessage('');
    setStarted(true);
  };

  useEffect(() => {
    if (!started || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [seconds, started]);

  const choose = (index: number) => {
    if (index === inkIndex) {
      setScore((value) => value + 75);
      setMessage('خاطف! +٧٥');
    } else {
      setScore((value) => Math.max(0, value - 25));
      setMessage('ركّز على اللون لا الكلمة.');
    }
    setRound((value) => value + 1);
  };

  const finished = started && seconds === 0;

  return (
    <>
      <ScoreBar score={score} seconds={seconds} />
      <Card className="instant-board">
        {!started ? (
          <div className="instant-intro">
            <Sparkles aria-hidden="true" />
            <h2>لا تثق بما تقرأه</h2>
            <p>اختر لون الحبر الظاهر، وتجاهل معنى الكلمة. كل إصابة تمنحك ٧٥ نقطة.</p>
            <Button variant="gold" size="lg" onClick={start}>
              ابدأ التحدّي
            </Button>
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
        ) : (
          <div className="color-rush">
            <span>ما لون الحبر؟</span>
            <strong style={{ color: COLOR_RUSH_BANK[inkIndex]?.value }}>
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
                  {color.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>
    </>
  );
}

export function InstantGameRoom({ mode }: { mode: InstantGameMode }) {
  const meta = useMemo(() => INSTANT_GAME_META[mode], [mode]);

  return (
    <section className="section instant-game">
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
      </div>
    </section>
  );
}
