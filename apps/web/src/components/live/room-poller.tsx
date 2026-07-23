'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function RoomPoller({
  endpoint,
  participantId,
  participantToken,
  intervalMs = 2_000,
}: {
  endpoint: string;
  participantId?: string;
  participantToken?: string;
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const tick = async () => {
      if (!active || document.visibilityState === 'hidden') return;
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ participantId, participantToken }),
      }).catch(() => null);
      if (active) router.refresh();
    };

    const timer = window.setInterval(tick, intervalMs);
    void tick();
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [endpoint, intervalMs, participantId, participantToken, router]);

  return null;
}
