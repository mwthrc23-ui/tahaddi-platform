'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  GamePhase,
  QuestionPayload,
  QuestionRevealPayload,
  QuestionStatsPayload,
} from '@tahaddi/contracts';
import { getQuestionRemainingMs } from '@tahaddi/contracts';

const optionVisuals = [
  { symbol: '▲', className: 'live-option-red', label: 'مثلث أحمر' },
  { symbol: '◆', className: 'live-option-blue', label: 'معين أزرق' },
  { symbol: '●', className: 'live-option-orange', label: 'دائرة برتقالية' },
  { symbol: '■', className: 'live-option-green', label: 'مربع أخضر' },
] as const;

export function LiveCountdown({
  question,
  clockOffset,
}: {
  question: QuestionPayload;
  clockOffset: number;
}) {
  const duration = Math.max(1, question.questionEndsAt - question.questionStartedAt);
  const [remaining, setRemaining] = useState(() =>
    getQuestionRemainingMs(question.questionEndsAt, clockOffset),
  );

  useEffect(() => {
    const update = () => setRemaining(getQuestionRemainingMs(question.questionEndsAt, clockOffset));
    update();
    const timer = window.setInterval(update, 100);
    return () => window.clearInterval(timer);
  }, [clockOffset, question.questionEndsAt]);

  const seconds = Math.ceil(remaining / 1_000);
  const progress = Math.max(0, Math.min(1, remaining / duration));

  return (
    <div
      className="live-countdown"
      style={{ '--timer-progress': progress } as React.CSSProperties}
      role="timer"
      aria-label={`متبقي ${seconds.toLocaleString('ar-SA')} ثانية`}
    >
      <strong>{seconds.toLocaleString('ar-SA')}</strong>
      <span>ثانية</span>
    </div>
  );
}

function QuestionMedia({ question }: { question: QuestionPayload }) {
  if (question.media.length === 0) {
    return <div className="live-media live-media-empty" aria-hidden="true" />;
  }
  return (
    <div className="live-media">
      {question.media.slice(0, 2).map((media) =>
        media.type === 'video' ? (
          <video key={media.url} src={media.url} controls preload="metadata" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={media.url} src={media.url} alt={media.alt ?? 'وسائط السؤال'} />
        ),
      )}
    </div>
  );
}

export function LiveQuestionStage({
  question,
  phase,
  reveal,
  stats,
  clockOffset,
  selectedOptionId,
  onSelect,
  disabled = false,
}: {
  question: QuestionPayload;
  phase: GamePhase;
  reveal: QuestionRevealPayload | null;
  stats: QuestionStatsPayload | null;
  clockOffset: number;
  selectedOptionId?: string;
  onSelect?: (optionId: string) => void;
  disabled?: boolean;
}) {
  const statsByOption = useMemo(
    () => new Map(stats?.options.map((item) => [item.optionId, item]) ?? []),
    [stats],
  );
  const slots = Array.from({ length: 4 }, (_, index) => question.options[index] ?? null);

  return (
    <section className="live-question-stage" aria-live="polite">
      <div className="live-question-heading">
        <div>
          <span>
            السؤال {question.questionNumber.toLocaleString('ar-SA')} من{' '}
            {question.totalQuestions.toLocaleString('ar-SA')}
          </span>
          <h2>{question.prompt}</h2>
        </div>
        {phase === 'QUESTION' && <LiveCountdown question={question} clockOffset={clockOffset} />}
      </div>

      <QuestionMedia question={question} />

      <div className="live-answer-grid" role="group" aria-label="خيارات الإجابة">
        {slots.map((option, index) => {
          const visual = optionVisuals[index] ?? optionVisuals[0];
          if (!option) {
            return <span className="live-answer-placeholder" key={`empty-${index}`} />;
          }
          const optionStats = statsByOption.get(option.id);
          const correct = reveal?.correctOptionId === option.id;
          const wrong = Boolean(reveal && !correct);
          const selected = selectedOptionId === option.id;
          return (
            <button
              type="button"
              key={option.id}
              className={`live-answer-tile ${visual.className} ${
                correct ? 'is-correct' : wrong ? 'is-wrong' : ''
              } ${selected ? 'is-selected' : ''}`}
              onClick={() => onSelect?.(option.id)}
              disabled={disabled || phase !== 'QUESTION' || !onSelect}
              aria-pressed={selected}
              aria-label={`${visual.label}: ${option.text}`}
            >
              <span className="live-answer-symbol" aria-hidden="true">
                {visual.symbol}
              </span>
              <span className="live-answer-copy">{option.text}</span>
              {reveal && (
                <span className="live-answer-result" aria-label={correct ? 'صحيحة' : 'خاطئة'}>
                  <strong aria-hidden="true">{correct ? '✓' : '×'}</strong>
                  <small>
                    {(optionStats?.count ?? 0).toLocaleString('ar-SA')} ·{' '}
                    {(optionStats?.percentage ?? 0).toLocaleString('ar-SA')}٪
                  </small>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
