import { redirect } from 'next/navigation';
import { SiteLayout } from '@/components/layout';
import { LivePlayerExperience } from '@/components/live';
import { EmptyState } from '@/components/ui';
import { getPrismaClient, hasDatabaseUrl } from '@/lib/auth/prisma';
import { getCurrentSession } from '@/lib/auth/session';
import { verifyPlayerLiveAccessToken } from '@/lib/live/access-token';

export default async function LivePlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ participantId?: string; token?: string }>;
}) {
  const [{ sessionId }, query, authSession] = await Promise.all([
    params,
    searchParams,
    getCurrentSession(),
  ]);
  const participantId = query.participantId ?? '';
  const accessToken = query.token ?? '';

  if (!hasDatabaseUrl()) redirect('/');

  const validAccess =
    participantId &&
    accessToken &&
    verifyPlayerLiveAccessToken(sessionId, participantId, accessToken);
  const participant = validAccess
    ? await getPrismaClient().liveParticipant.findFirst({
        where: { id: participantId, sessionId },
        select: { id: true, displayName: true },
      })
    : null;

  return (
    <SiteLayout user={authSession?.user ? { name: authSession.user.name } : null}>
      <section className="section">
        <div className="container live-play">
          {!participant ? (
            <EmptyState
              title="رابط اللاعب غير صالح"
              description="ارجع إلى رابط الدعوة وأدخل اسمك للانضمام من جديد."
            />
          ) : (
            <LivePlayerExperience
              sessionId={sessionId}
              participantId={participant.id}
              accessToken={accessToken}
              displayName={participant.displayName}
            />
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
