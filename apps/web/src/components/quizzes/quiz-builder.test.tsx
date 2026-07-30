import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { QuizBuilder } from './quiz-builder';

describe('QuizBuilder', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('يحفظ المسودة الحالية على الجهاز', async () => {
    const user = userEvent.setup();
    render(<QuizBuilder />);

    const title = screen.getByLabelText('عنوان المسابقة');
    await user.clear(title);
    await user.type(title, 'مسابقة محفوظة');
    await user.click(screen.getByRole('button', { name: 'حفظ المسودة محليًا' }));

    expect(JSON.parse(localStorage.getItem('tahaddi:quiz-builder:draft:v1') ?? '{}')).toMatchObject(
      {
        version: 2,
        title: 'مسابقة محفوظة',
        autoLockAnswers: true,
        autoAdvance: false,
        speedScoring: true,
      },
    );
    expect(screen.getByRole('status')).toHaveTextContent('حُفظت المسودة محليًا على هذا الجهاز.');
  });

  it('يبحث في الأسئلة المتاحة بالعنوان أو الفئة', async () => {
    const user = userEvent.setup();
    render(
      <QuizBuilder
        availableQuestions={[
          {
            id: 'history-1',
            prompt: 'من هو أول الخلفاء الراشدين؟',
            category: 'تاريخ إسلامي',
            duration: 25,
            points: 1200,
          },
          {
            id: 'science-1',
            prompt: 'ما العنصر الكيميائي الذي رمزه O؟',
            category: 'علوم',
            duration: 20,
            points: 1100,
          },
        ]}
      />,
    );

    await user.type(screen.getByRole('searchbox', { name: 'ابحث في بنك الأسئلة' }), 'علوم');

    expect(screen.getByText('ما العنصر الكيميائي الذي رمزه O؟')).toBeInTheDocument();
    expect(screen.queryByText('من هو أول الخلفاء الراشدين؟')).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'نتائج بنك الأسئلة' })).toHaveTextContent(
      'سؤال واحد',
    );
  });
});
