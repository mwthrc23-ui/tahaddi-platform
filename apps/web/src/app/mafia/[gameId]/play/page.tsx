import {
  BrainCircuit,
  Eye,
  ListChecks,
  MessageCircle,
  Moon,
  Shield,
  Skull,
  Sparkles,
  Sun,
  Target,
  Trophy,
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
import {
  buildTakeaways,
  pickEpilogueBadges,
  renderEliminationText,
} from '@/lib/mafia/narrative';
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
  const eliminatedIds = game.participants
    .filter((p) => p.status === 'ELIMINATED')
    .map((p) => p.id);
  const publicMessageCounts = new Map<string, number>();
  for (const msg of game.messages) {
    if (msg.channel !== 'PUBLIC' || !msg.participant) continue;
    publicMessageCounts.set(
      msg.participant.displayName,
      (publicMessageCounts.get(msg.participant.displayName) ?? 0) + 1,
    );
  }
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

  const totalPlayers = game.participants.length;
  const eliminationRatio = totalPlayers === 0 ? 0 : eliminatedIds.length / totalPlayers;
  const tension =
    Math.min(1, game.currentRound * 0.1 + eliminationRatio) +
    (game.status === 'NIGHT' ? 0.15 : game.status === 'VOTING' ? 0.08 : 0);
  const moodKey =
    game.status === 'FINISHED'
      ? game.winner === 'KILLERS'
        ? 'doom'
        : 'dawn'
      : tension > 0.75
        ? 'thriller'
        : tension > 0.45
          ? 'mystery'
          : 'calm';
  const takeaways =
    game.status === 'FINISHED'
      ? buildTakeaways({
          round: game.currentRound,
          totalPlayers,
          eliminatedIds,
          publicMessageCounts,
          votedTargets: [],
          correctGuesses: undefined,
        })
      : [];
  const playerBadges =
    game.status === 'FINISHED'
      ? pickEpilogueBadges({
          takeawayIds: takeaways.map((t) => t.id),
          role: role ?? undefined,
          wasAliveAtEnd: player.status === 'ALIVE',
          publicMessages: publicMessageCounts.get(player.displayName) ?? 0,
          correctGuesses: 0,
          investigateCount: 0,
        })
      : [];
  const lastPublicElimination = [...game.messages]
    .reverse()
    .find((m) => m.channel === 'SYSTEM' && /خرج|مستبعد|خارج|الإقصاء/.test(m.body));
  const lastEliminationText =
    lastPublicElimination && game.status !== 'LOBBY'
      ? lastPublicElimination.body
      : game.currentRound > 1 && eliminatedIds.length > 0
        ? renderEliminationText('NIGHT', player.displayName, game.currentRound)
        : null;

  const moodLabels: Record<typeof moodKey, { label: string; tone: string }> = {
    calm: { label: 'جو بداية هادئ', tone: 'mood-calm' },
    mystery: { label: 'الغموض يتسلل', tone: 'mood-mystery' },
    thriller: { label: 'إثارة عالية', tone: 'mood-thriller' },
    doom: { label: 'ليل بلا عودة', tone: 'mood-doom' },
    dawn: { label: 'فجر العدالة', tone: 'mood-dawn' },
  } as const;

  return (
    <SiteLayout>
      <main
        className={`section mafia-page mafia-phase-${game.status.toLowerCase()} ${moodLabels[moodKey].tone}`}
        data-mood={moodKey}
      >
        <div className="container mafia-player-shell">
          {game.status !== 'FINISHED' && (
            <RoomPoller endpoint={`/api/mafia/${game.id}/tick`} participantId={player.id} />
          )}
          <div className="page-header">
            <div>
              <span className="eyebrow">
                {game.status === 'NIGHT' ? <Moon /> : <Sun />}
                {mafiaPhaseLabels[game.status]}
                <span className="mafia-mood-chip">
                  <Sparkles aria-hidden="true" />
                  {moodLabels[moodKey].label}
                </span>
              </span>
              <h1>مرحبًا {player.displayName}</h1>
              <p>
                الغرفة {game.roomCode} · الجولة {game.currentRound.toLocaleString('ar-SA')}
              </p>
              {lastEliminationText && game.status !== 'FINISHED' && (
                <p className="mafia-last-event" role="status">
                  آخر أحداث الساحة: {lastEliminationText}
                </p>
              )}
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
                {game.status === 'FINISHED' && playerBadges.length > 0 && (
                  <div className="mafia-epilogue-badges">
                    <div className="mafia-epilogue-title">
                      <Trophy aria-hidden="true" />
                      إنجازاتك في هذه اللعبة
                    </div>
                    <div className="mafia-epilogue-badges-grid">
                      {playerBadges.map((b) => (
                        <div className="mafia-epilogue-badge" key={b.id}>
                          <div className="mafia-epilogue-badge-top">
                            <span aria-hidden="true">{b.glyph}</span>
                            <strong>{b.label}</strong>
                          </div>
                          <p>{b.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
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

                {(game.status === 'DAY' || game.status === 'VOTING') &&
                  player.status === 'ALIVE' &&
                  alivePlayers.length >= 2 && (
                    <section className="mafia-guess-panel" aria-labelledby="mafia-guess-title">
                      <div className="mafia-guess-head">
                        <h3 id="mafia-guess-title">
                          <BrainCircuit aria-hidden="true" />
                          توقع أدوار اللاعبين (خاص بك)
                        </h3>
                        <Badge>
                          <Sparkles aria-hidden="true" />
                          سلس Likelihood Guess
                        </Badge>
                      </div>
                      <p className="muted">
                        اختبر حدسك أثناء النقاش. التوقعات خاصة بك ولا تظهر لأحد غيرك.
                      </p>
                      <div className="mafia-guess-grid" id="mafia-likelihood-grid">
                        {alivePlayers
                          .filter((target) => target.id !== player.id)
                          .map((target) => (
                            <div className="mafia-guess-row" key={target.id}>
                              <span className="mafia-guess-name">{target.displayName}</span>
                              <select
                                name={`mafia-guess-${target.id}`}
                                className="mafia-guess-select"
                                data-persist="likelihood"
                                data-target-name={target.displayName}
                                defaultValue="CITIZEN"
                              >
                                <option value="KILLER">🚫 الظن أنه قاتل</option>
                                <option value="DETECTIVE">🔍 محتمل محقق</option>
                                <option value="DOCTOR">💊 محتمل طبيب</option>
                                <option value="GUARD">🛡️ محتمل حارس</option>
                                <option value="WITNESS">👁️ محتمل شاهد</option>
                                <option value="CITIZEN">🏘️ مواطن بريء</option>
                              </select>
                            </div>
                          ))}
                      </div>
                      <p className="mafia-guess-hint">
                        💡 النصيحة: عدّل توقعاتك مع كل جولة. في نهاية اللعبة تُعطى بطاقة <strong>عرّاف القرية</strong> إذا كانت ٣ توقعات أو أكثر صحيحة!
                      </p>
                    </section>
                  )}

                {takeaways.length > 0 && (
                  <section className="mafia-takeaways-panel" aria-labelledby="mafia-takeaways">
                    <div className="mafia-takeaways-head">
                      <h3 id="mafia-takeaways">
                        <Trophy aria-hidden="true" />
                        خِطَط هذه الليلة (Epilogue Takeaways)
                      </h3>
                    </div>
                    <ol>
                      {takeaways.map((t) => (
                        <li key={t.id}>
                          <strong>{t.title}</strong>
                          <p>{t.summary}</p>
                        </li>
                      ))}
                    </ol>
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
