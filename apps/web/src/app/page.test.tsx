import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/components/theme-provider';
import HomePage from './page';

vi.mock('@/components/motion/reveal', () => ({
  Reveal: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('@/app/quizzes/actions', () => ({
  getPublicQuizzes: vi.fn().mockResolvedValue({ status: 'success', quizzes: [] }),
}));

vi.mock('@/lib/auth/session', () => ({
  getCurrentSession: vi.fn().mockResolvedValue(null),
}));

describe('HomePage', () => {
  const renderHomePage = async () => render(<ThemeProvider>{await HomePage()}</ThemeProvider>);

  it('يعرض الواجهة المعتمدة ومسارَي الإنشاء والانضمام دون نموذج داخل البطل', async () => {
    await renderHomePage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'الجولة تبدأ من رمز واحد.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('✨ تجربة مسابقات عربية فاخرة')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /أنشئ أول تحد/ })).toHaveAttribute(
      'href',
      '/quizzes/new',
    );
    expect(screen.getByRole('link', { name: 'لديّ رمز غرفة' })).toHaveAttribute('href', '/join');
    expect(screen.queryByRole('textbox', { name: 'اسم اللاعب' })).not.toBeInTheDocument();

    const roomPreview = screen.getByRole('region', { name: 'معاينة غرفة تحدّي مباشرة' });
    expect(within(roomPreview).getByText('مباشرة')).toBeInTheDocument();
    expect(within(roomPreview).getByText('PQQDJK')).toBeInTheDocument();
    expect(within(roomPreview).getByText('١٢ لاعبًا')).toBeInTheDocument();
  });

  it('يشرح خطوات الجولة ويحتفظ بمزايا المنصة الحقيقية', async () => {
    await renderHomePage();

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'كل شيء أمامك، من الدعوة إلى التتويج.',
      }),
    ).toBeInTheDocument();
    const benefits = screen.getByRole('list', { name: 'مزايا المنصة' });
    expect(within(benefits).getAllByRole('listitem')).toHaveLength(3);
    const steps = screen.getByRole('list', { name: 'خطوات تشغيل المسابقة' });
    expect(within(steps).getAllByRole('listitem')).toHaveLength(3);
    expect(within(steps).getByText('جهّز الجولة')).toBeInTheDocument();
    expect(within(steps).getByText('شارك الرمز')).toBeInTheDocument();
    expect(within(steps).getByText('تابع النتيجة')).toBeInTheDocument();
  });

  it('يرتب رحلة الصفحة من فهم الجولة إلى اختيارها ثم بدء التحدي', async () => {
    await renderHomePage();

    const sectionIds = Array.from(document.querySelectorAll('main > section')).map(
      (section) => section.id,
    );

    expect(sectionIds).toEqual([
      'top',
      'how',
      'games',
      'public-quizzes',
      'categories',
      'features',
      'leaderboard',
      'final-cta',
    ]);
    expect(
      screen.getByRole('region', {
        name: 'افتح الغرفة، أرسل الدعوة، واترك الحماس يعمل.',
      }),
    ).toHaveAttribute('id', 'final-cta');
  });

  it('يبقي روابط الألعاب الحديثة والقائمة العامة عاملة', async () => {
    await renderHomePage();

    for (const link of screen.getAllByRole('link', { name: 'أنشئ مسابقة' })) {
      expect(link).toHaveAttribute('href', '/quizzes/new');
    }
    expect(screen.getByRole('link', { name: 'أنشئ مسابقتك' })).toHaveAttribute(
      'href',
      '/quizzes/new',
    );
    expect(screen.getByRole('link', { name: /دقيقة ذكاء/ })).toHaveAttribute(
      'href',
      '/quizzes/new',
    );
    for (const link of screen.getAllByRole('link', { name: /من هو القاتل؟/ })) {
      expect(link).toHaveAttribute('href', '/mafia');
    }
    expect(screen.getByRole('link', { name: /اختر قانون الجولة/ })).toHaveAttribute(
      'href',
      '/games',
    );
    expect(document.querySelector('a[href^="/demo/"]')).not.toBeInTheDocument();
    expect(screen.getByText('صاحب الموقع: عبدالعزيز بن سلطان العتيبي')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'قائمة المستخدم' }));
    expect(screen.getByRole('menuitem', { name: 'تسجيل الدخول' })).toHaveAttribute(
      'href',
      '/auth/sign-in',
    );
    expect(screen.getByRole('menuitem', { name: 'إنشاء حساب' })).toHaveAttribute(
      'href',
      '/auth/sign-up',
    );
  });
});
