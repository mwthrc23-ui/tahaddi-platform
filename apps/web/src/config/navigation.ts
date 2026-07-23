import { BookOpen, Gamepad2, Home, LayoutDashboard, Skull, Trophy } from 'lucide-react';

export const primaryNavigation = [
  { label: 'الرئيسية', href: '/', icon: Home },
  { label: 'منشئ المسابقات', href: '/quizzes', icon: Trophy },
  { label: 'الألعاب', href: '/#games', icon: Gamepad2 },
  { label: 'من هو القاتل؟', href: '/mafia', icon: Skull },
  { label: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
  { label: 'بنك الأسئلة', href: '/questions', icon: BookOpen },
] as const;
