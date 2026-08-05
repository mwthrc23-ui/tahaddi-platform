import {
  CheckCircle2,
  Eye,
  ListChecks,
  MessageCircle,
  Moon,
  Shield,
  Skull,
  Sun,
  Target,
  Users,
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
  getLatestMafiaPublicOutcome,
  getMafiaMission,
  getMafiaPhaseEveryoneHint,
  getMafiaTeam,
  mafiaDisplayInitial,
  mafiaNightActionLabels,
  mafiaPhaseGuides,
  mafiaRoleGuides,
  mafiaTeamLabels,
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
  const eliminatedPlayers = game.participants.filter((item) => item.status === 'ELIMINATED');
  const nightActionRole = role && ['KILLER', 'DETECTIVE', 'DOCTOR', 'GUARD'].includes(role);
  const nightActionLabel =
    role && mafiaNightActionLabels[role]
      ? mafiaNightActionLabels[role]
      : { choose: 'اختر', confirm: 'تثبيت قرار الليل', confirmed: 'تم التثبيت' };
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

  const [submittedAction, submittedVote] = await Promise.all([
    game.status === 'NIGHT' && player.status === 'ALIVE'
      ? prisma.mafiaAction.findFirst({
          where: { gameId, round: game.currentRound, actorId: player.id },
          select: {
            targetId: true,
            type: true,
            target: { select: { displayName: true } },
          },
        })
      : Promise.resolve(null),
    game.status === 'VOTING' && player.status === 'ALIVE'
      ? prisma.mafiaVote.findFirst({
          where: { gameId, round: game.currentRound, voterId: player.id },
          select: {
            targetId: true,
            target: { select: { displayName: true } },
          },
        })
      : Promise.resolve(null),
  ]);

  const fellowKillers =
    role === 'KILLER' && player.status === 'ALIVE'
      ? alivePlayers.filter((item) => item.role === 'KILLER' && item.id !== player.id)
      : [];

  const team = role ? getMafiaTeam(role) : null;
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
                {mafiaPhaseEmoji[game.status]} {mafiaPhaseLabels[game.status]}
              </span>
              <h1>مرحبًا {player.displayName}</h1>
              <p>
                الغرفة {game.roomCode} · الجولة {game.currentRound.toLocaleString('ar-SA')} ·{' '}
                {alivePlayers.length.toLocaleString('ar-SA')} أحياء
              </p>
            </div>
            <Badge className={player.status === 'ALIVE' ? 'badge-live' : undefined}>
              {player.status === 'ALIVE' ? 'داخل اللعبة' : 'مستبعد'}
            </Badge>
          </div>

          {game.status !== 'LOBBY' && game.status !== 'FINISHED' && (
            <>
              <MafiaPhaseTimer
                phase={phase}
                phaseEndsAt={game.phaseEndsAt?.toISOString() ?? null}
                durationSeconds={phaseDuration}
                autoMode={game.autoMode}
                tickEndpoint={`/api/mafia/${game.id}/tick`}
                participantId={player.id}
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

          {game.status === 'LOBBY' ? (
            <div className="mafia-lobby-layout">
              <EmptyState
                title="بانتظار المضيف"
                description="تم تسجيل دخولك. ستظهر بطاقة دورك سرًا فور بدء اللعبة. لا تغادر الصفحة."
              />
              <Card className="mafia-lobby-roster">
                <div className="inline-between">
                  <h2>
                    <Users aria-hidden="true" />
                    اللاعبون في الانتظار
                  </h2>
                  <Badge className="badge-live">
                    {game.participants.length.toLocaleString('ar-SA')} أسماء ظاهرة
                  </Badge>
                </div>
                <p className="mafia-lobby-roster__hint">
                  أسماء الجميع واضحة هنا لكل من في الغرفة — بما فيهم أنت.
                </p>
                {game.participants.length ? (
                  <ul className="mafia-roster-list mafia-roster-list--lobby">
                    {game.participants.map((item, index) => (
                      <li key={item.id} data-self={item.id === player.id || undefined}>
                        <span className="mafia-player-avatar" aria-hidden="true">
                          {mafiaDisplayInitial(item.displayName)}
                        </span>
                        <div className="mafia-player-identity">
                          <strong>{item.displayName}</strong>
                          <span>لاعب {(index + 1).toLocaleString('ar-SA')}</span>
                        </div>
                        {item.id === player.id && <Badge>أنت</Badge>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">لا يوجد لاعبون بعد.</p>
                )}
                <p className="muted">
                  يحتاج المضيف إلى خمسة لاعبين على الأقل. العدد الحالي:{' '}
                  {game.participants.length.toLocaleString('ar-SA')}
                </p>
              </Card>
            </div>
          ) : (
            <div className="card-grid two mafia-play-grid">
              <Card className="mafia-role-card" data-team={team?.toLowerCase()}>
                <span className="eyebrow">
                  <Eye aria-hidden="true" />
                  بطاقتك السرية
                </span>
                <div className="mafia-role-icon" aria-hidden="true">
                  {role === 'KILLER' ? (
                    <Skull />
                  ) : role === 'DETECTIVE' ? (
                    <Eye />
                  ) : (
                    <Shield />
                  )}
                </div>
                <h2>
                  {role ? (
                    <>
                      <span aria-hidden="true">{mafiaRoleEmoji[role]} </span>
                      {mafiaRoleLabels[role]}
                    </>
                  ) : (
                    'لم يوزع الدور بعد'
                  )}
                </h2>
                {team && (
                  <Badge className={team === 'KILLERS' ? 'mafia-badge-killers' : 'mafia-badge-citizens'}>
                    {mafiaTeamLabels[team]}
                  </Badge>
                )}
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
                {fellowKillers.length > 0 && (
                  <div className="mafia-allies" role="status">
                    <strong>زملاؤك القتلة:</strong>
                    <ul>
                      {fellowKillers.map((ally) => (
                        <li key={ally.id}>{ally.displayName}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {player.privateNote && (
                  <p className="mafia-private-note" role="status">
                    <strong>معلومة خاصة:</strong> {player.privateNote}
                  </p>
                )}
                {game.status === 'FINISHED' && (
                  <div className="mafia-reveal">
                    <strong>
                      الفائز:{' '}
                      {game.winner === 'KILLERS'
                        ? mafiaWinConditions.killers.title
                        : mafiaWinConditions.citizens.title}
                    </strong>
                    <ul>
                      {game.participants.map((item) => (
                        <li key={item.id}>
                          {item.displayName}:{' '}
                          {item.role ? (
                            <>
                              <span aria-hidden="true">
                                {mafiaRoleEmoji[item.role as MafiaRoleName]}{' '}
                              </span>
                              {mafiaRoleLabels[item.role as MafiaRoleName]}
                            </>
                          ) : (
                            '—'
                          )}
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
                  submittedAction ? (
                    <div className="mafia-action-done" role="status">
                      <CheckCircle2 aria-hidden="true" />
                      <div>
                        <strong>{nightActionLabel.confirmed}</strong>
                        <p>
                          {role === 'KILLER' ? 'الضحية المختارة' : 'الهدف'}:{' '}
                          <strong>{submittedAction.target.displayName}</strong>
                          {role === 'KILLER'
                            ? '. يمكنك تغييرها قبل انتهاء المؤقت. النتيجة النهائية (قتل أو نجاة بالحماية) تظهر للجميع عند بدء النهار.'
                            : '. يمكنك تغييره قبل انتهاء المؤقت.'}
                        </p>
                      </div>
                      <form action={submitMafiaAction} className="stack-form">
                        <input type="hidden" name="gameId" value={game.id} />
                        <input type="hidden" name="participantId" value={player.id} />
                        <label>
                          {nightActionLabel.choose}
                          <select name="targetId" required defaultValue={submittedAction.targetId}>
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
                        <Button type="submit" variant="secondary">
                          <Moon />
                          تعديل القرار
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <form action={submitMafiaAction} className="stack-form">
                      <input type="hidden" name="gameId" value={game.id} />
                      <input type="hidden" name="participantId" value={player.id} />
                      <label>
                        {nightActionLabel.choose}
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
                        {nightActionLabel.confirm}
                      </Button>
                    </form>
                  )
                ) : game.status === 'NIGHT' ? (
                  <p className="muted">
                    لا إجراء ليلي لدورك. أغمض عينيك وانتظر انتهاء قرارات الليل وإعلان النتيجة.
                  </p>
                ) : game.status === 'VOTING' ? (
                  submittedVote ? (
                    <div className="mafia-action-done" role="status">
                      <CheckCircle2 aria-hidden="true" />
                      <div>
                        <strong>تم تثبيت صوتك</strong>
                        <p>
                          صوّت ضد: {submittedVote.target.displayName}. يمكنك تغيير الصوت قبل
                          الصفر.
                        </p>
                      </div>
                      <form action={submitMafiaVote} className="stack-form">
                        <input type="hidden" name="gameId" value={game.id} />
                        <input type="hidden" name="participantId" value={player.id} />
                        <label>
                          غيّر صوتك ضد
                          <select name="targetId" required defaultValue={submittedVote.targetId}>
                            {alivePlayers
                              .filter((target) => target.id !== player.id)
                              .map((target) => (
                                <option key={target.id} value={target.id}>
                                  {target.displayName}
                                </option>
                              ))}
                          </select>
                        </label>
                        <Button type="submit" variant="secondary">
                          <Vote />
                          تعديل التصويت
                        </Button>
                      </form>
                    </div>
                  ) : (
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
                  )
                ) : game.status === 'DAY' ? (
                  <div className="mafia-day-hint">
                    <p>ناقش الأدلة في القناة العامة قبل فتح التصويت.</p>
                    <ul>
                      <li>اسأل عن سبب كل اتهام.</li>
                      <li>قارن كلام اللاعبين بنتيجة الليل.</li>
                      <li>جهّز اسم المشتبه الذي ستصوّت ضده.</li>
                    </ul>
                  </div>
                ) : (
                  <p className="muted">انتهت الجولة.</p>
                )}
              </Card>
            </div>
          )}

          {game.status !== 'LOBBY' && (
            <Card className="mafia-roster-card">
              <div className="inline-between">
                <h2>
                  <Users aria-hidden="true" />
                  لوحة اللاعبين
                </h2>
                <Badge>
                  {alivePlayers.length.toLocaleString('ar-SA')} أحياء ·{' '}
                  {eliminatedPlayers.length.toLocaleString('ar-SA')} مستبعدون
                </Badge>
              </div>
              <div className="mafia-roster-columns">
                <div>
                  <h3>الأحياء</h3>
                  <ul className="mafia-roster-list">
                    {alivePlayers.map((item) => (
                      <li key={item.id} data-self={item.id === player.id || undefined}>
                        <span className="mafia-player-avatar" aria-hidden="true">
                          {mafiaDisplayInitial(item.displayName)}
                        </span>
                        <div className="mafia-player-identity">
                          <strong>{item.displayName}</strong>
                          <span>حي</span>
                        </div>
                        {item.id === player.id && <Badge>أنت</Badge>}
                        {game.status === 'FINISHED' && item.role && (
                          <span>
                            {mafiaRoleEmoji[item.role as MafiaRoleName]}{' '}
                            {mafiaRoleLabels[item.role as MafiaRoleName]}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>الضحايا / المستبعدون</h3>
                  {eliminatedPlayers.length === 0 ? (
                    <p className="muted">لم يُقتل أو يُستبعد أحد بعد.</p>
                  ) : (
                    <ul className="mafia-roster-list mafia-roster-list--out">
                      {eliminatedPlayers.map((item) => (
                        <li key={item.id} data-self={item.id === player.id || undefined}>
                          <span className="mafia-player-avatar mafia-player-avatar--out" aria-hidden="true">
                            {mafiaDisplayInitial(item.displayName)}
                          </span>
                          <div className="mafia-player-identity">
                            <strong>{item.displayName}</strong>
                            <span>تم إخراجه من اللعبة</span>
                          </div>
                          <Badge className="mafia-badge-killed">ضحية</Badge>
                          {game.status === 'FINISHED' && item.role && (
                            <span>
                              {mafiaRoleEmoji[item.role as MafiaRoleName]}{' '}
                              {mafiaRoleLabels[item.role as MafiaRoleName]}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              {game.status !== 'FINISHED' && (
                <p className="mafia-roster-note muted">
                  الأدوار تبقى مخفية حتى النهاية. لا تعتمد إلا على النقاش والأدلة.
                </p>
              )}
            </Card>
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
                <div
                  className="mafia-message"
                  data-system={message.channel === 'SYSTEM' || undefined}
                  key={message.id}
                >
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
