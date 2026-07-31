import {
  Eye,
  ListChecks,
  MessageCircle,
  Moon,
  Shield,
  Skull,
  Sun,
  Target,
  Vote,
} from 'lucide-react';
import { redirect } from 'next/navigation';
import { sendMafiaMessage, submitMafiaAction, submitMafiaVote } from '@/app/mafia/actions';
import { SiteLayout } from '@/components/layout';
import { RoomPoller } from '@/components/live';
import { MafiaPhaseTimer } from '@/components/mafia/mafia-phase-timer';
import { Badge, Button, Card, EmptyState } from '@/components/ui';
import { getPrismaClient, hasDatabaseUrl } from '@/lib/auth/prisma';
import { getMafiaAccessToken } from '@/lib/mafia/access-cookie';
import {
  getMafiaMission,
  mafiaPhaseGuides,
  mafiaRoleGuides,
  type MafiaPhaseName,
} from '@/lib/mafia/guidance';
import { mafiaPhaseLabels, mafiaRoleLabels, type MafiaRoleName } from '@/lib/mafia/rules';

export default async function MafiaPlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ participantId?: string }>;
}) {
  if (!hasDatabaseUrl()) redirect('/join?error=unavailable');
  const [{ gameId }, query] = await Promise.all([params, searchParams]);
  const participantId = query.participantId ?? '';
  const participantToken = await getMafiaAccessToken(gameId);
  const prisma = getPrismaClient();
  const game = await prisma.mafiaGame.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      roomCode: true,
      status: true,
      winner: true,
      currentRound: true,
      phaseEndsAt: true,
      autoMode: true,
      daySeconds: true,
      nightSeconds: true,
      votingSeconds: true,
      chatEnabled: true,
      slowModeSeconds: true,
      participants: {
        orderBy: { joinedAt: 'asc' },
        select: {
          id: true,
          displayName: true,
          role: true,
          status: true,
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 60,
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
  const player = await prisma.mafiaParticipant.findFirst({
    where: { id: participantId, gameId, accessToken: participantToken },
    select: {
      id: true,
      displayName: true,
      role: true,
      status: true,
      isMuted: true,
      privateNote: true,
    },
  });
  if (!game || !player) redirect(`/join/${game?.roomCode ?? ''}?error=player`);

  const role = player.role as MafiaRoleName | null;
  const phase = game.status as MafiaPhaseName;
  const roleGuide = role ? mafiaRoleGuides[role] : null;
  const mission = role ? getMafiaMission(role, phase, player.status === 'ELIMINATED') : null;
  const phaseDuration =
    game.status === 'NIGHT'
      ? game.nightSeconds
      : game.status === 'DAY'
        ? game.daySeconds
        : game.status === 'VOTING'
          ? game.votingSeconds
          : null;
  const visibleMessages = game.messages.filter(
    (message) =>
      message.channel === 'SYSTEM' ||
      message.channel === 'PUBLIC' ||
      (message.channel === 'KILLERS' && role === 'KILLER') ||
      (message.channel === 'GHOSTS' && player.status === 'ELIMINATED'),
  );
  const alivePlayers = game.participants.filter((item) => item.status === 'ALIVE');
  const nightActionRole = role && ['KILLER', 'DETECTIVE', 'DOCTOR', 'GUARD'].includes(role);
  const canChat =
    game.chatEnabled &&
    !player.isMuted &&
    (player.status === 'ELIMINATED' ||
      game.status === 'LOBBY' ||
      game.status === 'DAY' ||
      game.status === 'VOTING' ||
      (game.status === 'NIGHT' && role === 'KILLER'));
  const channelLabel =
    player.status === 'ELIMINATED'
      ? 'قناة المستبعدين'
      : game.status === 'NIGHT' && role === 'KILLER'
        ? 'قناة القتلة السرية'
        : 'النقاش العام';

  return (
    <SiteLayout>
      <main className={`section mafia-page mafia-phase-${game.status.toLowerCase()}`}>
        <div className="container mafia-player-shell">
          {game.status !== 'FINISHED' && (
            <RoomPoller endpoint={`/api/mafia/${game.id}/tick`} participantId={player.id} />
          )}
          <div className="page-header">
            <div>
              <span className="eyebrow">
                {game.status === 'NIGHT' ? <Moon /> : <Sun />}
                {mafiaPhaseLabels[game.status]}
              </span>
              <h1>مرحبًا {player.displayName}</h1>
              <p>
                الغرفة {game.roomCode} · الجولة {game.currentRound.toLocaleString('ar-SA')}
              </p>
            </div>
            <Badge className={player.status === 'ALIVE' ? 'badge-live' : undefined}>
              {player.status === 'ALIVE' ? 'داخل اللعبة' : 'مستبعد'}
            </Badge>
          </div>

          {game.status !== 'LOBBY' && game.status !== 'FINISHED' && (
            <MafiaPhaseTimer
              phase={phase}
              phaseEndsAt={game.phaseEndsAt?.toISOString() ?? null}
              durationSeconds={phaseDuration}
              autoMode={game.autoMode}
              tickEndpoint={`/api/mafia/${game.id}/tick`}
              participantId={player.id}
            />
          )}

          {game.status === 'LOBBY' ? (
            <EmptyState
              title="بانتظار المضيف"
              description="تم تسجيل دخولك. ستظهر بطاقة دورك سرًا فور بدء اللعبة."
            />
          ) : (
            <div className="card-grid two mafia-play-grid">
              <Card className="mafia-role-card">
                <span className="eyebrow">
                  <Eye aria-hidden="true" />
                  بطاقتك السرية
                </span>
                <div className="mafia-role-icon" aria-hidden="true">
                  {role === 'KILLER' ? <Skull /> : <Shield />}
                </div>
                <h2>{role ? mafiaRoleLabels[role] : 'لم يوزع الدور بعد'}</h2>
                {roleGuide ? (
                  <div className="mafia-role-brief">
                    <p>{roleGuide.identity}</p>
                    <dl>
                      <div>
                        <dt>
                          <Target aria-hidden="true" />
                          هدفك
                        </dt>
                        <dd>{roleGuide.objective}</dd>
                      </div>
                      <div>
                        <dt>
                          <Eye aria-hidden="true" />
                          حافظ على السر
                        </dt>
                        <dd>{roleGuide.privacy}</dd>
                      </div>
                    </dl>
                  </div>
                ) : (
                  <p>انتظر المضيف.</p>
                )}
                {player.privateNote && (
                  <p className="mafia-private-note" role="status">
                    <strong>معلومة خاصة:</strong> {player.privateNote}
                  </p>
                )}
                {game.status === 'FINISHED' && (
                  <div className="mafia-reveal">
                    <strong>الفائز: {game.winner === 'KILLERS' ? 'القتلة' : 'المواطنون'}</strong>
                    <ul>
                      {game.participants.map((item) => (
                        <li key={item.id}>
                          {item.displayName}: {item.role ? mafiaRoleLabels[item.role] : '—'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>

              <Card>
                <div className="inline-between">
                  <h2>
                    <ListChecks aria-hidden="true" />
                    مهمتك الآن
                  </h2>
                  <Badge>{mafiaPhaseLabels[game.status]}</Badge>
                </div>
                {mission && (
                  <section className="mafia-mission" aria-labelledby="mafia-current-mission">
                    <h3 id="mafia-current-mission">{mission.title}</h3>
                    <p>{mission.summary}</p>
                    <ol>
                      {mission.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                    <p className="mafia-mission-next">
                      بعد هذه المرحلة: {mafiaPhaseGuides[phase].next}
                    </p>
                  </section>
                )}
                {player.status === 'ELIMINATED' ? (
                  <p className="muted">يمكنك متابعة النقاش والكتابة في قناة المستبعدين فقط.</p>
                ) : game.status === 'NIGHT' && nightActionRole ? (
                  <form action={submitMafiaAction} className="stack-form">
                    <input type="hidden" name="gameId" value={game.id} />
                    <input type="hidden" name="participantId" value={player.id} />
                    <label>
                      {role === 'KILLER'
                        ? 'اختر الضحية'
                        : role === 'DETECTIVE'
                          ? 'تحقق من'
                          : 'احمِ'}
                      <select name="targetId" required>
                        {alivePlayers
                          .filter((target) => {
                            if (role === 'KILLER') return target.role !== 'KILLER';
                            if (role === 'GUARD') return target.id !== player.id;
                            return true;
                          })
                          .map((target) => (
                            <option key={target.id} value={target.id}>
                              {target.displayName}
                            </option>
                          ))}
                      </select>
                    </label>
                    <Button type="submit">
                      <Moon />
                      تثبيت قرار الليل
                    </Button>
                  </form>
                ) : game.status === 'NIGHT' ? (
                  <p className="muted">أغمض عينيك وانتظر انتهاء قرارات الليل.</p>
                ) : game.status === 'VOTING' ? (
                  <form action={submitMafiaVote} className="stack-form">
                    <input type="hidden" name="gameId" value={game.id} />
                    <input type="hidden" name="participantId" value={player.id} />
                    <label>
                      صوّت ضد
                      <select name="targetId" required>
                        {alivePlayers
                          .filter((target) => target.id !== player.id)
                          .map((target) => (
                            <option key={target.id} value={target.id}>
                              {target.displayName}
                            </option>
                          ))}
                      </select>
                    </label>
                    <Button type="submit">
                      <Vote />
                      تثبيت التصويت
                    </Button>
                  </form>
                ) : game.status === 'DAY' ? (
                  <p>ناقش الأدلة في القناة العامة قبل فتح التصويت.</p>
                ) : (
                  <p className="muted">انتهت الجولة.</p>
                )}
              </Card>
            </div>
          )}

          <Card className="mafia-chat-card">
            <div className="inline-between">
              <div>
                <h2>
                  <MessageCircle aria-hidden="true" />
                  {channelLabel}
                </h2>
                <p className="muted">
                  لا توجد رسائل خاصة. الحد ٢٨٠ حرفًا ومهلة الإرسال{' '}
                  {game.slowModeSeconds.toLocaleString('ar-SA')} ث.
                </p>
              </div>
              <Badge>{canChat ? 'مفتوحة' : 'للقراءة فقط'}</Badge>
            </div>
            <div className="mafia-messages" aria-live="polite">
              {[...visibleMessages].reverse().map((message) => (
                <div className="mafia-message" key={message.id}>
                  <div>
                    <strong>{message.participant?.displayName ?? 'النظام'}</strong>
                    <span>
                      {message.createdAt.toLocaleTimeString('ar-SA', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p>{message.body}</p>
                </div>
              ))}
            </div>
            {canChat && (
              <form action={sendMafiaMessage} className="mafia-chat-form">
                <input type="hidden" name="gameId" value={game.id} />
                <input type="hidden" name="participantId" value={player.id} />
                <label className="sr-only" htmlFor="mafia-message">
                  الرسالة
                </label>
                <input
                  id="mafia-message"
                  name="body"
                  maxLength={280}
                  placeholder={`اكتب في ${channelLabel}`}
                  autoComplete="off"
                  required
                />
                <Button type="submit">إرسال</Button>
              </form>
            )}
          </Card>
        </div>
      </main>
    </SiteLayout>
  );
}
