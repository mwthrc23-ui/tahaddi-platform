import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/components/theme-provider';
import HomePage from './page';

const push = vi.hoisted(() => vi.fn());
const joinLiveSessionByCode = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/app/live/actions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/app/live/actions')>();
  return { ...actual, joinLiveSessionByCode };
});

vi.mock('@/components/motion/reveal', () => ({
  Reveal: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

describe('HomePage actions', () => {
  const renderHomePage = () =>
    render(
      <ThemeProvider>
        <HomePage />
      </ThemeProvider>,
    );

  beforeEach(() => {
    push.mockReset();
    joinLiveSessionByCode.mockReset();
    localStorage.clear();
  });

  it('navigates to the live quiz room after server validation succeeds', async () => {
    joinLiveSessionByCode.mockResolvedValue({
      status: 'success',
      sessionId: 'session-123',
      participantId: 'participant-123',
      roomCode: 'A7K9PQ',
    });
    renderHomePage();
    const playerName = screen.getByRole('textbox', { name: 'اسم اللاعب' });
    const roomCode = screen.getByRole('textbox', { name: 'رمز الغرفة' });

    fireEvent.change(playerName, { target: { value: 'نورة' } });
    fireEvent.change(roomCode, { target: { value: 'a7k 9pq' } });
    await userEvent.click(screen.getByRole('button', { name: 'انضم الآن' }));
    expect(joinLiveSessionByCode).toHaveBeenCalledWith('A7K9PQ', 'نورة');
    expect(push).toHaveBeenCalledWith(
      '/live/session-123/play?participantId=participant-123&code=A7K9PQ',
    );
  });

  it('shows the server error and describes the room-code field when joining fails', async () => {
    joinLiveSessionByCode.mockResolvedValue({
      status: 'error',
      message: 'لم نجد مسابقة نشطة بهذا الرمز.',
    });
    renderHomePage();
    const roomCode = screen.getByRole('textbox', { name: 'رمز الغرفة' });

    fireEvent.change(screen.getByRole('textbox', { name: 'اسم اللاعب' }), {
      target: { value: 'نورة' },
    });
    fireEvent.change(roomCode, { target: { value: 'A7K9PQ' } });
    await userEvent.click(screen.getByRole('button', { name: 'انضم الآن' }));

    expect(joinLiveSessionByCode).toHaveBeenCalledWith('A7K9PQ', 'نورة');
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
    expect(screen.getByRole('link', { name: 'أنشئ مسابقتك' })).toHaveAttribute(
      'href',
      '/quizzes/new',
    );
    expect(screen.getByRole('link', { name: /دقيقة ذكاء/ })).toHaveAttribute(
      'href',
      '/demo/question?mode=speed',
    );

    await userEvent.click(screen.getByRole('button', { name: 'قائمة المستخدم' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'تسجيل الدخول' })).toHaveAttribute(
      'href',
      '/auth/sign-in',
    );
    expect(screen.getByRole('menuitem', { name: 'إنشاء حساب' })).toHaveAttribute(
      'href',
      '/auth/sign-up',
    );
    expect(screen.queryByRole('menuitem', { name: 'الملف الشخصي' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'لوحة التحكم' })).not.toBeInTheDocument();
  });
});
