import {
  CheckCircle2,
  MessageCircle,
  Play,
  ShieldCheck,
  SkipForward,
  Skull,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import {
  advanceMafiaPhase,
  deleteMafiaMessage,
  moderateMafiaParticipant,
  startMafiaGame,
  toggleMafiaChat,
} from '@/app/mafia/actions';
import { SiteLayout } from '@/components/layout';
import { RoomPoller } from '@/components/live';
import { MafiaPhaseTimer } from '@/components/mafia/mafia-phase-timer';
import { RoomCode } from '@/components/quiz';
import { Badge, Button, Card, EmptyState } from '@/components/ui';
import { getPrismaClient } from '@/lib/auth/prisma';
import { requireActiveUser } from '@/lib/auth/session';
import {
  getLatestMafiaPublicOutcome,
  getMafiaPhaseEveryoneHint,
  mafiaDisplayInitial,
  mafiaPhaseGuides,
  mafiaWinConditions,
  type MafiaPhaseName,
} from '@/lib/mafia/guidance';
import {
  mafiaPhaseEmoji,
  mafiaPhaseLabels,
  mafiaRoleEmoji,
  mafiaRoleLabels,
  type MafiaRoleName,
} from '@/lib/mafia/rules';

export default async function MafiaHostPage({
  params,
  searchParams,
}: {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ gameId }, query, user] = await Promise.all([
    params,
    searchParams,
    requireActiveUser('/mafia'),
  ]);
  const prisma = getPrismaClient();
  const game = await prisma.mafiaGame.findFirst({
    where: { id: gameId, hostId: user.id },
    select: {
      id: true,
      roomCode: true,
      status: true,
      winner: true,
      currentRound: true,
      autoMode: true,
      chatEnabled: true,
      phaseEndsAt: true,
      daySeconds: true,
      nightSeconds: true,
      votingSeconds: true,
      maxPlayers: true,
      participants: {
        orderBy: { joinedAt: 'asc' },
        select: { id: true, displayName: true, role: true, status: true, isMuted: true },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 40,
        select: {
          id: true,
          body: true,
          channel: true,
          createdAt: true,
          participant: { select: { displayName: true } },
        },
      },
    },
  });
  if (!game) notFound();
  const phase = game.status as MafiaPhaseName;
  const phaseDuration =
    game.status === 'NIGHT'
      ? game.nightSeconds
      : game.status === 'DAY'
        ? game.daySeconds
        : game.status === 'VOTING'
          ? game.votingSeconds
          : null;

  const alivePlayers = game.participants.filter((p) => p.status === 'ALIVE');
  const nightActors = alivePlayers.filter((p) =>
    p.role ? ['KILLER', 'DETECTIVE', 'DOCTOR', 'GUARD'].includes(p.role) : false,
  );

  const [nightActionsCount, votesCount] = await Promise.all([
    game.status === 'NIGHT'
      ? prisma.mafiaAction.count({
          where: {
            gameId,
            round: game.currentRound,
            actorId: { in: nightActors.map((p) => p.id) },
          },
        })
      : Promise.resolve(0),
    game.status === 'VOTING'
      ? prisma.mafiaVote.count({
          where: { gameId, round: game.currentRound },
        })
      : Promise.resolve(0),
  ]);

  const channelLabels: Record<string, string> = {
    SYSTEM: 'النظام',
    PUBLIC: 'عام',
    KILLERS: 'القتلة',
    GHOSTS: 'المستبعدون',
  };
  const latestOutcome =
    game.status === 'DAY' || game.status === 'VOTING' || game.status === 'NIGHT'
      ? getLatestMafiaPublicOutcome(game.messages)
      : null;
  const showOutcomeBanner =
    latestOutcome &&
    ((game.status === 'DAY' && latestOutcome.kind.startsWith('night-')) ||
      (game.status === 'VOTING' && latestOutcome.kind.startsWith('night-')) ||
      (game.status === 'NIGHT' && latestOutcome.kind.startsWith('vote-')));

  return (
    <SiteLayout user={{ name: user.name }}>
      <main className="section mafia-page">
        <div className="container">
          {game.status !== 'FINISHED' && <RoomPoller endpoint={`/api/mafia/${game.id}/tick`} />}
          <div className="page-header">
            <div>
              <span className="eyebrow">
                <ShieldCheck aria-hidden="true" />
                لوحة المضيف
              </span>
              <h1>
                {mafiaPhaseEmoji[game.status]} {mafiaPhaseLabels[game.status]}
              </h1>
              <p>
                الجولة {game.currentRound.toLocaleString('ar-SA')} ·{' '}
                {game.autoMode ? 'إدارة تلقائية مع تجاوز يدوي' : 'إدارة يدوية'} ·{' '}
                {alivePlayers.length.toLocaleString('ar-SA')} أحياء
              </p>
            </div>
            <Badge className="badge-live">{game.roomCode}</Badge>
          </div>

          {game.status !== 'LOBBY' && game.status !== 'FINISHED' && (
            <>
              <MafiaPhaseTimer
                phase={phase}
                phaseEndsAt={game.phaseEndsAt?.toISOString() ?? null}
                durationSeconds={phaseDuration}
                autoMode={game.autoMode}
                tickEndpoint={`/api/mafia/${game.id}/tick`}
              />
              <section className="mafia-everyone-banner" aria-live="polite">
                <strong>
                  {mafiaPhaseEmoji[phase]} الآن: {mafiaPhaseLabels[phase]}
                </strong>
                <p>{getMafiaPhaseEveryoneHint(phase)}</p>
                <span>التالي: {mafiaPhaseGuides[phase].next}</span>
              </section>
              {showOutcomeBanner && latestOutcome && (
                <section
                  className="mafia-outcome-banner"
                  data-kind={latestOutcome.kind}
                  aria-live="assertive"
                  role="status"
                >
                  <Skull aria-hidden="true" />
                  <div>
                    <strong>{latestOutcome.title}</strong>
                    <p>{latestOutcome.body}</p>
                    {latestOutcome.victimName && (
                      <span className="mafia-outcome-victim">
                        الاسم الظاهر للجميع: {latestOutcome.victimName}
                      </span>
                    )}
                  </div>
                </section>
              )}
            </>
          )}

          {query.error === 'players' && (
            <p className="text-danger" role="alert">
              تحتاج اللعبة إلى خمسة لاعبين على الأقل قبل البدء.
            </p>
          )}

          <div className="card-grid two mafia-host-grid">
            <div>
              <RoomCode code={game.roomCode} url={`/join/${game.roomCode}`} />
              <Card>
                <div className="inline-between">
                  <div>
                    <h2>التحكم في المرحلة</h2>
                    <p className="muted">{mafiaPhaseGuides[phase].summary}</p>
                  </div>
                  <Badge>{mafiaPhaseLabels[game.status]}</Badge>
                </div>
                <div className="mafia-host-task">
                  <strong>مهمة المضيف</strong>
                  <p>{mafiaPhaseGuides[phase].hostTask}</p>
                  <span>التالي: {mafiaPhaseGuides[phase].next}</span>
                </div>

                {game.status === 'NIGHT' && (
                  <div className="mafia-host-progress" role="status">
                    <CheckCircle2 aria-hidden="true" />
                    <div>
                      <strong>قرارات الليل</strong>
                      <p>
                        {nightActionsCount.toLocaleString('ar-SA')} من{' '}
                        {nightActors.length.toLocaleString('ar-SA')} أدوار سرية ثبّتت قرارها
                      </p>
                    </div>
                  </div>
                )}
                {game.status === 'VOTING' && (
                  <div className="mafia-host-progress" role="status">
                    <CheckCircle2 aria-hidden="true" />
                    <div>
                      <strong>أصوات الجولة</strong>
                      <p>
                        {votesCount.toLocaleString('ar-SA')} من{' '}
                        {alivePlayers.length.toLocaleString('ar-SA')} لاعبين صوّتوا
                      </p>
                    </div>
                  </div>
                )}
                {game.status === 'DAY' && (
                  <div className="mafia-host-progress" role="status">
                    <CheckCircle2 aria-hidden="true" />
                    <div>
                      <strong>نقاش النهار</strong>
                      <p>اترك وقتًا قصيرًا لكل مشتبه ثم انتقل للتصويت عند الجاهزية.</p>
                    </div>
                  </div>
                )}

                <div className="dashboard-actions">
                  {game.status === 'LOBBY' ? (
                    <form action={startMafiaGame}>
                      <input type="hidden" name="gameId" value={game.id} />
                      <Button type="submit" disabled={game.participants.length < 5}>
                        <Play aria-hidden="true" />
                        بدء اللعبة
                      </Button>
                    </form>
                  ) : game.status !== 'FINISHED' ? (
                    <form action={advanceMafiaPhase}>
                      <input type="hidden" name="gameId" value={game.id} />
                      <Button type="submit" variant="secondary">
                        <SkipForward aria-hidden="true" />
                        المرحلة التالية الآن
                      </Button>
                    </form>
                  ) : (
                    <p className="text-success">
                      الفائز:{' '}
                      {game.winner === 'KILLERS'
                        ? mafiaWinConditions.killers.title
                        : mafiaWinConditions.citizens.title}
                    </p>
                  )}
                  <form action={toggleMafiaChat}>
                    <input type="hidden" name="gameId" value={game.id} />
                    <input type="hidden" name="enabled" value={String(!game.chatEnabled)} />
                    <Button type="submit" variant="outline">
                      {game.chatEnabled ? <VolumeX /> : <Volume2 />}
                      {game.chatEnabled ? 'إيقاف الدردشة' : 'تشغيل الدردشة'}
                    </Button>
                  </form>
                </div>
              </Card>
            </div>

            <Card className={game.status === 'LOBBY' ? 'mafia-lobby-roster' : undefined}>
              <div className="inline-between">
                <h2>
                  <Users aria-hidden="true" />
                  {game.status === 'LOBBY' ? 'اللاعبون في الانتظار' : 'اللاعبون'}
                </h2>
                <Badge className={game.status === 'LOBBY' ? 'badge-live' : undefined}>
                  {game.participants.length.toLocaleString('ar-SA')} /{' '}
                  {game.maxPlayers.toLocaleString('ar-SA')}
                </Badge>
              </div>
              {game.status === 'LOBBY' && (
                <p className="mafia-lobby-roster__hint">
                  أسماء المنضمين ظاهرة بوضوح للجميع في غرفة الانتظار.
                </p>
              )}
              {game.participants.length ? (
                <div className="mafia-player-list">
                  {game.participants.map((participant, index) => (
                    <div
                      className="mafia-player-row"
                      data-status={participant.status === 'ELIMINATED' ? 'out' : 'alive'}
                      key={participant.id}
                    >
                      <span
                        className={`mafia-player-avatar${
                          participant.status === 'ELIMINATED' ? ' mafia-player-avatar--out' : ''
                        }`}
                        aria-hidden="true"
                      >
                        {mafiaDisplayInitial(participant.displayName)}
                      </span>
                      <div className="mafia-player-identity">
                        <strong>{participant.displayName}</strong>
                        <span>
                          {game.status === 'LOBBY'
                            ? `لاعب ${(index + 1).toLocaleString('ar-SA')}`
                            : participant.role
                              ? `${mafiaRoleEmoji[participant.role as MafiaRoleName]} ${mafiaRoleLabels[participant.role as MafiaRoleName]}`
                              : 'ينتظر توزيع الدور'}
                          {' · '}
                          {participant.status === 'ALIVE' ? 'حي' : 'ضحية / مستبعد'}
                        </span>
                      </div>
                      {participant.status === 'ELIMINATED' && (
                        <Badge className="mafia-badge-killed">ضحية</Badge>
                      )}
                      <form action={moderateMafiaParticipant}>
                        <input type="hidden" name="gameId" value={game.id} />
                        <input type="hidden" name="participantId" value={participant.id} />
                        <input type="hidden" name="muted" value={String(!participant.isMuted)} />
                        <Button type="submit" size="sm" variant="ghost">
                          {participant.isMuted ? <Volume2 /> : <VolumeX />}
                          {participant.isMuted ? 'إلغاء الكتم' : 'كتم'}
                        </Button>
                      </form>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="بانتظار اللاعبين"
                  description="شارك الرمز أو رمز QR حتى ينضم خمسة لاعبين على الأقل."
                />
              )}
            </Card>
          </div>

          <Card className="mafia-chat-card">
            <div className="inline-between">
              <h2>
                <MessageCircle aria-hidden="true" />
                سجل الغرفة
              </h2>
              <Badge>{game.chatEnabled ? 'الدردشة مفعلة' : 'الدردشة متوقفة'}</Badge>
            </div>
            <div className="mafia-messages">
              {[...game.messages].reverse().map((message) => (
                <div
                  className="mafia-message"
                  data-system={message.channel === 'SYSTEM' || undefined}
                  key={message.id}
                >
                  <div>
                    <strong>{message.participant?.displayName ?? 'النظام'}</strong>
                    <span>
                      {channelLabels[message.channel] ?? message.channel} ·{' '}
                      {message.createdAt.toLocaleTimeString('ar-SA', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p>{message.body}</p>
                  <form action={deleteMafiaMessage}>
                    <input type="hidden" name="gameId" value={game.id} />
                    <input type="hidden" name="messageId" value={message.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      حذف
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </SiteLayout>
  );
}
