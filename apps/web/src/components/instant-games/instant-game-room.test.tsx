import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toArabicDigits } from '@/lib/utils';
import { INSTANT_GAME_META, INSTANT_GAME_ORDER } from './game-data';
import { InstantGameRoom } from './instant-game-room';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('InstantGameRoom', () => {
  it('starts the memory game with four accessible symbols', async () => {
    render(<InstantGameRoom mode={INSTANT_GAME_ORDER[0]} />);

    fireEvent.click(screen.getByRole('button', { name: 'ابدأ التحدّي' }));

    expect(screen.getByRole('button', { name: 'برق' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'نجمة' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('المستوى ١')).toBeInTheDocument());
  });

  it('awards points for a solved Arabic word', () => {
    render(<InstantGameRoom mode={INSTANT_GAME_ORDER[1]} />);

    fireEvent.click(screen.getByRole('button', { name: 'ابدأ التحدّي' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'اكتب الكلمة الصحيحة' }), {
      target: { value: 'السعودية' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'تحقق' }));

    expect(screen.getByText('إجابة صحيحة! +١٠٠')).toBeInTheDocument();
    expect(screen.getByLabelText('حالة اللعبة')).toHaveTextContent('الرصيد ١٠٠');
  });

  it('scores the ink color instead of the written word', () => {
    render(<InstantGameRoom mode={INSTANT_GAME_ORDER[2]} />);

    fireEvent.click(screen.getByRole('button', { name: 'ابدأ التحدّي' }));
    fireEvent.click(screen.getByRole('button', { name: 'أزرق' }));

    expect(screen.getByText('خاطف! +٧٥')).toBeInTheDocument();
    expect(screen.getByLabelText('حالة اللعبة')).toHaveTextContent('الرصيد ٧٥');
  });

  it('escalates the memory sequence after a correct level', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<InstantGameRoom mode={INSTANT_GAME_ORDER[0]} />);

    fireEvent.click(screen.getByRole('button', { name: 'ابدأ التحدّي' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_200);
    });
    fireEvent.click(screen.getByRole('button', { name: 'برق' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(screen.getByText('المستوى ٢')).toBeInTheDocument();
  });
});

describe('instant mode catalog contract', () => {
  for (const mode of INSTANT_GAME_ORDER) {
    it(`starts, counts down, finishes, and resets ${mode}`, async () => {
      vi.useFakeTimers();
      const meta = INSTANT_GAME_META[mode];
      render(<InstantGameRoom mode={mode} />);

      fireEvent.click(screen.getByRole('button', { name: 'ابدأ التحدّي' }));
      expect(screen.getByLabelText('حالة اللعبة')).toHaveTextContent(
        `الوقت ${toArabicDigits(meta.roundSeconds)}`,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_000);
      });
      expect(screen.getByLabelText('حالة اللعبة')).toHaveTextContent(
        `الوقت ${toArabicDigits(meta.roundSeconds - 1)}`,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync((meta.roundSeconds - 1) * 1_000);
      });
      const restart = screen.getByRole('button', {
        name: /العب مرة أخرى|جولة جديدة|تحدٍّ جديد/,
      });
      fireEvent.click(restart);

      expect(screen.getByLabelText('حالة اللعبة')).toHaveTextContent('الرصيد ٠');
      expect(screen.getByLabelText('حالة اللعبة')).toHaveTextContent(
        `الوقت ${toArabicDigits(meta.roundSeconds)}`,
      );
    });
  }
});
