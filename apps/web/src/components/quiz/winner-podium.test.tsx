import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WinnerPodium } from './quiz-components';

const winners = [
  { name: 'نورة العتيبي', initials: 'نع', score: 9800 },
  { name: 'سلمان القحطاني', initials: 'سق', score: 8700 },
  { name: 'ريم الشهري', initials: 'رش', score: 7600 },
];

describe('WinnerPodium', () => {
  it('keeps winners in semantic rank order while styling their visual positions', () => {
    render(<WinnerPodium winners={winners} />);

    const podium = screen.getByRole('list', { name: 'منصة الفائزين' });
    const entries = within(podium).getAllByRole('listitem');

    expect(entries).toHaveLength(3);
    expect(entries[0]).toHaveTextContent('المركز الأول');
    expect(entries[0]).toHaveTextContent('نورة العتيبي');
    expect(entries[1]).toHaveTextContent('المركز الثاني');
    expect(entries[2]).toHaveTextContent('المركز الثالث');
  });

  it('renders an honest empty state when no results exist', () => {
    render(<WinnerPodium winners={[]} />);

    expect(screen.getByRole('status')).toHaveTextContent('بانتظار النتائج النهائية');
  });
});
