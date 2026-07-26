import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InstantGameRoom } from './instant-game-room';

describe('InstantGameRoom', () => {
  it('starts the memory game with four accessible symbols', async () => {
    render(<InstantGameRoom mode="memory-flash" />);

    fireEvent.click(screen.getByRole('button', { name: 'ابدأ التحدّي' }));

    expect(screen.getByRole('button', { name: 'برق' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'نجمة' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('المستوى ١')).toBeInTheDocument());
  });

  it('awards points for a solved Arabic word', () => {
    render(<InstantGameRoom mode="word-code" />);

    fireEvent.click(screen.getByRole('button', { name: 'ابدأ التحدّي' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'اكتب الكلمة الصحيحة' }), {
      target: { value: 'السعودية' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'تحقق' }));

    expect(screen.getByText('إجابة صحيحة! +١٠٠')).toBeInTheDocument();
    expect(screen.getByLabelText('حالة اللعبة')).toHaveTextContent('الرصيد ١٠٠');
  });

  it('scores the ink color instead of the written word', () => {
    render(<InstantGameRoom mode="color-rush" />);

    fireEvent.click(screen.getByRole('button', { name: 'ابدأ التحدّي' }));
    fireEvent.click(screen.getByRole('button', { name: 'أزرق' }));

    expect(screen.getByText('خاطف! +٧٥')).toBeInTheDocument();
    expect(screen.getByLabelText('حالة اللعبة')).toHaveTextContent('الرصيد ٧٥');
  });
});
