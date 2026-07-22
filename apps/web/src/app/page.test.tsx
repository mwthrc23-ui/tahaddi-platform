import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/components/theme-provider';
import HomePage from './page';

const push = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/components/motion/reveal', () => ({
  Reveal: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

describe('HomePage actions', () => {
  const renderHomePage = () => render(<ThemeProvider><HomePage /></ThemeProvider>);

  beforeEach(() => {
    push.mockReset();
    localStorage.clear();
  });

  it('validates the room code and navigates to the waiting room', async () => {
    renderHomePage();
    const roomCode = screen.getByRole('textbox', { name: 'رمز الغرفة' });

    fireEvent.change(roomCode, { target: { value: '12' } });
    await userEvent.click(screen.getByRole('button', { name: 'انضم الآن' }));
    expect(screen.getByText('الرمز يجب أن يتكوّن من ٦ أرقام بالضبط.')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();

    fireEvent.change(roomCode, { target: { value: '582 914' } });
    await userEvent.click(screen.getByRole('button', { name: 'انضم الآن' }));
    expect(push).toHaveBeenCalledWith('/demo/waiting?code=582914');
  });

  it('exposes working destinations for creation, listing, cards, and the user menu', async () => {
    renderHomePage();

    for (const link of screen.getAllByRole('link', { name: 'أنشئ مسابقة' })) {
      expect(link).toHaveAttribute('href', '/quizzes/new');
    }
    expect(screen.getByRole('link', { name: 'أنشئ مسابقتك' })).toHaveAttribute('href', '/quizzes/new');
    expect(screen.getByRole('link', { name: /دقيقة ذكاء/ })).toHaveAttribute(
      'href',
      '/demo/question?mode=speed',
    );

    await userEvent.click(screen.getByRole('button', { name: 'قائمة المستخدم' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'الملف الشخصي' })).toHaveAttribute('href', '/profile');
    expect(screen.getByRole('menuitem', { name: 'لوحة التحكم' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('menuitem', { name: 'تسجيل الدخول' })).toHaveAttribute('href', '/auth/sign-in');
  });
});
