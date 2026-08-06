import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toArabicDigits } from '@/lib/utils';
import {
  COLOR_RUSH_BANK,
  INSTANT_GAME_META,
  INSTANT_GAME_ORDER,
  MEMORY_DIFFICULTIES,
  WORD_CODE_BANK,
} from './game-data';
import { InstantGameRoom, MemoryFlash } from './instant-game-room';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
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

describe('word-code bank integrity', () => {
  it('provides an expanded bank of unique, solvable puzzles', () => {
    expect(WORD_CODE_BANK.length).toBeGreaterThanOrEqual(40);
    const words = WORD_CODE_BANK.map((entry) => entry.word);
    expect(new Set(words).size).toBe(words.length);
    for (const entry of WORD_CODE_BANK) {
      expect(entry.hint.trim().length).toBeGreaterThan(0);
      expect(entry.scrambled).not.toBe(entry.word);
      expect([...entry.scrambled].sort().join('')).toBe([...entry.word].sort().join(''));
    }
  });
});

describe('ColorRush accessibility and practice', () => {
  it('toggles color-blind symbols and persists the preference', () => {
    render(<InstantGameRoom mode="color-rush" />);

    fireEvent.click(screen.getByRole('button', { name: 'ابدأ التحدّي' }));
    const toggle = screen.getByRole('button', { name: /وضع عمى الألوان/ });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'إخفاء رموز الألوان' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByLabelText(/رمز الحبر/)).toBeInTheDocument();
    for (const color of COLOR_RUSH_BANK) {
      const option = screen.getByRole('button', { name: color.label });
      expect(option).toHaveTextContent(color.symbol);
    }
    expect(localStorage.getItem('tahaddi.color-rush.color-blind')).toBe('1');
  });

  it('runs an untimed practice round without scoring, then offers the real challenge', async () => {
    vi.useFakeTimers();
    render(<InstantGameRoom mode="color-rush" />);

    fireEvent.click(screen.getByRole('button', { name: 'جولة تدريبية' }));
    expect(screen.getByText(/تدريب بلا وقت ولا نقاط/)).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    expect(screen.getByLabelText('حالة اللعبة')).toHaveTextContent(`الوقت ${toArabicDigits(45)}`);

    for (let attempt = 0; attempt < 5; attempt++) {
      fireEvent.click(screen.getByRole('button', { name: COLOR_RUSH_BANK[0].label }));
    }
    expect(screen.getByLabelText('حالة اللعبة')).toHaveTextContent('الرصيد ٠');
    expect(screen.getByText('انتهى التدريب!')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'ابدأ التحدّي' }));
    expect(screen.getByText('ما لون الحبر؟')).toBeInTheDocument();
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
