import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AdminShell } from './admin-shell';

vi.mock('@/components/layout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe('AdminShell navigation', () => {
  it('shows the full console to administrators', () => {
    render(<AdminShell role="ADMIN">المحتوى</AdminShell>);

    expect(screen.getByRole('link', { name: 'المستخدمون' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'سجل النشاط' })).toBeInTheDocument();
    expect(screen.getByText('مدير النظام')).toBeInTheDocument();
  });

  it('limits content editors to their capabilities', () => {
    render(<AdminShell role="CONTENT_EDITOR">المحتوى</AdminShell>);

    expect(screen.getByRole('link', { name: 'المحتوى' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'التقارير' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'المستخدمون' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'الغرف المباشرة' })).not.toBeInTheDocument();
  });

  it('limits moderators to rooms and reports', () => {
    render(<AdminShell role="MODERATOR">المحتوى</AdminShell>);

    expect(screen.getByRole('link', { name: 'الغرف المباشرة' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'التقارير' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'المحتوى' })).not.toBeInTheDocument();
  });
});
