import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HostQuestionViewer } from './host-question-viewer';

describe('HostQuestionViewer', () => {
  it('shows the current question, correct answer, and the full host-only list', () => {
    render(
      <HostQuestionViewer
        currentPosition={0}
        answeredCount={2}
        activeCount={3}
        questions={[
          {
            questionId: 'quiz-question-1',
            question: {
              id: 'question-1',
              prompt: 'ما عاصمة المملكة؟',
              imageUrl: null,
              category: 'جغرافيا',
              timeLimit: 20,
              basePoints: 1000,
              options: [
                { id: 'option-1', text: 'الرياض', isCorrect: true },
                { id: 'option-2', text: 'جدة', isCorrect: false },
              ],
            },
          },
          {
            questionId: 'quiz-question-2',
            question: {
              id: 'question-2',
              prompt: 'كم عدد الكواكب؟',
              imageUrl: null,
              category: 'علوم',
              timeLimit: 15,
              basePoints: 500,
              options: [
                { id: 'option-3', text: 'ثمانية', isCorrect: true },
                { id: 'option-4', text: 'تسعة', isCorrect: false },
              ],
            },
          },
        ]}
      />,
    );

    expect(screen.getByRole('heading', { name: 'ما عاصمة المملكة؟' })).toBeVisible();
    expect(screen.getByText('٢ من ٣ أجابوا')).toBeVisible();
    expect(screen.getByText('كم عدد الكواكب؟')).toBeVisible();
    expect(screen.getAllByText('الرياض')[0]?.closest('div')).toHaveClass('is-correct');
  });
});
