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

    expect(JSON.parse(localStorage.getItem('tahaddi-quiz-draft') ?? '{}')).toMatchObject({
      title: 'مسابقة محفوظة',
    });
    expect(screen.getByRole('status')).toHaveTextContent('حُفظت المسودة على هذا الجهاز.');
  });
});
