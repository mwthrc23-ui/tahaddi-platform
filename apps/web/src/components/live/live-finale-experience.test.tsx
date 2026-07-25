import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FINALE_REVEAL_DELAY,
  FINALE_REVEAL_INTERVAL,
  LiveFinaleExperience,
  type FinalePlayer,
} from './live-finale-experience';

const players: FinalePlayer[] = [
  { id: 'player-1', name: 'سارة العتيبي', score: 9_800, rank: 1 },
  { id: 'player-2', name: 'محمد القحطاني', score: 9_200, rank: 2 },
  { id: 'player-3', name: 'نورة الحربي', score: 8_700, rank: 3 },
  { id: 'player-4', name: 'خالد الدوسري', score: 8_100, rank: 4 },
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
    expect(screen.queryByText('محمد القحطاني')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(FINALE_REVEAL_INTERVAL));
    expect(screen.getByText('محمد القحطاني')).toBeInTheDocument();
    expect(screen.queryByText('سارة العتيبي')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(FINALE_REVEAL_INTERVAL));
    expect(screen.getByText('سارة العتيبي')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(FINALE_REVEAL_INTERVAL));
    expect(screen.getByRole('heading', { name: 'النتيجة النهائية' })).toBeInTheDocument();
    expect(screen.getByLabelText('منصة الفائزين')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ترتيب المتسابقين' })).toBeInTheDocument();
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
    expect(screen.getByText('خالد الدوسري').closest('li')).toHaveClass('is-current-player');
  });

  it('can replay the ceremony after showing the final result', () => {
    render(<LiveFinaleExperience players={players} soundEnabled={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'عرض النتيجة الآن' }));
    fireEvent.click(screen.getByRole('button', { name: 'إعادة التتويج' }));

    expect(screen.getByText('استعدوا لإعلان المراكز الثلاثة الأولى')).toBeInTheDocument();
  });
});
