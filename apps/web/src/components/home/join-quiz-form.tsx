'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { joinQuizByCode } from '@/app/quizzes/actions';
import { Button, Input } from '@/components/ui';

const ROOM_CODE_RE = /^[34679ACDEFGHJKMNPQRTUVWXY]{6,8}$/;

function normalizeRoomCode(value: string) {
  return value.trim().replace(/\s+/g, '').toUpperCase();
}

export function JoinQuizForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
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
      const result = await joinQuizByCode(roomCode);
      if (result.status === 'error') {
        setError(result.message);
        return;
      }

      const query = new URLSearchParams({ quizId: result.quizId, code: result.roomCode });
      router.push(`/demo/waiting?${query.toString()}`);
    });
  }

  return (
    <form className="join-box" id="join" onSubmit={handleSubmit} noValidate>
      <Input
        id="room-code"
        label="رمز الغرفة"
        className="join-field"
        placeholder="مثال: A7K9PQ"
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
