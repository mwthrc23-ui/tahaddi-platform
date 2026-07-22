import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/components/theme-provider';
import HomePage from './page';

const push = vi.hoisted(() => vi.fn());
const joinQuizByCode = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/app/quizzes/actions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/app/quizzes/actions')>();
  return { ...actual, joinQuizByCode };
});

vi.mock('@/components/motion/reveal', () => ({
  Reveal: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

describe('HomePage actions', () => {
  const renderHomePage = () => render(<ThemeProvider><HomePage /></ThemeProvider>);

  beforeEach(() => {
    push.mockReset();
    joinQuizByCode.mockReset();
    localStorage.clear();
  });

  it('navigates to the real quiz waiting room after server validation succeeds', async () => {
    joinQuizByCode.mockResolvedValue({
      status: 'success',
      quizId: 'quiz-123',
      roomCode: 'A7K9PQ',
    });
    renderHomePage();
    const roomCode = screen.getByRole('textbox', { name: 'رمز الغرفة' });

    fireEvent.change(roomCode, { target: { value: 'a7k 9pq' } });
    await userEvent.click(screen.getByRole('button', { name: 'انضم الآن' }));
    expect(joinQuizByCode).toHaveBeenCalledWith('A7K9PQ');
    expect(push).toHaveBeenCalledWith('/demo/waiting?quizId=quiz-123&code=A7K9PQ');
  });

  it('shows the server error and describes the room-code field when joining fails', async () => {
    joinQuizByCode.mockResolvedValue({
      status: 'error',
      message: 'لم نجد مسابقة نشطة بهذا الرمز.',
    });
    renderHomePage();
    const roomCode = screen.getByRole('textbox', { name: 'رمز الغرفة' });

    fireEvent.change(roomCode, { target: { value: 'A7K9PQ' } });
    await userEvent.click(screen.getByRole('button', { name: 'انضم الآن' }));

    expect(joinQuizByCode).toHaveBeenCalledWith('A7K9PQ');
    expect(screen.getByText('لم نجد مسابقة نشطة بهذا الرمز.')).toBeInTheDocument();
    expect(roomCode).toHaveAccessibleDescription('لم نجد مسابقة نشطة بهذا الرمز.');
    expect(roomCode).toHaveAttribute('aria-describedby', 'room-code-message');
    expect(push).not.toHaveBeenCalled();
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
    expect(screen.getByRole('menuitem', { name: 'تسجيل الدخول' })).toHaveAttribute('href', '/auth/sign-in');
    expect(screen.getByRole('menuitem', { name: 'إنشاء حساب' })).toHaveAttribute('href', '/auth/sign-up');
    expect(screen.queryByRole('menuitem', { name: 'الملف الشخصي' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'لوحة التحكم' })).not.toBeInTheDocument();
  });
});
