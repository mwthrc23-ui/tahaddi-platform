import { Eye, MessageCircle, Moon, Shield, Skull, Sun, Vote } from 'lucide-react';
import { redirect } from 'next/navigation';
import { sendMafiaMessage, submitMafiaAction, submitMafiaVote } from '@/app/mafia/actions';
import { SiteLayout } from '@/components/layout';
import { RoomPoller } from '@/components/live';
import { Badge, Button, Card, EmptyState } from '@/components/ui';
import { getPrismaClient, hasDatabaseUrl } from '@/lib/auth/prisma';
import { mafiaPhaseLabels, mafiaRoleLabels, type MafiaRoleName } from '@/lib/mafia/rules';

const roleInstructions: Record<MafiaRoleName, string> = {
  KILLER: 'اختر ضحيتك ليلًا وتعاون مع القتلة في القناة السرية.',
  DETECTIVE: 'تحقق من لاعب واحد كل ليلة؛ تظهر النتيجة لك وحدك.',
  DOCTOR: 'اختر لاعبًا لحمايته من القتل في هذه الليلة.',
  GUARD: 'احمِ لاعبًا آخر. لا يمكنك حماية نفسك.',
  WITNESS: 'يصلك دليل مختصر بعد كل ليلة، لكن لا تكشف نفسك سريعًا.',
  CITIZEN: 'راقب النقاش وصوّت لطرد القاتل.',
};

export default async function MafiaPlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ participantId?: string; token?: string }>;
}) {
  if (!hasDatabaseUrl()) redirect('/join?error=unavailable');
  const [{ gameId }, query] = await Promise.all([params, searchParams]);
  const participantId = query.participantId ?? '';
  const participantToken = query.token ?? '';
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
            <RoomPoller
              endpoint={`/api/mafia/${game.id}/tick`}
              participantId={player.id}
              participantToken={participantToken}
            />
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
                <p>{role ? roleInstructions[role] : 'انتظر المضيف.'}</p>
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
                  <h2>قرار المرحلة</h2>
                  {game.phaseEndsAt && (
                    <Badge>
                      حتى{' '}
                      {game.phaseEndsAt.toLocaleTimeString('ar-SA', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </Badge>
                  )}
                </div>
                {player.status === 'ELIMINATED' ? (
                  <p className="muted">يمكنك متابعة النقاش والكتابة في قناة المستبعدين فقط.</p>
                ) : game.status === 'NIGHT' && nightActionRole ? (
                  <form action={submitMafiaAction} className="stack-form">
                    <input type="hidden" name="gameId" value={game.id} />
                    <input type="hidden" name="participantId" value={player.id} />
                    <input type="hidden" name="participantToken" value={participantToken} />
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
                    <input type="hidden" name="participantToken" value={participantToken} />
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
                <input type="hidden" name="participantToken" value={participantToken} />
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
