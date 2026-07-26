import { notFound } from 'next/navigation';
import { isSpecialGameMode, SPECIAL_GAME_ORDER, type SpecialGameMode } from '@tahaddi/domain';
import { INSTANT_GAME_ORDER, InstantGameRoom, isInstantGameMode } from '@/components/instant-games';
import { SiteLayout } from '@/components/layout';
import { SpecialGameRoom } from '@/components/special-games/special-game-room';
import { getCurrentSession } from '@/lib/auth/session';

export function generateStaticParams() {
  return [...SPECIAL_GAME_ORDER, ...INSTANT_GAME_ORDER].map((mode) => ({ mode }));
}

export default async function SpecialGamePage({
  params,
  searchParams,
}: {
  params: Promise<{ mode: string }>;
  searchParams: Promise<{ join?: string }>;
}) {
  const [{ mode }, query, session] = await Promise.all([params, searchParams, getCurrentSession()]);
  if (!isSpecialGameMode(mode) && !isInstantGameMode(mode)) notFound();

  return (
    <SiteLayout user={session?.user ? { name: session.user.name } : null}>
      {isInstantGameMode(mode) ? (
        <InstantGameRoom mode={mode} />
      ) : (
        <SpecialGameRoom
          mode={mode as SpecialGameMode}
          initialPin={query.join?.replace(/\D/g, '').slice(0, 6) ?? ''}
        />
      )}
    </SiteLayout>
  );
}
