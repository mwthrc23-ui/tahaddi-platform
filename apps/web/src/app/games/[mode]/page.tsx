import { notFound } from 'next/navigation';
import { isSpecialGameMode, type SpecialGameMode } from '@tahaddi/domain';
import { SiteLayout } from '@/components/layout';
import { SpecialGameRoom } from '@/components/special-games/special-game-room';
import { getCurrentSession } from '@/lib/auth/session';

export function generateStaticParams() {
  return [{ mode: 'parallel-world' }, { mode: 'reverse-time' }];
}

export default async function SpecialGamePage({
  params,
  searchParams,
}: {
  params: Promise<{ mode: string }>;
  searchParams: Promise<{ join?: string }>;
}) {
  const [{ mode }, query, session] = await Promise.all([params, searchParams, getCurrentSession()]);
  if (!isSpecialGameMode(mode)) notFound();

  return (
    <SiteLayout user={session?.user ? { name: session.user.name } : null}>
      <SpecialGameRoom
        mode={mode as SpecialGameMode}
        initialPin={query.join?.replace(/\D/g, '').slice(0, 6) ?? ''}
      />
    </SiteLayout>
  );
}
