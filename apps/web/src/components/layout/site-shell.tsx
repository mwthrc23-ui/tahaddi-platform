'use client';

import {
  ChevronLeft,
  Menu,
  PanelRightClose,
  PanelRightOpen,
  Radio,
  Trophy,
  UserCircle2,
  Volume2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { demoNavigation, primaryNavigation } from '@/config/navigation';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '../theme-toggle';
import { Button, ButtonLink } from '../ui';
import { SignOutButton } from '../auth/sign-out-button';

export function Logo() {
  return (
    <Link className="logo" href="/" aria-label={`${siteConfig.name} — الصفحة الرئيسية`}>
      <span>
        <Trophy />
      </span>
      <strong>{siteConfig.name}</strong>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        <nav className="desktop-nav" aria-label="التنقل الرئيسي">
          {primaryNavigation.slice(0, 3).map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <ButtonLink href="/#join" variant="outline" className="hide-mobile">
            انضم إلى مسابقة
          </ButtonLink>
          <ButtonLink href="/quizzes" className="hide-tablet">
            أنشئ مسابقة
          </ButtonLink>
          <ThemeToggle />
          <ButtonLink href="/auth/sign-in" variant="ghost" size="icon" aria-label="تسجيل الدخول">
            <UserCircle2 />
          </ButtonLink>
          <Button
            className="mobile-menu-button"
            variant="ghost"
            size="icon"
            aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <nav className="mobile-nav" aria-label="قائمة الجوال">
          {primaryNavigation.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              <item.icon />
              {item.label}
            </Link>
          ))}
          {demoNavigation.slice(0, 4).map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              <ChevronLeft />
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p>{siteConfig.description}</p>
          <small>© ٢٠٢٦ تحدّي. جميع الحقوق محفوظة.</small>
        </div>
        <div>
          <strong>استكشف</strong>
          {primaryNavigation.slice(1).map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
        <div>
          <strong>الشاشات التجريبية</strong>
          {demoNavigation.slice(0, 4).map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}

export function Breadcrumb({ items }: { items: string[] }) {
  return (
    <nav className="breadcrumb" aria-label="مسار التنقل">
      <Link href="/">الرئيسية</Link>
      {items.map((item) => (
        <span key={item}>
          <ChevronLeft />
          {item}
        </span>
      ))}
    </nav>
  );
}

export function DashboardLayout({
  children,
  title = 'لوحة التحكم',
}: {
  children: ReactNode;
  title?: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={cn('dashboard-layout', collapsed && 'sidebar-collapsed')}>
      <aside className="sidebar">
        <Logo />
        <Button
          variant="ghost"
          size="icon"
          aria-label={collapsed ? 'توسيع الشريط الجانبي' : 'تصغير الشريط الجانبي'}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <PanelRightOpen /> : <PanelRightClose />}
        </Button>
        <nav>
          {primaryNavigation.map((item) => (
            <Link href={item.href} key={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <SignOutButton />
      </aside>
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <Breadcrumb items={[title]} />
            <h1>{title}</h1>
          </div>
          <ThemeToggle />
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

export function HostLayout({
  children,
  players = 24,
  connected = true,
}: {
  children: ReactNode;
  players?: number;
  connected?: boolean;
}) {
  return (
    <div className="host-layout">
      <header>
        <Logo />
        <div>
          <span className={connected ? 'online' : 'offline'}>
            <Radio />
            {connected ? 'متصل' : 'غير متصل'}
          </span>
          <span>{players} لاعبًا</span>
          <Button variant="ghost" size="icon" aria-label="كتم الصوت">
            <Volume2 />
          </Button>
          <ThemeToggle />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
export function BroadcastLayout({ children }: { children: ReactNode }) {
  return <main className="broadcast-layout">{children}</main>;
}
