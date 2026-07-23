import {
  MessageCircle,
  Play,
  ShieldCheck,
  SkipForward,
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
import { RoomCode } from '@/components/quiz';
import { Badge, Button, Card, EmptyState } from '@/components/ui';
import { getPrismaClient } from '@/lib/auth/prisma';
import { requireActiveUser } from '@/lib/auth/session';
import { mafiaPhaseLabels, mafiaRoleLabels, type MafiaRoleName } from '@/lib/mafia/rules';

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
  const game = await getPrismaClient().mafiaGame.findFirst({
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
              <h1>{mafiaPhaseLabels[game.status]}</h1>
              <p>
                الجولة {game.currentRound.toLocaleString('ar-SA')} ·{' '}
                {game.autoMode ? 'إدارة تلقائية مع تجاوز يدوي' : 'إدارة يدوية'}
              </p>
            </div>
            <Badge className="badge-live">{game.roomCode}</Badge>
          </div>

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
                    <p className="muted">
                      {game.phaseEndsAt
                        ? `تنتهي تلقائيًا ${game.phaseEndsAt.toLocaleTimeString('ar-SA', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}`
                        : 'المضيف يتحكم في الانتقال.'}
                    </p>
                  </div>
                  <Badge>{game.status}</Badge>
                </div>
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
                      الفائز: {game.winner === 'KILLERS' ? 'القتلة' : 'المواطنون'}
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

            <Card>
              <div className="inline-between">
                <h2>
                  <Users aria-hidden="true" />
                  اللاعبون
                </h2>
                <Badge>
                  {game.participants.length.toLocaleString('ar-SA')} /{' '}
                  {game.maxPlayers.toLocaleString('ar-SA')}
                </Badge>
              </div>
              {game.participants.length ? (
                <div className="mafia-player-list">
                  {game.participants.map((participant) => (
                    <div className="mafia-player-row" key={participant.id}>
                      <div>
                        <strong>{participant.displayName}</strong>
                        <span>
                          {participant.role
                            ? mafiaRoleLabels[participant.role as MafiaRoleName]
                            : 'ينتظر توزيع الدور'}
                          {' · '}
                          {participant.status === 'ALIVE' ? 'حي' : 'مستبعد'}
                        </span>
                      </div>
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
                <div className="mafia-message" key={message.id}>
                  <div>
                    <strong>{message.participant?.displayName ?? 'النظام'}</strong>
                    <span>
                      {message.channel} ·{' '}
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
