import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/components/theme-provider';
import GamesPage from './page';

vi.mock('@/lib/auth/session', () => ({
  getCurrentSession: vi.fn().mockResolvedValue(null),
}));

describe('GamesPage', () => {
  it('lists the featured games and marks the pit as upcoming', async () => {
    render(<ThemeProvider>{await GamesPage()}</ThemeProvider>);

    expect(screen.getByRole('heading', { name: 'الألعاب المميزة' })).toBeInTheDocument();
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
    expect(screen.queryByRole('link', { name: /الحفرة/ })).not.toBeInTheDocument();
  });
});
