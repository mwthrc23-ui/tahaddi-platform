import { NextResponse } from 'next/server';
import { hasDatabaseUrl } from '@/lib/auth/prisma';
import { advanceMafiaGame, markMafiaParticipantSeen } from '@/lib/mafia/engine';

export async function POST(request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  const { gameId } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    participantId?: string;
    participantToken?: string;
  };
  if (body.participantId && body.participantToken) {
    await markMafiaParticipantSeen(gameId, body.participantId, body.participantToken);
  }
  await advanceMafiaGame(gameId);
  return NextResponse.json({ ok: true });
}
