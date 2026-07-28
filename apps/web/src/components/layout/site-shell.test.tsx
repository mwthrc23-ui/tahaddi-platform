import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Header, SiteLayout } from './site-shell';

const signOut = vi.hoisted(() => vi.fn());

vi.mock('next-auth/react', () => ({ signOut }));
vi.mock('../theme-toggle', () => ({
  ThemeToggle: () => <button type="button">المظهر</button>,
}));

describe('Header user menu', () => {
  beforeEach(() => signOut.mockReset());

  it('يعرض إجراءات الزائر مرة واحدة ويدير التركيز والإغلاق', async () => {
    const user = userEvent.setup();
    render(<Header />);
    const trigger = screen.getByRole('button', { name: 'قائمة المستخدم' });

    await user.click(trigger);
    const menuItems = screen.getAllByRole('menuitem');
    const menuLabels = menuItems.map((item: HTMLElement) => item.textContent);
    expect(menuLabels).toEqual(['تسجيل الدخول', 'إنشاء حساب']);
    expect(new Set(menuLabels).size).toBe(menuItems.length);
    expect(menuItems[0]).toHaveFocus();
    expect(screen.queryByRole('menuitem', { name: 'الملف الشخصي' })).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    fireEvent.pointerDown(document.body);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('يمرر مستخدم الجلسة ويعرض إجراءات الحساب دون إجراءات الزائر', async () => {
    const user = userEvent.setup();
    render(
      <SiteLayout user={{ name: 'سارة' }}>
        <p>المحتوى</p>
      </SiteLayout>,
    );

    const trigger = screen.getByRole('button', { name: 'قائمة المستخدم: سارة' });
    await user.click(trigger);

    expect(screen.getByText('سارة')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'الملف الشخصي' })).toHaveAttribute(
      'href',
      '/profile',
    );
    expect(screen.getByRole('menuitem', { name: 'لوحة التحكم' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    expect(screen.queryByRole('menuitem', { name: 'تسجيل الدخول' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'إنشاء حساب' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('menuitem', { name: 'تسجيل الخروج' }));
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('لا يعرض روابط الشاشات التدريبية في التنقل العام', () => {
    render(
      <SiteLayout>
        <p>المحتوى</p>
      </SiteLayout>,
    );

    expect(screen.queryByText('الشاشات التجريبية')).not.toBeInTheDocument();
    expect(document.querySelector('a[href^="/demo/"]')).not.toBeInTheDocument();
    for (const link of screen.getAllByRole('link', { name: 'انضم إلى مسابقة' })) {
      expect(link).toHaveAttribute('href', '/join');
    }
  });

  it('يعرض تنقل الصفحة الرئيسية وإجراءاتها في نسختَي سطح المكتب والجوال', async () => {
    const user = userEvent.setup();
    render(
      <SiteLayout variant="home">
        <p>المحتوى</p>
      </SiteLayout>,
    );

    const desktopNavigation = screen.getByRole('navigation', { name: 'التنقل الرئيسي' });
    expect(within(desktopNavigation).getByRole('link', { name: 'كيف تعمل؟' })).toHaveAttribute(
      'href',
      '/#how',
    );
    expect(within(desktopNavigation).getByRole('link', { name: 'أنماط اللعب' })).toHaveAttribute(
      'href',
      '/#games',
    );
    expect(screen.getByRole('link', { name: 'انضم برمز' })).toHaveAttribute('href', '/join');
    for (const link of screen.getAllByRole('link', { name: 'أنشئ مسابقة' })) {
      expect(link).toHaveAttribute('href', '/quizzes/new');
    }
    expect(screen.queryByRole('button', { name: 'المظهر' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'فتح القائمة' }));
    const mobileNavigation = screen.getByRole('navigation', { name: 'قائمة الجوال' });
    expect(within(mobileNavigation).getByRole('link', { name: 'انضم برمز' })).toHaveAttribute(
      'href',
      '/join',
    );
    expect(within(mobileNavigation).getByRole('link', { name: 'أنشئ مسابقة' })).toHaveAttribute(
      'href',
      '/quizzes/new',
    );
  });
});
