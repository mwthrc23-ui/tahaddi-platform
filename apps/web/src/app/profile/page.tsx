import { Mail, ShieldCheck, UserCircle2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Badge, Card } from '@/components/ui';
import { requireActiveUser } from '@/lib/auth/session';

export default async function ProfilePage() {
  const user = await requireActiveUser('/profile');

  return (
    <DashboardLayout title="الملف الشخصي">
      <div className="profile-grid">
        <Card className="profile-card">
          <UserCircle2 />
          <div>
            <h2>{user.name || 'مستخدم تحدّي'}</h2>
            <p>{user.email}</p>
          </div>
          <Badge className="badge-success">حساب نشط</Badge>
        </Card>
        <Card>
          <h2>
            <ShieldCheck />
            الهوية والصلاحيات
          </h2>
          <div className="profile-row">
            <span>
              <Mail />
              البريد
            </span>
            <strong>{user.email}</strong>
          </div>
          <div className="profile-row">
            <span>الدور</span>
            <strong>{user.role}</strong>
          </div>
          <div className="profile-row">
            <span>الحالة</span>
            <strong>{user.status}</strong>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
