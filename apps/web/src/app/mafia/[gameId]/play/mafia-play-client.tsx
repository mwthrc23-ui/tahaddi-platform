'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import {
  MafiaPhaseHeader,
  MafiaPlayerPicker,
  MafiaPrimaryTask,
  MafiaRoleReveal,
  MafiaSecretPanel,
  MafiaVotePanel,
} from '@/components/mafia';
import { submitMafiaAction, submitMafiaVote } from '@/app/mafia/actions';
import { RoomPoller } from '@/components/live';
import { Badge, Card } from '@/components/ui';
import { type MafiaPhaseName } from '@/lib/mafia/guidance';
import { type MafiaRoleName } from '@/lib/mafia/rules';
import { cn } from '@/lib/utils';

interface GameData {
  id: string;
  currentRound: number;
  phaseEndsAt: string | null;
  autoMode: boolean;
  chatEnabled: boolean;
  messages: Array<{
    id: string;
    channel: string;
    body: string;
    createdAt: Date;
    participant?: { displayName: string } | null;
  }>;
  participants: Array<{
    id: string;
    displayName: string;
    status: string;
    role?: string | null;
    privateNote?: string | null;
  }>;
}

interface PlayerData {
  id: string;
  displayName: string;
  role: string | null;
  status: string;
  privateNote: string | null;
}

interface NightTarget {
  id: string;
  displayName: string;
}

function MafiaPlayClient({
  game,
  player,
  phase,
  role,
  phaseDuration,
  nightTargets = [],
  voteTargets = [],
}: {
  game: GameData;
  player: PlayerData;
  phase: MafiaPhaseName;
  role: MafiaRoleName | null;
  phaseDuration: number | null;
  nightTargets: NightTarget[];
  voteTargets: NightTarget[];
}) {
  const searchParams = useSearchParams();
  const shouldReveal = searchParams.get('reveal') === '1';
  const [roleRevealed, setRoleRevealed] = useState(!shouldReveal);
  const [nightSubmitted, setNightSubmitted] = useState(false);
  const [voteSubmitted, setVoteSubmitted] = useState(false);

  const nightActionRole = role && ['KILLER', 'DETECTIVE', 'DOCTOR', 'GUARD'].includes(role);
  const actionType =
    role === 'KILLER' ? 'KILL' : role === 'DETECTIVE' ? 'INVESTIGATE' : role === 'DOCTOR' ? 'HEAL' : 'PROTECT';

  const handleNightSubmit = (targetId: string) => {
    const data = new FormData();
    data.append('gameId', game.id);
    data.append('participantId', player.id);
    data.append('targetId', targetId);
    data.append('type', actionType);
    submitMafiaAction(data);
    setNightSubmitted(true);
  };

  const handleVoteSubmit = (targetId: string) => {
    const data = new FormData();
    data.append('gameId', game.id);
    data.append('participantId', player.id);
    data.append('targetId', targetId);
    submitMafiaVote(data);
    setVoteSubmitted(true);
  };

  const channelLabel =
    player.status === 'ELIMINATED'
      ? 'قناة المستبعدين'
      : phase === 'NIGHT' && role === 'KILLER'
        ? 'قناة القتلة السرية'
        : 'النقاش العام';

  if (!roleRevealed && role) {
    return (
      <div className="mafia-game-shell">
        <MafiaRoleReveal role={role} onRevealed={() => setRoleRevealed(true)} />
      </div>
    );
  }

  return (
    <div className="mafia-game-shell">
      <MafiaPhaseHeader
        phase={phase}
        currentRound={game.currentRound}
        phaseEndsAt={game.phaseEndsAt}
        durationSeconds={phaseDuration}
        autoMode={game.autoMode}
        tickEndpoint={`/api/mafia/${game.id}/tick`}
        participantId={player.id}
      />

      {player.status === 'ELIMINATED' && (
        <div className="mafia-eliminated-banner">
          <h2>خرجت من الجولة</h2>
          <p>اللعبة مستمرة. يمكنك متابعة الأحداث من قناة المستبعدين.</p>
        </div>
      )}

      <MafiaPrimaryTask phase={phase} role={role} playerStatus={player.status}>
        {phase === 'NIGHT' && nightActionRole && !nightSubmitted && (
          <MafiaPlayerPicker
            players={nightTargets}
            selectedId={null}
            onSelect={handleNightSubmit}
            placeholder={
              role === 'KILLER'
                ? 'اختر الضحية'
                : role === 'DETECTIVE'
                  ? 'تحقق من'
                  : 'احمِ'
            }
          />
        )}
        {phase === 'NIGHT' && nightActionRole && nightSubmitted && (
          <p className="mafia-text-muted" role="status">تم تسجيل قرار الليل</p>
        )}
        {phase === 'NIGHT' && !nightActionRole && (
          <p className="mafia-text-muted">أغمض عينيك وانتظر انتهاء قرارات الليل.</p>
        )}
        {phase === 'VOTING' && player.status === 'ALIVE' && (
          <MafiaVotePanel
            players={voteTargets}
            onSubmit={handleVoteSubmit}
            disabled={voteSubmitted}
          />
        )}
        {phase === 'DAY' && player.status === 'ALIVE' && (
          <p className="mafia-text-muted">ناقش الأدلة في القناة العامة قبل فتح التصويت.</p>
        )}
      </MafiaPrimaryTask>

      <MafiaSecretPanel role={role} privateNote={player.privateNote} />

      <Card className="mafia-chat-card">
        <div className="mafia-card-header">
          <h2>
            <MessageCircle aria-hidden="true" />
            {channelLabel}
          </h2>
          <Badge>{game.chatEnabled ? 'مفتوحة' : 'للقراءة فقط'}</Badge>
        </div>
        <div className="mafia-card-body">
          <div className="mafia-messages" role="log" aria-label="الرسائل">
            {game.messages?.map((message) => {
              const isSystem = message.channel === 'SYSTEM';
              const isKillers = message.channel === 'KILLERS';
              const isGhosts = message.channel === 'GHOSTS';
              return (
                <div
                  key={message.id}
                  className={cn(
                    'mafia-chat-message',
                    isSystem && 'mafia-chat-message-system',
                    isKillers && 'mafia-chat-message-killers',
                    isGhosts && 'mafia-chat-message-ghosts',
                  )}
                >
                  <div className="mafia-chat-message-head">
                    <span className="mafia-chat-message-author">
                      {message.participant?.displayName ?? 'النظام'}
                    </span>
                    <span className="mafia-chat-message-time">
                      {new Date(message.createdAt).toLocaleTimeString('ar-SA', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {!isSystem && message.channel !== 'PUBLIC' && (
                      <span className="mafia-chat-message-channel">
                        {isKillers ? '🔒 قناة القتلة' : 'قناة المستبعدين'}
                      </span>
                    )}
                  </div>
                  <p className="mafia-chat-message-body">{message.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <RoomPoller endpoint={`/api/mafia/${game.id}/tick`} participantId={player.id} />
    </div>
  );
}

export { MafiaPlayClient };