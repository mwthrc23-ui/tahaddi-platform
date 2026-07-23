'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { joinLiveSessionByCode } from '@/app/live/actions';
import { Button, Input } from '@/components/ui';

const ROOM_CODE_RE = /^[34679ACDEFGHJKMNPQRTUVWXY]{6,8}$/;

function normalizeRoomCode(value: string) {
  return value.trim().replace(/\s+/g, '').toUpperCase();
}

export function JoinQuizForm({
  initialCode = '',
  inviteMode = false,
}: {
  initialCode?: string;
  inviteMode?: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState(() => normalizeRoomCode(initialCode));
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [joining, startJoining] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const roomCode = normalizeRoomCode(code);
    if (!ROOM_CODE_RE.test(roomCode)) {
      setError('الرمز يجب أن يتكوّن من ٦ إلى ٨ أحرف أو أرقام صالحة.');
      return;
    }

    setError('');
    startJoining(async () => {
      const result = await joinLiveSessionByCode(roomCode, playerName);
      if (result.status === 'error') {
        setError(result.message);
        return;
      }

      const query = new URLSearchParams({
        participantId: result.participantId,
        code: result.roomCode,
      });
      router.push(`/live/${result.sessionId}/play?${query.toString()}`);
    });
  }

  return (
    <form className="join-box" id="join" onSubmit={handleSubmit} noValidate>
      {inviteMode && (
        <p className="join-notice" role="note">
          دخول لاعب زائر. لا تحتاج إلى حساب؛ اكتب اسمك فقط ثم ادخل الغرفة.
        </p>
      )}
      <Input
        id="player-name"
        label="اسم اللاعب"
        className="join-field"
        placeholder="الاسم الذي سيظهر في الغرفة"
        value={playerName}
        onChange={(event) => {
          setPlayerName(event.target.value);
          if (error) setError('');
        }}
        autoComplete="nickname"
        maxLength={40}
      />
      <Input
        id="room-code"
        label="رمز الغرفة"
        className="join-field"
        placeholder="الرمز المرسل من المضيف"
        value={code}
        onChange={(event) => {
          setCode(event.target.value.toUpperCase());
          if (error) setError('');
        }}
        inputMode="text"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={9}
        error={error || undefined}
      />
      <Button size="lg" type="submit" loading={joining} disabled={joining}>
        انضم الآن
        <ArrowLeft />
      </Button>
    </form>
  );
}
