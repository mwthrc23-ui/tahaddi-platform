import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toArabicDigits } from '@/lib/utils';
import { INSTANT_GAME_META, INSTANT_GAME_ORDER, MEMORY_DIFFICULTIES } from './game-data';
import { InstantGameRoom, MemoryFlash } from './instant-game-room';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('MemoryFlash', () => {
  it('starts the memory game with accessible symbols', async () => {
    render(<MemoryFlash />);

    fireEvent.click(screen.getByRole('button', { name: 'ابدأ التحدّي' }));

    expect(screen.getByRole('button', { name: 'برق' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'نجمة' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/المستوى ١/)).toBeInTheDocument());
  });

  it('escalates the memory sequence after a correct level', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<MemoryFlash />);

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
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_200);
    });

    expect(screen.getByText(/المستوى ٢/)).toBeInTheDocument();
  });
});

describe('instant mode catalog contract', () => {
  for (const mode of INSTANT_GAME_ORDER) {
    it(`starts, counts down, finishes, and resets ${mode}`, async () => {
      vi.useFakeTimers();
      const meta = INSTANT_GAME_META[mode];
      const isMemory = mode === 'memory-flash';
      const totalSeconds = isMemory ? MEMORY_DIFFICULTIES.medium.totalSeconds : meta.roundSeconds;

      render(<InstantGameRoom mode={mode} />);

      fireEvent.click(screen.getByRole('button', { name: 'ابدأ التحدّي' }));
      expect(screen.getByLabelText('حالة اللعبة')).toHaveTextContent(
        `الوقت ${toArabicDigits(totalSeconds)}`,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_000);
      });
      expect(screen.getByLabelText('حالة اللعبة')).toHaveTextContent(
        `الوقت ${toArabicDigits(totalSeconds - 1)}`,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync((totalSeconds - 1) * 1_000);
      });
      const restart = screen.getByRole('button', {
        name: /العب مرة أخرى|جولة جديدة|تحدٍّ جديد/,
      });
      fireEvent.click(restart);

      expect(screen.getByLabelText('حالة اللعبة')).toHaveTextContent('الرصيد ٠');
      expect(screen.getByLabelText('حالة اللعبة')).toHaveTextContent(
        `الوقت ${toArabicDigits(totalSeconds)}`,
      );
    });
  }
});
