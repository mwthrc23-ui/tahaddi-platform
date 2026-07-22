import { BroadcastLayout } from '@/components/layout';
import { EmptyState } from '@/components/ui';

export default function Page() {
  return (
    <BroadcastLayout>
      <EmptyState
        title="لا توجد جلسة بث نشطة"
        description="ابدأ جلسة مسابقة من لوحة المضيف لعرض شاشة البث."
      />
    </BroadcastLayout>
  );
}
