import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LiveQuestionStage } from './live-question-stage';

const question = {
  questionId: 'question-1',
  prompt: 'اختر الإجابة الصحيحة',
  options: [
    { id: 'a', text: 'الخيار الأول', position: 0 },
    { id: 'b', text: 'الخيار الثاني', position: 1 },
    { id: 'c', text: 'الخيار الثالث', position: 2 },
    { id: 'd', text: 'الخيار الرابع', position: 3 },
  ],
  media: [],
  questionStartedAt: Date.now(),
  questionEndsAt: Date.now() + 20_000,
  questionNumber: 1,
  totalQuestions: 4,
};

describe('LiveQuestionStage', () => {
  it('renders accessible touch answers without revealing correctness during QUESTION', () => {
    render(
      <LiveQuestionStage
        question={question}
        phase="QUESTION"
        reveal={null}
        stats={null}
        clockOffset={0}
        onSelect={() => undefined}
      />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(screen.getByRole('button', { name: /مثلث أحمر: الخيار الأول/ })).toBeEnabled();
    expect(screen.queryByLabelText('صحيحة')).not.toBeInTheDocument();
  });

  it('keeps the four answer positions and shows reveal marks and percentages', () => {
    const { container } = render(
      <LiveQuestionStage
        question={question}
        phase="REVEAL"
        reveal={{
          questionId: 'question-1',
          correctOptionId: 'b',
          explanation: null,
          stats: {
            questionId: 'question-1',
            answeredCount: 3,
            participantCount: 3,
            options: [
              { optionId: 'a', count: 1, percentage: 33 },
              { optionId: 'b', count: 2, percentage: 67 },
              { optionId: 'c', count: 0, percentage: 0 },
              { optionId: 'd', count: 0, percentage: 0 },
            ],
          },
        }}
        stats={{
          questionId: 'question-1',
          answeredCount: 3,
          participantCount: 3,
          options: [
            { optionId: 'a', count: 1, percentage: 33 },
            { optionId: 'b', count: 2, percentage: 67 },
            { optionId: 'c', count: 0, percentage: 0 },
            { optionId: 'd', count: 0, percentage: 0 },
          ],
        }}
        clockOffset={0}
      />,
    );
    expect(container.querySelectorAll('.live-answer-tile')).toHaveLength(4);
    expect(screen.getByLabelText('صحيحة')).toBeInTheDocument();
    expect(screen.getAllByLabelText('خاطئة')).toHaveLength(3);
    expect(screen.getByText(/٢ · ٦٧٪/)).toBeInTheDocument();
  });

  it('reserves four stable slots for two-option questions', () => {
    const { container } = render(
      <LiveQuestionStage
        question={{ ...question, options: question.options.slice(0, 2) }}
        phase="QUESTION"
        reveal={null}
        stats={null}
        clockOffset={0}
        onSelect={() => undefined}
      />,
    );
    expect(container.querySelectorAll('.live-answer-tile')).toHaveLength(2);
    expect(container.querySelectorAll('.live-answer-placeholder')).toHaveLength(2);
  });
});
