'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useTransition } from 'react';

export function RoomPoller({
  endpoint,
  participantId,
  intervalMs = 2_000,
}: {
  endpoint: string;
  participantId?: string;
  intervalMs?: number;
}) {
  const router = useRouter();
  const inFlightRequest = useRef<AbortController | null>(null);
  const isInitialTick = useRef(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    isInitialTick.current = true;

    const tick = async () => {
      if (!active || document.visibilityState === 'hidden' || inFlightRequest.current) {
        return;
      }

      const controller = new AbortController();
      inFlightRequest.current = controller;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ participantId }),
        cache: 'no-store',
        signal: controller.signal,
      }).catch(() => null);
      if (inFlightRequest.current === controller) inFlightRequest.current = null;
      const skipRefresh = isInitialTick.current;
      isInitialTick.current = false;
      if (!active || !response?.ok || skipRefresh) return;
      startTransition(() => router.refresh());
    };

    const timer = window.setInterval(tick, intervalMs);
    void tick();
    return () => {
      active = false;
      window.clearInterval(timer);
      inFlightRequest.current?.abort();
      inFlightRequest.current = null;
    };
  }, [endpoint, intervalMs, participantId, router, startTransition]);

  return null;
}
