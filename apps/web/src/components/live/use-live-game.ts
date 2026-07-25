'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  calculateClockOffset,
  type AnswerRejectionReason,
  type ClientToServerEvents,
  type GameSnapshot,
  type LiveRole,
  type QuestionStatsPayload,
  type ServerToClientEvents,
} from '@tahaddi/contracts';
import { io, type Socket } from 'socket.io-client';

type LiveSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
type LiveTransport = 'socket' | 'http';
type HttpOperation = 'snapshot' | 'start' | 'next' | 'finish' | 'answer';

type HttpRoomResponse = {
  ok: boolean;
  snapshot?: GameSnapshot;
  stats?: QuestionStatsPayload | null;
  reason?: AnswerRejectionReason;
  error?: string;
};

const HTTP_POLL_INTERVAL_MS = 1_000;

const rejectionMessages: Record<AnswerRejectionReason, string> = {
  INVALID_SESSION: 'الجلسة غير متاحة.',
  INVALID_PLAYER: 'تعذّر التحقق من اللاعب. افتح رابط الغرفة من جديد.',
  QUESTION_NOT_ACTIVE: 'السؤال غير مفتوح الآن.',
  QUESTION_MISMATCH: 'انتقلت الجلسة إلى سؤال آخر.',
  INVALID_OPTION: 'هذا الخيار غير صالح.',
  DUPLICATE_ANSWER: 'تم استلام إجابتك مسبقًا.',
  ANSWER_TOO_LATE: 'انتهى وقت الإجابة.',
};

async function requestHttpRoom(input: {
  sessionId: string;
  subjectId: string;
  accessToken: string;
  role: LiveRole;
  operation: HttpOperation;
  questionId?: string;
  optionId?: string;
  signal?: AbortSignal;
}): Promise<HttpRoomResponse> {
  const response = await fetch(`/api/live/${encodeURIComponent(input.sessionId)}/room`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    cache: 'no-store',
    signal: input.signal,
    body: JSON.stringify({
      operation: input.operation,
      subjectId: input.subjectId,
      accessToken: input.accessToken,
      role: input.role,
      questionId: input.questionId,
      optionId: input.optionId,
    }),
  });
  const body = (await response.json().catch(() => null)) as HttpRoomResponse | null;
  return body ?? { ok: false, error: 'INVALID_RESPONSE' };
}

