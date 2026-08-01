import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/components/theme-provider';
import GamesPage from './page';

vi.mock('@/lib/auth/session', () => ({
  getCurrentSession: vi.fn().mockResolvedValue(null),
}));

describe('GamesPage', () => {
  it('presents choosing a round rule clearly and marks the pit as upcoming', async () => {
    render(<ThemeProvider>{await GamesPage()}</ThemeProvider>);

    expect(screen.getByRole('heading', { name: 'اختر قانون الجولة' })).toBeInTheDocument();
    expect(screen.getByText('اختر نمط اللعب أولًا، ثم افتح الغرفة وشارك رمز الدعوة.')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'قوانين الجولة المتاحة' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /العالم الموازي/ })).toHaveAttribute(
      'href',
      '/games/parallel-world',
    );
    expect(screen.getByRole('link', { name: /الزمن المقلوب/ })).toHaveAttribute(
      'href',
      '/games/reverse-time',
    );
    expect(screen.getByText('الحفرة')).toBeInTheDocument();
    expect(screen.getByText('قريبًا')).toBeInTheDocument();
    expect(screen.getAllByText('قانون اللعب')).toHaveLength(3);
    expect(screen.queryByRole('link', { name: /الحفرة/ })).not.toBeInTheDocument();
  });
});
