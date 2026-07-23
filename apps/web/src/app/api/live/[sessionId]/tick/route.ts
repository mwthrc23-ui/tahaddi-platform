import { NextResponse } from 'next/server';
import { advanceLiveSessionIfDue, markLiveParticipantSeen } from '@/lib/live/engine';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const body = (await request.json().catch(() => ({}))) as { participantId?: unknown };
  const participantId = typeof body.participantId === 'string' ? body.participantId : '';

  await Promise.all([
    markLiveParticipantSeen(sessionId, participantId),
    advanceLiveSessionIfDue(sessionId),
  ]);
  return NextResponse.json({ ok: true });
}