export function useLiveGame(input: {
  sessionId: string;
  subjectId: string;
  accessToken: string;
  role: LiveRole;
}) {
  const { sessionId, subjectId, accessToken, role } = input;
  const socketRef = useRef<LiveSocket | null>(null);
  const transportRef = useRef<LiveTransport | null>(null);
  const bestRtt = useRef(Number.POSITIVE_INFINITY);
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [stats, setStats] = useState<QuestionStatsPayload | null>(null);
  const [clockOffset, setClockOffset] = useState(0);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState('جارٍ الاتصال بالغرفة…');
  const [busy, setBusy] = useState(false);

  const applyHttpState = useCallback(
    (response: HttpRoomResponse, clientSentAt: number, clientReceivedAt: number) => {
      if (!response.ok || !response.snapshot) return false;
      setSnapshot(response.snapshot);
      setStats(response.stats ?? response.snapshot.reveal?.stats ?? null);
      setClockOffset(
        calculateClockOffset({
          clientSentAt,
          clientReceivedAt,
          serverTime: response.snapshot.serverTime,
        }),
      );
      setConnected(true);
      setMessage('');
      return true;
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    let pollingStarted = false;
    let pollTimer: number | null = null;
    let pollController: AbortController | null = null;

    const poll = async () => {
      if (cancelled) return;
      pollController = new AbortController();
      const clientSentAt = Date.now();
      try {
        const response = await requestHttpRoom({
          sessionId,
          subjectId,
          accessToken,
          role,
          operation: 'snapshot',
          signal: pollController.signal,
        });
        if (cancelled) return;
        const applied = applyHttpState(response, clientSentAt, Date.now());
        if (!applied) {
          setConnected(false);
          setMessage(
            response.error === 'UNAUTHORIZED'
              ? 'تعذّر التحقق من صلاحية دخول الغرفة.'
              : 'تعذّر تحديث الغرفة؛ نحاول إعادة الاتصال…',
          );
        }
      } catch (error) {
        if (!cancelled && !(error instanceof DOMException && error.name === 'AbortError')) {
          setConnected(false);
          setMessage('تعذّر تحديث الغرفة؛ نحاول إعادة الاتصال…');
        }
      } finally {
        pollController = null;
        if (!cancelled) {
          pollTimer = window.setTimeout(poll, HTTP_POLL_INTERVAL_MS);
        }
      }
    };

    const startPolling = () => {
      if (pollingStarted || cancelled) return;
      pollingStarted = true;
      transportRef.current = 'http';
      setMessage('جارٍ مزامنة الغرفة…');
      void poll();
    };

    const realtimeUrl = process.env.NEXT_PUBLIC_REALTIME_URL?.trim();
    if (!realtimeUrl) {
      startPolling();
      return () => {
        cancelled = true;
        if (pollTimer !== null) window.clearTimeout(pollTimer);
        pollController?.abort();
        transportRef.current = null;
      };
    }

    const socket: LiveSocket = io(realtimeUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4_000,
    });
    socketRef.current = socket;
    transportRef.current = 'socket';

    const join = () => {
      setConnected(true);
      setMessage('');
      bestRtt.current = Number.POSITIVE_INFINITY;
      socket.emit('game:join', { sessionId, subjectId, accessToken, role });
      socket.emit('clock:ping', { clientSentAt: Date.now() });
    };
    const disconnected = () => {
      setConnected(false);
      setMessage('انقطع الاتصال؛ نحاول استعادة الجلسة…');
    };
    socket.on('connect', join);
    socket.on('disconnect', disconnected);
    socket.on('connect_error', () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      startPolling();
    });
    socket.on('clock:pong', (payload) => {
      const receivedAt = Date.now();
      const rtt = Math.max(0, receivedAt - payload.clientSentAt);
      if (rtt <= bestRtt.current) {
        bestRtt.current = rtt;
        setClockOffset(
          calculateClockOffset({
            clientSentAt: payload.clientSentAt,
            clientReceivedAt: receivedAt,
            serverTime: payload.serverTime,
          }),
        );
      }
    });
    socket.on('game:snapshot', (next) => {
      setSnapshot(next);
      setStats(next.reveal?.stats ?? null);
      setBusy(false);
      setMessage('');
    });
    socket.on('question:started', (question) => {
      setSnapshot((current) =>
        current
          ? {
              ...current,
              phase: 'QUESTION',
              question,
              reveal: null,
              playerAnswer: null,
              playerResult: null,
            }
          : current,
      );
      setStats(null);
      setBusy(false);
      setMessage('');
    });
    socket.on('answer:accepted', ({ questionId, receivedAt }) => {
      setSnapshot((current) =>
        current?.question?.questionId === questionId
          ? {
              ...current,
              playerAnswer: {
                optionId: current.playerAnswer?.optionId ?? '',
                receivedAt,
              },
            }
          : current,
      );
      setBusy(false);
      setMessage('تم استلام إجابتك.');
    });
    socket.on('answer:rejected', ({ reason }) => {
      if (reason !== 'DUPLICATE_ANSWER') {
        setSnapshot((current) => (current ? { ...current, playerAnswer: null } : current));
      }
      setBusy(false);
      setMessage(rejectionMessages[reason]);
    });
    socket.on('question:stats', setStats);
    socket.on('question:revealed', (reveal) => {
      setSnapshot((current) =>
        current
          ? {
              ...current,
              phase: 'REVEAL',
              reveal,
              playerResult: reveal.playerResult ?? null,
            }
          : current,
      );
      setStats(reveal.stats);
      setBusy(false);
    });
    socket.on('leaderboard:shown', ({ leaderboard }) => {
      setSnapshot((current) =>
        current ? { ...current, phase: 'LEADERBOARD', leaderboard } : current,
      );
      setBusy(false);
    });
    socket.on('game:finished', ({ leaderboard }) => {
      setSnapshot((current) =>
        current ? { ...current, phase: 'FINISHED', leaderboard } : current,
      );
      setBusy(false);
    });
    socket.on('game:player_joined', ({ player, participantCount }) => {
      setSnapshot((current) => {
        if (!current) return current;
        const existing = current.leaderboard.filter((item) => item.id !== player.id);
        return {
          ...current,
          participantCount,
          leaderboard: role === 'host' ? [...existing, player].sort((a, b) => a.rank - b.rank) : [],
        };
      });
    });
    socket.on('game:player_left', ({ playerId, participantCount }) => {
      setSnapshot((current) =>
        current
          ? {
              ...current,
              participantCount,
              leaderboard:
                role === 'host' ? current.leaderboard.filter((item) => item.id !== playerId) : [],
            }
          : current,
      );
    });
    socket.on('game:error', ({ message: errorMessage }) => {
      setBusy(false);
      setMessage(errorMessage);
    });

    const clockTimer = window.setInterval(() => {
      if (socket.connected) socket.emit('clock:ping', { clientSentAt: Date.now() });
    }, 10_000);

    return () => {
      cancelled = true;
      window.clearInterval(clockTimer);
      if (pollTimer !== null) window.clearTimeout(pollTimer);
      pollController?.abort();
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      transportRef.current = null;
    };
  }, [accessToken, applyHttpState, role, sessionId, subjectId]);

  const sendHttpCommand = useCallback(
    async (
      operation: Exclude<HttpOperation, 'snapshot'>,
      answer?: { questionId: string; optionId: string },
    ) => {
      const clientSentAt = Date.now();
      try {
        const response = await requestHttpRoom({
          sessionId,
          subjectId,
          accessToken,
          role,
          operation,
          ...answer,
        });
        if (response.reason) {
          if (response.reason !== 'DUPLICATE_ANSWER') {
            setSnapshot((current) => (current ? { ...current, playerAnswer: null } : current));
          }
          setMessage(rejectionMessages[response.reason]);
          return;
        }
        if (!applyHttpState(response, clientSentAt, Date.now())) {
          setMessage('تعذّر تنفيذ الأمر في حالته الحالية.');
        } else if (operation === 'answer') {
          setMessage('تم استلام إجابتك.');
        }
      } catch {
        setConnected(false);
        setMessage('تعذّر الاتصال بالغرفة؛ سنحاول مجددًا.');
      } finally {
        setBusy(false);
      }
    },
    [accessToken, applyHttpState, role, sessionId, subjectId],
  );

  const command = useCallback(
    (event: 'question:start' | 'question:next' | 'game:finish') => {
      if (!connected || busy) return;
      setBusy(true);
      if (transportRef.current === 'http') {
        const operation =
          event === 'question:start' ? 'start' : event === 'question:next' ? 'next' : 'finish';
        void sendHttpCommand(operation);
        return;
      }
      if (!socketRef.current?.connected) {
        setBusy(false);
        return;
      }
      socketRef.current.emit(event, { sessionId });
      window.setTimeout(() => setBusy(false), 3_000);
    },
    [busy, connected, sendHttpCommand, sessionId],
  );

  const submitAnswer = useCallback(
    (questionId: string, optionId: string) => {
      if (!connected || busy || snapshot?.playerAnswer) return;
      setBusy(true);
      setSnapshot((current) =>
        current
          ? {
              ...current,
              playerAnswer: { optionId, receivedAt: 0 },
            }
          : current,
      );
      if (transportRef.current === 'http') {
        void sendHttpCommand('answer', { questionId, optionId });
        return;
      }
      if (!socketRef.current?.connected) {
        setBusy(false);
        return;
      }
      socketRef.current.emit('answer:submit', {
        sessionId,
        questionId,
        optionId,
      });
    },
    [busy, connected, sendHttpCommand, sessionId, snapshot?.playerAnswer],
  );
  const startQuestion = useCallback(() => command('question:start'), [command]);
  const nextQuestion = useCallback(() => command('question:next'), [command]);
  const finishGame = useCallback(() => command('game:finish'), [command]);

  return {
    snapshot,
    stats,
    clockOffset,
    connected,
    message,
    busy,
    startQuestion,
    nextQuestion,
    finishGame,
    submitAnswer,
  };
}
