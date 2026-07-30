import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FINALE_REVEAL_DELAY,
  FINALE_REVEAL_INTERVAL,
  LiveFinaleExperience,
  type FinalePlayer,
} from './live-finale-experience';

const players: FinalePlayer[] = [
  { id: 'player-1', name: 'سارة العتيبي', score: 9_800, rank: 1, correctAnswers: 14 },
  { id: 'player-2', name: 'محمد القحطاني', score: 9_200, rank: 2, correctAnswers: 13 },
  { id: 'player-3', name: 'نورة الحربي', score: 8_700, rank: 3, correctAnswers: 12 },
  { id: 'player-4', name: 'خالد الدوسري', score: 8_100, rank: 4, correctAnswers: 11 },
];

describe('LiveFinaleExperience', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reveals third, second, and first place in that order before the full result', () => {
    render(<LiveFinaleExperience players={players} soundEnabled={false} />);

    expect(screen.getByRole('heading', { name: 'إعلان الفائزين' })).toBeInTheDocument();
    expect(screen.getByText('استعدوا لإعلان المراكز الثلاثة الأولى')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(FINALE_REVEAL_DELAY));
    expect(screen.getByText('نورة الحربي')).toBeInTheDocument();
    expect(screen.getByLabelText('12 إجابة صحيحة')).toBeInTheDocument();
    expect(screen.queryByText('محمد القحطاني')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(FINALE_REVEAL_INTERVAL));
    expect(screen.getByText('محمد القحطاني')).toBeInTheDocument();
    expect(screen.getByLabelText('13 إجابة صحيحة')).toBeInTheDocument();
    expect(screen.queryByText('سارة العتيبي')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(FINALE_REVEAL_INTERVAL));
    expect(screen.getByText('سارة العتيبي')).toBeInTheDocument();
    expect(screen.getByLabelText('14 إجابة صحيحة')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(FINALE_REVEAL_INTERVAL));
    expect(screen.getByRole('heading', { name: 'والصدارة تكتب اسمها' })).toBeInTheDocument();
    expect(screen.getByLabelText('منصة الفائزين')).toBeInTheDocument();
    const ranking = screen.getByRole('heading', { name: 'ترتيب المتسابقين' }).parentElement!;
    expect(within(ranking).getByText('نورة الحربي').closest('li')).toHaveTextContent('١٢ صحيحة');
  });

  it('shows the contestant real rank, score, and field size', () => {
    render(
      <LiveFinaleExperience players={players} participantId="player-4" soundEnabled={false} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'عرض النتيجة الآن' }));
    act(() => vi.runAllTimers());

    const result = screen.getByLabelText('نتيجتك الشخصية');
    expect(result).toHaveTextContent('أكملت الجولة وسُجل ترتيبك النهائي');
    expect(result).toHaveTextContent('٤');
    expect(result).toHaveTextContent('٨٬١٠٠');
    expect(result).toHaveTextContent('١١');
    expect(screen.getByText('خالد الدوسري').closest('li')).toHaveClass('is-current-player');
  });

  it('can replay the ceremony after showing the final result', () => {
    render(<LiveFinaleExperience players={players} soundEnabled={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'عرض النتيجة الآن' }));
    fireEvent.click(screen.getByRole('button', { name: 'إعادة التتويج' }));

    expect(screen.getByText('استعدوا لإعلان المراكز الثلاثة الأولى')).toBeInTheDocument();
  });

  it('shows the final result immediately when reduced motion is preferred', () => {
    vi.mocked(window.matchMedia).mockImplementationOnce(
      (query) =>
        ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as MediaQueryList,
    );

    render(<LiveFinaleExperience players={players} soundEnabled={false} />);
    act(() => vi.runAllTimers());

    expect(screen.getByRole('heading', { name: 'والصدارة تكتب اسمها' })).toBeInTheDocument();
    expect(screen.getByLabelText('منصة الفائزين')).toBeInTheDocument();
  });
});
