'use client';

import {
  Check,
  Clipboard,
  Clock3,
  Crown,
  Fingerprint,
  LoaderCircle,
  Orbit,
  Play,
  QrCode as QrCodeIcon,
  Radio,
  RotateCcw,
  Send,
  Sparkles,
  Trophy,
  UsersRound,
  Vote,
  X,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { io, type Socket } from 'socket.io-client';
import { SPECIAL_GAME_HOW_TO, SPECIAL_GAME_META, type SpecialGameMode } from '@tahaddi/domain';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Button, ButtonLink, Card, Input } from '@/components/ui';

type Player = { id: string; name: string; score: number };
type Room = {
  pin: string;
  hostId: string;
  mode: SpecialGameMode;
  phase:
    | 'lobby'
    | 'parallel-answering'
    | 'parallel-reveal'
    | 'reverse-writing'
    | 'reverse-voting'
    | 'reverse-results'
    | 'infiltrator-answering'
    | 'infiltrator-voting'
    | 'infiltrator-reveal'
    | 'finished';
  roundIndex: number;
  roundCount: number;
  players: Player[];
};
type ParallelRound = {
  roundId: string;
  roundNumber: number;
  roundCount: number;
  face: string;
  faceLabel: string;
  prompt: string;
  options: string[];
  startsAt: number;
  timeLimit: number;
};
type ParallelReveal = {
  answer: string;
  reveal: string;
  results: Array<{
    playerId: string;
    playerName: string;
    faceLabel: string;
    prompt: string;
    selectedAnswer: string | null;
    correct: boolean;
  }>;
};
type ReverseRound = {
  roundId: string;
  roundNumber: number;
  roundCount: number;
  answer: string;
  category: string;
  hint: string;
  startsAt: number;
  timeLimit: number;
};
type ReverseVoting = {
  answer: string;
  submissions: Array<{ id: string; text: string; isOwn: boolean }>;
};
type ReverseResults = {
  answer: string;
  results: Array<{ id: string; playerName: string; text: string; votes: number }>;
};
type InfiltratorRound = {
  roundId: string;
  roundNumber: number;
  roundCount: number;
  prompt: string;
  options: string[];
  isInfiltrator: boolean;
  startsAt: number;
  timeLimit: number;
};
type InfiltratorVoting = {
  answers: Array<{ playerId: string; answer: string; isOwn: boolean }>;
  isInfiltrator: boolean;
  majorityOptions: string[];
};
type InfiltratorReveal = {
  infiltratorId: string;
  infiltratorName: string;
  caught: boolean;
  survived: boolean;
  guessedMajority: boolean;
  infiltratorWon: boolean;
  majorityQuestion: string;
  answers: Array<{ playerId: string; playerName: string; answer: string }>;
  voteCounts: Record<string, number>;
};
type GameEnd = { players: Player[]; mode: SpecialGameMode };

type ServerEvents = {
  'special:room:state': (payload: Room) => void;
  'special:error': (payload: { code: string; message: string }) => void;
  'special:game:end': (payload: GameEnd) => void;
  'parallel:round': (payload: ParallelRound) => void;
  'parallel:answer:ack': (payload: {
    correct: boolean;
    earned: number;
    selectedAnswer: string;
  }) => void;
  'parallel:reveal': (payload: ParallelReveal) => void;
  'reverse:round': (payload: ReverseRound) => void;
  'reverse:question:ack': (payload: { question: string }) => void;
  'reverse:voting': (payload: ReverseVoting) => void;
  'reverse:vote:ack': (payload: { submissionId: string }) => void;
  'reverse:results': (payload: ReverseResults) => void;
  'infiltrator:round': (payload: InfiltratorRound) => void;
  'infiltrator:answer:ack': (payload: { selectedAnswer: string }) => void;
  'infiltrator:voting': (payload: InfiltratorVoting) => void;
  'infiltrator:vote:ack': (payload: { playerId: string }) => void;
  'infiltrator:majority:guess:ack': (payload: { question: string }) => void;
  'infiltrator:reveal': (payload: InfiltratorReveal) => void;
};
type ClientEvents = {
  'special:room:create': (payload: { mode: SpecialGameMode }) => void;
  'special:room:join': (payload: { pin: string; playerName: string }) => void;
  'special:game:start': (payload: { pin: string }) => void;
  'special:round:next': (payload: { pin: string }) => void;
  'parallel:answer:submit': (payload: { pin: string; roundId: string; answer: string }) => void;
  'parallel:reveal': (payload: { pin: string }) => void;
  'reverse:question:submit': (payload: { pin: string; roundId: string; question: string }) => void;
  'reverse:voting:start': (payload: { pin: string }) => void;
  'reverse:vote': (payload: { pin: string; submissionId: string }) => void;
  'reverse:reveal': (payload: { pin: string }) => void;
  'infiltrator:answer:submit': (payload: { pin: string; roundId: string; answer: string }) => void;
  'infiltrator:voting:start': (payload: { pin: string }) => void;
  'infiltrator:vote': (payload: { pin: string; playerId: string }) => void;
  'infiltrator:majority:guess': (payload: { pin: string; question: string }) => void;
  'infiltrator:reveal': (payload: { pin: string }) => void;
};
type GameSocket = Socket<ServerEvents, ClientEvents>;

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);

