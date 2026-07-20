import { Gamepad2, Home, LayoutDashboard, Palette, Radio, Trophy } from 'lucide-react';

export const primaryNavigation = [
  { label: 'الرئيسية', href: '/', icon: Home },
  { label: 'المسابقات', href: '/#competitions', icon: Trophy },
  { label: 'الألعاب', href: '/#games', icon: Gamepad2 },
  { label: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
  { label: 'نظام التصميم', href: '/design-system', icon: Palette },
] as const;

export const demoNavigation = [
  { label: 'الانتظار', href: '/demo/waiting' },
  { label: 'السؤال', href: '/demo/question' },
  { label: 'النتائج', href: '/demo/results' },
  { label: 'الفائزون', href: '/demo/winners' },
  { label: 'البث', href: '/broadcast', icon: Radio },
] as const;
