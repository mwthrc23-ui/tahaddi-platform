import type { Metadata } from 'next';
import { SiteLayout } from '@/components/layout';
import { GameCatalogWrapper } from '@/components/game-catalog';
import { getCurrentSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'الألعاب | تحدّي',
  description:
    'كتالوج ألعاب تفاعلي متعدد الأبعاد: فلترة حسب النوع والصعوبة والتقييم وسعة اللاعبين، مع بحث ذكي وترتيب شعبي وآمن وتحميل تدريجي.',
  alternates: { canonical: '/games' },
  openGraph: {
    title: 'الألعاب | تحدّي · كتالوج متقدم',
    description:
      'اكتشف غرف البث اللحظي والتحديات الفورية مع فلترة 8 أبعاد، اقتراحات ذكية، ودعم كامل للعربية RTL والوصولية.',
    locale: 'ar_SA',
    type: 'website',
    url: '/games',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'الألعاب | تحدّي',
    description: 'كتالوج ألعاب عربية فاخرة مع بحث ذكي وترتيب شعبي وتحميل تدريجي.',
  },
};

export default async function GamesPage() {
  const session = await getCurrentSession().catch(() => null);
  const userName = session?.user?.name ?? null;
  return (
    <SiteLayout user={userName ? { name: userName } : null}>
      <GameCatalogWrapper sessionUserName={userName} />
    </SiteLayout>
  );
}
