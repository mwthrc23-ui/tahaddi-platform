import { Activity, BarChart3, FileQuestion, Gauge, Radio, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { DashboardLayout } from '@/components/layout';
import {
  hasPermission,
  ROLE_LABELS,
  type AdminPermission,
  type AppRole,
} from '@/lib/auth/authorization';
import styles from './admin.module.css';

const navigation: readonly {
  href: string;
  label: string;
  icon: typeof Gauge;
  permission?: AdminPermission;
}[] = [
  { href: '/admin', label: 'النظرة العامة', icon: Gauge },
  { href: '/admin/permissions', label: 'الصلاحيات', icon: ShieldCheck },
  { href: '/admin/content', label: 'المحتوى', icon: FileQuestion, permission: 'MANAGE_CONTENT' },
  { href: '/admin/rooms', label: 'الغرف المباشرة', icon: Radio, permission: 'MANAGE_ROOMS' },
  { href: '/admin/users', label: 'المستخدمون', icon: Users, permission: 'MANAGE_USERS' },
  { href: '/admin/reports', label: 'التقارير', icon: BarChart3, permission: 'VIEW_REPORTS' },
  { href: '/admin/audit', label: 'سجل النشاط', icon: Activity, permission: 'VIEW_AUDIT' },
];

export function AdminShell({ children, role }: { children: ReactNode; role: AppRole }) {
  const visibleNavigation = navigation.filter(
    (item) => !item.permission || hasPermission(role, item.permission),
  );

  return (
    <DashboardLayout title="إدارة المنصة">
      <section className={styles.console}>
        <header className={styles.masthead}>
          <div>
            <span className={styles.eyebrow}>
              <ShieldCheck aria-hidden="true" />
              مركز القيادة
            </span>
            <h2>إدارة تحدّي</h2>
            <p>صلاحيات خادمية، قرارات مدققة، ورؤية واضحة لحالة المنصة.</p>
          </div>
          <span className={styles.role}>{ROLE_LABELS[role]}</span>
        </header>
        <nav className={styles.navigation} aria-label="أقسام الإدارة">
          {visibleNavigation.map((item) => (
            <Link href={item.href} key={item.href}>
              <item.icon aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
        {children}
      </section>
    </DashboardLayout>
  );
}