export function resolveSpecialGamesRealtimeUrl(
  configuredUrl: string | undefined,
  currentOrigin: string,
) {
  const normalizedUrl = configuredUrl?.trim().replace(/\/+$/, '');
  if (!normalizedUrl) return '/special-games';

  try {
    const configured = new URL(normalizedUrl);
    const current = new URL(currentOrigin);
    const configuredIsLoopback = LOOPBACK_HOSTS.has(configured.hostname);
    const currentIsLoopback = LOOPBACK_HOSTS.has(current.hostname);
    const wouldUseMixedContent = current.protocol === 'https:' && configured.protocol === 'http:';

    if ((!currentIsLoopback && configuredIsLoopback) || wouldUseMixedContent) {
      return `${current.origin}/special-games`;
    }
  } catch {
    return '/special-games';
  }

  return `${normalizedUrl}/special-games`;
}

function Timer({ startsAt, timeLimit }: { startsAt: number; timeLimit: number }) {
  const [remaining, setRemaining] = useState(timeLimit);

  useEffect(() => {
    const tick = () => {
      const elapsed = Math.max(0, Date.now() - startsAt) / 1000;
      setRemaining(Math.max(0, Math.ceil(timeLimit - elapsed)));
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [startsAt, timeLimit]);

  return (
    <div className="special-timer" data-warning={remaining <= 8 || undefined}>
      <Clock3 aria-hidden="true" />
      <span>{remaining.toLocaleString('ar-SA')}</span>
      <span className="sr-only">ثانية متبقية</span>
    </div>
  );
}

function PlayerRail({ players, currentSocketId }: { players: Player[]; currentSocketId?: string }) {
  return (
    <aside className="special-player-rail" aria-label="اللاعبون والترتيب">
      <div className="special-player-rail__title">
        <UsersRound aria-hidden="true" />
        <strong>{players.length.toLocaleString('ar-SA')} لاعبين</strong>
      </div>
      {players.length === 0 ? (
        <p className="muted">بانتظار أول لاعب.</p>
      ) : (
        <ol>
          {players.map((player, index) => (
            <li key={player.id} data-current={player.id === currentSocketId || undefined}>
              <span>{(index + 1).toLocaleString('ar-SA')}</span>
              <strong>{player.name}</strong>
              <b>{player.score.toLocaleString('ar-SA')}</b>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}

export function SpecialGameRoom({
  mode,
  initialPin,
}: {
  mode: SpecialGameMode;
  initialPin: string;
}) {
  const meta = SPECIAL_GAME_META[mode];
  const howTo = SPECIAL_GAME_HOW_TO[mode];
  const socketRef = useRef<GameSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [socketId, setSocketId] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [joinMode, setJoinMode] = useState(Boolean(initialPin));
  const [pin, setPin] = useState(initialPin);
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [parallelRound, setParallelRound] = useState<ParallelRound | null>(null);
  const [parallelAck, setParallelAck] = useState<{
    correct: boolean;
    earned: number;
    selectedAnswer: string;
  } | null>(null);
  const [parallelReveal, setParallelReveal] = useState<ParallelReveal | null>(null);
  const [reverseRound, setReverseRound] = useState<ReverseRound | null>(null);
  const [reverseQuestion, setReverseQuestion] = useState('');
  const [submittedQuestion, setSubmittedQuestion] = useState('');
  const [voting, setVoting] = useState<ReverseVoting | null>(null);
  const [selectedVote, setSelectedVote] = useState('');
  const [reverseResults, setReverseResults] = useState<ReverseResults | null>(null);
  const [infiltratorRound, setInfiltratorRound] = useState<InfiltratorRound | null>(null);
  const [infiltratorAnswer, setInfiltratorAnswer] = useState('');
  const [infiltratorVoting, setInfiltratorVoting] = useState<InfiltratorVoting | null>(null);
  const [infiltratorVote, setInfiltratorVote] = useState('');
  const [infiltratorGuess, setInfiltratorGuess] = useState('');
  const [infiltratorReveal, setInfiltratorReveal] = useState<InfiltratorReveal | null>(null);
  const [gameEnd, setGameEnd] = useState<GameEnd | null>(null);

  const resetRoundState = useCallback(() => {
    setError('');
    setParallelRound(null);
    setParallelAck(null);
    setParallelReveal(null);
    setReverseRound(null);
    setReverseQuestion('');
    setSubmittedQuestion('');
    setVoting(null);
    setSelectedVote('');
    setReverseResults(null);
    setInfiltratorRound(null);
    setInfiltratorAnswer('');
    setInfiltratorVoting(null);
    setInfiltratorVote('');
    setInfiltratorGuess('');
    setInfiltratorReveal(null);
  }, []);

  useEffect(() => {
    const realtimeUrl = resolveSpecialGamesRealtimeUrl(
      process.env.NEXT_PUBLIC_REALTIME_URL,
      window.location.origin,
    );
    const socket: GameSocket = io(realtimeUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setConnectionFailed(false);
      setSocketId(socket.id ?? '');
      setError('');
    });
    socket.on('disconnect', () => {
      setConnected(false);
      setSocketId('');
    });
    socket.on('connect_error', () => {
      setConnected(false);
      setConnectionFailed(true);
      setBusy(false);
      setError('تعذّر الاتصال بخدمة اللعب المباشر. تحقق من اتصالك ثم أعد تحميل الصفحة.');
    });
    socket.on('special:error', ({ message }) => {
      setBusy(false);
      setError(message);
    });
    socket.on('special:room:state', (payload) => {
      setBusy(false);
      setRoom(payload);
    });
    socket.on('parallel:round', (payload) => {
      resetRoundState();
      setParallelRound(payload);
    });
    socket.on('parallel:answer:ack', (payload) => {
      setBusy(false);
      setParallelAck(payload);
    });
    socket.on('parallel:reveal', (payload) => {
      setBusy(false);
      setParallelReveal(payload);
    });
    socket.on('reverse:round', (payload) => {
      resetRoundState();
      setReverseRound(payload);
    });
    socket.on('reverse:question:ack', ({ question }) => {
      setBusy(false);
      setSubmittedQuestion(question);
    });
    socket.on('reverse:voting', (payload) => {
      setBusy(false);
      setVoting(payload);
    });
    socket.on('reverse:vote:ack', ({ submissionId }) => {
      setBusy(false);
      setSelectedVote(submissionId);
    });
    socket.on('reverse:results', (payload) => {
      setBusy(false);
      setReverseResults(payload);
    });
    socket.on('infiltrator:round', (payload) => {
      resetRoundState();
      setInfiltratorRound(payload);
    });
    socket.on('infiltrator:answer:ack', ({ selectedAnswer }) => {
      setBusy(false);
      setInfiltratorAnswer(selectedAnswer);
    });
    socket.on('infiltrator:voting', (payload) => {
      setBusy(false);
      setInfiltratorVoting(payload);
    });
    socket.on('infiltrator:vote:ack', ({ playerId }) => {
      setBusy(false);
      setInfiltratorVote(playerId);
    });
    socket.on('infiltrator:majority:guess:ack', ({ question }) => {
      setBusy(false);
      setInfiltratorGuess(question);
    });
    socket.on('infiltrator:reveal', (payload) => {
      setBusy(false);
      setInfiltratorReveal(payload);
    });
    socket.on('special:game:end', (payload) => {
      setBusy(false);
      setGameEnd(payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [resetRoundState]);

  const shareUrl =
    room && typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?join=${room.pin}`
      : '';
  const isHost = Boolean(room && socketId === room.hostId);
  const currentSocketId = socketId;
  const minimumReached = (room?.players.length ?? 0) >= meta.minimumPlayers;
  const activeMode = room?.mode ?? mode;
  const activeMeta = SPECIAL_GAME_META[activeMode];

  const nextRound = () => {
    if (!room) return;
    setBusy(true);
    resetRoundState();
    socketRef.current?.emit('special:round:next', { pin: room.pin });
  };

  const copyInvite = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };

  const joinRoom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanPin = pin.replace(/\D/g, '').slice(0, 6);
    if (cleanPin.length !== 6 || playerName.trim().length < 2) {
      setError('أدخل رمزًا من 6 أرقام واسمًا من حرفين على الأقل.');
      return;
    }
    setBusy(true);
    setError('');
    socketRef.current?.emit('special:room:join', {
      pin: cleanPin,
      playerName,
    });
  };

  const phaseTitle = useMemo(() => {
    if (!room) return activeMeta.title;
    if (room.phase === 'lobby') return 'غرفة الانتظار';
    if (room.phase === 'parallel-answering') return 'العوالم مفتوحة';
    if (room.phase === 'parallel-reveal') return 'انكشفت العوالم';
    if (room.phase === 'reverse-writing') return 'اصنع السؤال';
    if (room.phase === 'reverse-voting') return 'صوّت للأذكى';
    if (room.phase === 'reverse-results') return 'نتيجة التصويت';
    if (room.phase === 'infiltrator-answering') return 'من هو الدخيل؟';
    if (room.phase === 'infiltrator-voting') return 'اكتشف الدخيل';
    if (room.phase === 'infiltrator-reveal') return 'انكشف الدخيل';
    return 'النتيجة النهائية';
  }, [activeMeta.title, room]);

  if (!room) {
    return (
      <section className="section special-game-entry">
        <div className="container">
          <div className="special-game-entry__heading">
            <ButtonLink href="/games" variant="ghost">
              <RotateCcw aria-hidden="true" />
              كل الألعاب
            </ButtonLink>
            <div className="special-status" data-connected={connected || undefined}>
              <Radio aria-hidden="true" />
              {connected ? 'متصل بخدمة اللعب' : connectionFailed ? 'تعذّر الاتصال' : 'جارٍ الاتصال'}
            </div>
          </div>

          <div className="special-entry-grid">
            <div className="special-entry-copy">
              {mode === 'parallel-world' ? (
                <Orbit className="special-entry-copy__mark" aria-hidden="true" />
              ) : mode === 'reverse-time' ? (
                <Clock3 className="special-entry-copy__mark" aria-hidden="true" />
              ) : (
                <Fingerprint className="special-entry-copy__mark" aria-hidden="true" />
              )}
              <h1>{meta.title}</h1>
              <p>{meta.description}</p>
              <dl>
                <div>
                  <dt>الحد الأدنى</dt>
                  <dd>{meta.minimumPlayers.toLocaleString('ar-SA')} لاعبين</dd>
                </div>
                <div>
                  <dt>وقت الجولة</dt>
                  <dd>{meta.roundSeconds.toLocaleString('ar-SA')} ثانية</dd>
                </div>
                <div>
                  <dt>المشاركة</dt>
                  <dd>رمز + QR</dd>
                </div>
              </dl>
              <div className="special-howto">
                <h2>كيف تلعب؟</h2>
                <p className="special-howto__goal">{howTo.goal}</p>
                <ol>
                  {howTo.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <p className="special-howto__tip">
                  <Sparkles aria-hidden="true" />
                  {howTo.tip}
                </p>
              </div>
            </div>

            <Card className="special-entry-panel">
              <div className="special-entry-tabs" role="tablist" aria-label="طريقة الدخول">
                <button
                  type="button"
                  role="tab"
                  aria-selected={!joinMode}
                  onClick={() => setJoinMode(false)}
                >
                  أنشئ غرفة
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={joinMode}
                  onClick={() => setJoinMode(true)}
                >
                  انضم برمز
                </button>
              </div>

              {joinMode ? (
                <form onSubmit={joinRoom} className="special-join-form" noValidate>
                  <Input
                    id="special-player-name"
                    label="اسم اللاعب"
                    value={playerName}
                    onChange={(event) => {
                      setPlayerName(event.target.value);
                      setError('');
                    }}
                    placeholder="الاسم الظاهر في الترتيب"
                    maxLength={30}
                    autoComplete="nickname"
                  />
                  <Input
                    id="special-room-pin"
                    label="رمز الغرفة"
                    value={pin}
                    onChange={(event) => {
                      setPin(event.target.value.replace(/\D/g, '').slice(0, 6));
                      setError('');
                    }}
                    placeholder="000000"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    error={error || undefined}
                  />
                  <Button type="submit" size="lg" loading={busy} disabled={!connected || busy}>
                    <Play aria-hidden="true" />
                    ادخل الغرفة
                  </Button>
                </form>
              ) : (
                <div className="special-create-room">
                  <QrCodeIcon aria-hidden="true" />
                  <h2>شاشة واحدة للمضيف</h2>
                  <p>
                    سيظهر رمز وQR للضيوف. افتح الرابط من هواتفهم، اكتبوا الأسماء، ثم ابدأ الجولة.
                  </p>
                  <Button
                    variant="gold"
                    size="lg"
                    loading={busy}
                    disabled={!connected || busy}
                    onClick={() => {
                      setBusy(true);
                      setError('');
                      socketRef.current?.emit('special:room:create', { mode });
                    }}
                  >
                    <Play aria-hidden="true" />
                    أنشئ الغرفة
                  </Button>
                </div>
              )}
              {error && (
                <p className="special-error" role="alert">
                  <X aria-hidden="true" />
                  {error}
                </p>
              )}
            </Card>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section special-game-stage">
      <div className="container">
        <header className="special-stage-header">
          <div>
            <span className="special-stage-header__mode">{activeMeta.title}</span>
            <h1>{phaseTitle}</h1>
          </div>
          <div className="special-stage-header__signals">
            <span className="special-status" data-connected={connected || undefined}>
              <Radio aria-hidden="true" />
              {connected ? 'LIVE' : 'OFFLINE'}
            </span>
            <span className="special-room-pin">غرفة {room.pin}</span>
          </div>
        </header>

        {room.phase === 'lobby' && (
          <div className="special-lobby-grid">
            <Card className="special-invite-panel">
              <div className="special-qr">
                {shareUrl ? (
                  <QRCode
                    value={shareUrl}
                    size={220}
                    bgColor="var(--qr-paper)"
                    fgColor="var(--qr-ink)"
                    aria-label={`رمز QR للانضمام إلى الغرفة ${room.pin}`}
                  />
                ) : (
                  <LoaderCircle className="spin" aria-hidden="true" />
                )}
              </div>
              <div className="special-invite-copy">
                <span>رمز الدخول</span>
                <strong dir="ltr">{room.pin}</strong>
                <p>امسح QR أو افتح رابط الدعوة من جهاز كل لاعب.</p>
                <Button variant="outline" onClick={copyInvite} disabled={!shareUrl}>
                  {copied ? <Check aria-hidden="true" /> : <Clipboard aria-hidden="true" />}
                  {copied ? 'نُسخ الرابط' : 'انسخ الرابط'}
                </Button>
              </div>
            </Card>

            <div className="special-lobby-control">
              <PlayerRail players={room.players} currentSocketId={currentSocketId} />
              {isHost ? (
                <>
                  <p className="special-minimum-note" data-ready={minimumReached || undefined}>
                    {minimumReached
                      ? 'اكتمل الحد الأدنى. الجولة جاهزة.'
                      : `بانتظار ${Math.max(0, meta.minimumPlayers - room.players.length).toLocaleString('ar-SA')} لاعبين.`}
                  </p>
                  <Button
                    variant="gold"
                    size="lg"
                    fullWidth
                    loading={busy}
                    disabled={!minimumReached || busy}
                    onClick={() => {
                      setBusy(true);
                      socketRef.current?.emit('special:game:start', { pin: room.pin });
                    }}
                  >
                    <Play aria-hidden="true" />
                    ابدأ الجولة
                  </Button>
                </>
              ) : (
                <p className="special-waiting" role="status">
                  <LoaderCircle className="spin" aria-hidden="true" />
                  أنت داخل الغرفة. المضيف سيبدأ بعد اكتمال اللاعبين.
                </p>
              )}
            </div>
          </div>
        )}

        {room.phase !== 'lobby' && room.phase !== 'finished' && (
          <div className="special-play-grid">
            <main className="special-round-panel">
              {room.phase === 'parallel-answering' &&
                (isHost ? (
                  <Card className="special-host-monitor">
                    <Orbit aria-hidden="true" />
                    <h2>لكل لاعب عالمه الآن</h2>
                    <p>الأسئلة موزعة سرًا، والإجابة المشتركة لا تظهر حتى تضغط «اكشف العوالم».</p>
                    <Button
                      variant="gold"
                      size="lg"
                      loading={busy}
                      onClick={() => {
                        setBusy(true);
                        socketRef.current?.emit('parallel:reveal', { pin: room.pin });
                      }}
                    >
                      <Sparkles aria-hidden="true" />
                      اكشف العوالم
                    </Button>
                  </Card>
                ) : parallelRound ? (
                  <Card className="special-question-panel">
                    <div className="special-round-meta">
                      <span>{parallelRound.faceLabel}</span>
                      <span>
                        {parallelRound.roundNumber.toLocaleString('ar-SA')} /{' '}
                        {parallelRound.roundCount.toLocaleString('ar-SA')}
                      </span>
                      <Timer
                        startsAt={parallelRound.startsAt}
                        timeLimit={parallelRound.timeLimit}
                      />
                    </div>
                    <h2>{parallelRound.prompt}</h2>
                    <div className="special-options">
                      {parallelRound.options.map((option) => {
                        const selected = parallelAck?.selectedAnswer === option;
                        const state = parallelAck
                          ? selected
                            ? parallelAck.correct
                              ? 'success'
                              : 'error'
                            : 'disabled'
                          : busy
                            ? 'loading'
                            : 'default';
                        return (
                          <button
                            type="button"
                            className="special-option"
                            data-state={state}
                            disabled={Boolean(parallelAck) || busy}
                            key={option}
                            onClick={() => {
                              setBusy(true);
                              socketRef.current?.emit('parallel:answer:submit', {
                                pin: room.pin,
                                roundId: parallelRound.roundId,
                                answer: option,
                              });
                            }}
                          >
                            <span>{option}</span>
                            {selected && parallelAck?.correct && <Check aria-hidden="true" />}
                            {selected && parallelAck && !parallelAck.correct && (
                              <X aria-hidden="true" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {parallelAck && (
                      <p
                        className={parallelAck.correct ? 'special-success' : 'special-error'}
                        role="status"
                      >
                        {parallelAck.correct
                          ? `إجابة صحيحة +${parallelAck.earned.toLocaleString('ar-SA')}`
                          : 'سُجلت الإجابة. انتظر كشف العوالم.'}
                      </p>
                    )}
                  </Card>
                ) : (
                  <Card className="special-waiting">
                    <LoaderCircle className="spin" aria-hidden="true" />
                    جارٍ فتح عالمك…
                  </Card>
                ))}

              {room.phase === 'parallel-reveal' && parallelReveal && (
                <Card className="special-reveal-panel">
                  <span>الإجابة المشتركة</span>
                  <h2>{parallelReveal.answer}</h2>
                  <p>{parallelReveal.reveal}</p>
                  <div className="special-reveal-list">
                    {parallelReveal.results.map((result) => (
                      <article key={result.playerId} data-correct={result.correct || undefined}>
                        <div>
                          <strong>{result.playerName}</strong>
                          <span>{result.faceLabel}</span>
                        </div>
                        <p>{result.prompt}</p>
                        <b>
                          {result.selectedAnswer ?? 'لم يجب'}
                          {result.correct ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
                        </b>
                      </article>
                    ))}
                  </div>
                  {isHost && (
                    <Button variant="gold" size="lg" onClick={nextRound} loading={busy}>
                      الجولة التالية
                    </Button>
                  )}
                </Card>
              )}

              {room.phase === 'reverse-writing' &&
                (reverseRound ? (
                  <Card className="special-reverse-panel">
                    <div className="special-round-meta">
                      <span>{reverseRound.category}</span>
                      <span>
                        {reverseRound.roundNumber.toLocaleString('ar-SA')} /{' '}
                        {reverseRound.roundCount.toLocaleString('ar-SA')}
                      </span>
                      <Timer startsAt={reverseRound.startsAt} timeLimit={reverseRound.timeLimit} />
                    </div>
                    <div className="special-reverse-answer">
                      <span>الإجابة ظهرت أولًا</span>
                      <h2>{reverseRound.answer}</h2>
                      <p>{reverseRound.hint}</p>
                    </div>
                    {isHost ? (
                      <div className="special-host-actions">
                        <p>انتظر أسئلة اللاعبين، ثم افتح التصويت عندما يصل سؤالان على الأقل.</p>
                        <Button
                          variant="gold"
                          size="lg"
                          loading={busy}
                          onClick={() => {
                            setBusy(true);
                            socketRef.current?.emit('reverse:voting:start', { pin: room.pin });
                          }}
                        >
                          <Vote aria-hidden="true" />
                          افتح التصويت
                        </Button>
                      </div>
                    ) : submittedQuestion ? (
                      <div className="special-submitted-question" role="status">
                        <Check aria-hidden="true" />
                        <div>
                          <strong>سُجل سؤالك</strong>
                          <p>{submittedQuestion}</p>
                        </div>
                      </div>
                    ) : (
                      <form
                        className="special-question-form"
                        onSubmit={(event) => {
                          event.preventDefault();
                          if (reverseQuestion.trim().length < 8) {
                            setError('اكتب سؤالًا من 8 أحرف على الأقل.');
                            return;
                          }
                          setBusy(true);
                          setError('');
                          socketRef.current?.emit('reverse:question:submit', {
                            pin: room.pin,
                            roundId: reverseRound.roundId,
                            question: reverseQuestion,
                          });
                        }}
                      >
                        <label htmlFor="reverse-question">سؤالك الذكي</label>
                        <textarea
                          id="reverse-question"
                          value={reverseQuestion}
                          onChange={(event) => {
                            setReverseQuestion(event.target.value.slice(0, 180));
                            setError('');
                          }}
                          placeholder="اكتب سؤالًا تكون إجابته المعروضة أعلاه…"
                          aria-invalid={Boolean(error)}
                          aria-describedby={
                            error ? 'reverse-question-error' : 'reverse-question-hint'
                          }
                        />
                        <div className="special-field-hint">
                          <span id={error ? 'reverse-question-error' : 'reverse-question-hint'}>
                            {error || `${reverseQuestion.length.toLocaleString('ar-SA')} / ١٨٠`}
                          </span>
                        </div>
                        <Button type="submit" size="lg" loading={busy}>
                          <Send aria-hidden="true" />
                          أرسل السؤال
                        </Button>
                      </form>
                    )}
                  </Card>
                ) : (
                  <Card className="special-waiting">
                    <LoaderCircle className="spin" aria-hidden="true" />
                    جارٍ قلب الزمن…
                  </Card>
                ))}

              {room.phase === 'reverse-voting' &&
                (isHost ? (
                  <Card className="special-host-monitor">
                    <Vote aria-hidden="true" />
                    <h2>التصويت مفتوح</h2>
                    <p>كل لاعب يرى الأسئلة بلا أسماء ولا يستطيع التصويت لسؤاله.</p>
                    <Button
                      variant="gold"
                      size="lg"
                      loading={busy}
                      onClick={() => {
                        setBusy(true);
                        socketRef.current?.emit('reverse:reveal', { pin: room.pin });
                      }}
                    >
                      <Trophy aria-hidden="true" />
                      اكشف الفائز
                    </Button>
                  </Card>
                ) : voting ? (
                  <Card className="special-voting-panel">
                    <span>الإجابة: {voting.answer}</span>
                    <h2>أي سؤال هو الأذكى؟</h2>
                    <div className="special-vote-list">
                      {voting.submissions.map((submission) => (
                        <button
                          type="button"
                          key={submission.id}
                          disabled={submission.isOwn || Boolean(selectedVote) || busy}
                          data-selected={selectedVote === submission.id || undefined}
                          onClick={() => {
                            setBusy(true);
                            socketRef.current?.emit('reverse:vote', {
                              pin: room.pin,
                              submissionId: submission.id,
                            });
                          }}
                        >
                          <span>{submission.text}</span>
                          {submission.isOwn ? <small>سؤالك</small> : <Vote aria-hidden="true" />}
                        </button>
                      ))}
                    </div>
                  </Card>
                ) : (
                  <Card className="special-waiting">
                    <LoaderCircle className="spin" aria-hidden="true" />
                    جارٍ تجهيز بطاقات التصويت…
                  </Card>
                ))}

              {room.phase === 'reverse-results' && reverseResults && (
                <Card className="special-results-panel">
                  <Crown aria-hidden="true" />
                  <span>الإجابة: {reverseResults.answer}</span>
                  <h2>السؤال الأذكى</h2>
                  <ol>
                    {reverseResults.results.map((result, index) => (
                      <li key={result.id}>
                        <b>{(index + 1).toLocaleString('ar-SA')}</b>
                        <div>
                          <strong>{result.text}</strong>
                          <span>{result.playerName}</span>
                        </div>
                        <em>{result.votes.toLocaleString('ar-SA')} أصوات</em>
                      </li>
                    ))}
                  </ol>
                  {isHost && (
                    <Button variant="gold" size="lg" onClick={nextRound} loading={busy}>
                      الجولة التالية
                    </Button>
                  )}
                </Card>
              )}

              {room.phase === 'infiltrator-answering' &&
                (isHost ? (
                  <Card className="special-host-monitor">
                    <Fingerprint aria-hidden="true" />
                    <h2>وُزّعت الأدوار سرًا</h2>
                    <p>الأغلبية ترى سؤالًا واحدًا، والدخيل يرى سؤالًا مختلفًا. لا تكشف الأسئلة.</p>
                    <Button
                      variant="gold"
                      size="lg"
                      loading={busy}
                      onClick={() => {
                        setBusy(true);
                        socketRef.current?.emit('infiltrator:voting:start', { pin: room.pin });
                      }}
                    >
                      <Vote aria-hidden="true" />
                      اعرض الإجابات المجهولة
                    </Button>
                  </Card>
                ) : infiltratorRound ? (
                  <Card className="special-question-panel">
                    <div className="special-round-meta">
                      <span data-role={infiltratorRound.isInfiltrator ? 'infiltrator' : 'majority'}>
                        {infiltratorRound.isInfiltrator ? 'أنت الدخيل' : 'أنت من الأغلبية'}
                      </span>
                      <span>
                        {infiltratorRound.roundNumber.toLocaleString('ar-SA')} /{' '}
                        {infiltratorRound.roundCount.toLocaleString('ar-SA')}
                      </span>
                      <Timer
                        startsAt={infiltratorRound.startsAt}
                        timeLimit={infiltratorRound.timeLimit}
                      />
                    </div>
                    <p className="special-role-hint">
                      {infiltratorRound.isInfiltrator
                        ? 'تظاهر أن سؤالك هو سؤال الجميع، ثم حاول النجاة من التصويت.'
                        : 'أجب طبيعيًا، ثم راقب الإجابات لتكتشف صاحب السؤال المختلف.'}
                    </p>
                    <h2>{infiltratorRound.prompt}</h2>
                    <div className="special-options">
                      {infiltratorRound.options.map((option) => (
                        <button
                          type="button"
                          className="special-option"
                          data-state={
                            infiltratorAnswer
                              ? infiltratorAnswer === option
                                ? 'success'
                                : 'disabled'
                              : busy
                                ? 'loading'
                                : 'default'
                          }
                          disabled={Boolean(infiltratorAnswer) || busy}
                          key={option}
                          onClick={() => {
                            setBusy(true);
                            socketRef.current?.emit('infiltrator:answer:submit', {
                              pin: room.pin,
                              roundId: infiltratorRound.roundId,
                              answer: option,
                            });
                          }}
                        >
                          <span>{option}</span>
                          {infiltratorAnswer === option && <Check aria-hidden="true" />}
                        </button>
                      ))}
                    </div>
                    {infiltratorAnswer && (
                      <p className="special-success" role="status">
                        سُجلت إجابتك. لا تشرح سؤالك الآن.
                      </p>
                    )}
                  </Card>
                ) : (
                  <Card className="special-waiting">
                    <LoaderCircle className="spin" aria-hidden="true" />
                    جارٍ تسليم دورك السري…
                  </Card>
                ))}

              {room.phase === 'infiltrator-voting' &&
                (isHost ? (
                  <Card className="special-host-monitor">
                    <Vote aria-hidden="true" />
                    <h2>التصويت سري ومفتوح</h2>
                    <p>تظهر الإجابات بلا أسماء. يحاول الدخيل بالتوازي تخمين إجابة الأغلبية.</p>
                    <Button
                      variant="gold"
                      size="lg"
                      loading={busy}
                      onClick={() => {
                        setBusy(true);
                        socketRef.current?.emit('infiltrator:reveal', { pin: room.pin });
                      }}
                    >
                      <Fingerprint aria-hidden="true" />
                      اكشف الدخيل
                    </Button>
                  </Card>
                ) : infiltratorVoting ? (
                  <Card className="special-voting-panel">
                    <span>الإجابات مجهولة الهوية</span>
                    <h2>أي إجابة جاءت من سؤال مختلف؟</h2>
                    <div className="special-vote-list">
                      {infiltratorVoting.answers.map((answer) => (
                        <button
                          type="button"
                          key={answer.playerId}
                          disabled={answer.isOwn || Boolean(infiltratorVote) || busy}
                          data-selected={infiltratorVote === answer.playerId || undefined}
                          onClick={() => {
                            setBusy(true);
                            socketRef.current?.emit('infiltrator:vote', {
                              pin: room.pin,
                              playerId: answer.playerId,
                            });
                          }}
                        >
                          <span>{answer.answer}</span>
                          {answer.isOwn ? <small>إجابتك</small> : <Vote aria-hidden="true" />}
                        </button>
                      ))}
                    </div>
                    {infiltratorVoting.isInfiltrator && (
                      <div className="special-majority-guess">
                        <strong>فرصتك الثانية: أي سؤال ظهر للأغلبية؟</strong>
                        <div className="special-options">
                          {infiltratorVoting.majorityOptions.map((option) => (
                            <button
                              type="button"
                              className="special-option"
                              key={option}
                              disabled={Boolean(infiltratorGuess) || busy}
                              data-state={
                                infiltratorGuess === option
                                  ? 'success'
                                  : infiltratorGuess
                                    ? 'disabled'
                                    : 'default'
                              }
                              onClick={() => {
                                setBusy(true);
                                socketRef.current?.emit('infiltrator:majority:guess', {
                                  pin: room.pin,
                                  question: option,
                                });
                              }}
                            >
                              <span>{option}</span>
                              {infiltratorGuess === option && <Check aria-hidden="true" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ) : (
                  <Card className="special-waiting">
                    <LoaderCircle className="spin" aria-hidden="true" />
                    جارٍ إخفاء هويات الإجابات…
                  </Card>
                ))}

              {room.phase === 'infiltrator-reveal' && infiltratorReveal && (
                <Card className="special-results-panel">
                  <Fingerprint aria-hidden="true" />
                  <span>{infiltratorReveal.infiltratorWon ? 'فاز الدخيل' : 'أمسكتم بالدخيل'}</span>
                  <h2>الدخيل هو {infiltratorReveal.infiltratorName}</h2>
                  <p>
                    {infiltratorReveal.guessedMajority
                      ? `وخمّن سؤال الأغلبية: ${infiltratorReveal.majorityQuestion}`
                      : `لم يخمّن سؤال الأغلبية: ${infiltratorReveal.majorityQuestion}`}
                  </p>
                  <ol>
                    {infiltratorReveal.answers.map((answer) => (
                      <li key={answer.playerId}>
                        <b>
                          {(infiltratorReveal.voteCounts[answer.playerId] ?? 0).toLocaleString(
                            'ar-SA',
                          )}
                        </b>
                        <div>
                          <strong>{answer.answer}</strong>
                          <span>
                            {answer.playerName}
                            {answer.playerId === infiltratorReveal.infiltratorId ? ' — الدخيل' : ''}
                          </span>
                        </div>
                        <em>أصوات</em>
                      </li>
                    ))}
                  </ol>
                  {isHost && (
                    <Button variant="gold" size="lg" onClick={nextRound} loading={busy}>
                      الجولة التالية
                    </Button>
                  )}
                </Card>
              )}
            </main>
            <PlayerRail players={room.players} currentSocketId={currentSocketId} />
          </div>
        )}

        {(room.phase === 'finished' || gameEnd) && (
          <Card className="special-final-panel">
            <Trophy aria-hidden="true" />
            <h2>اكتملت اللعبة</h2>
            <p>انتهت جولات {activeMeta.title}. هذا هو الترتيب النهائي.</p>
            <ol>
              {(gameEnd?.players ?? room.players).map((player, index) => (
                <li key={player.id}>
                  <span>{(index + 1).toLocaleString('ar-SA')}</span>
                  <strong>{player.name}</strong>
                  <b>{player.score.toLocaleString('ar-SA')} نقطة</b>
                </li>
              ))}
            </ol>
            <ButtonLink href={`/games/${activeMode}`} variant="gold">
              <RotateCcw aria-hidden="true" />
              غرفة جديدة
            </ButtonLink>
          </Card>
        )}

        {error && room.phase !== 'reverse-writing' && (
          <p className="special-error special-stage-error" role="alert">
            <X aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
