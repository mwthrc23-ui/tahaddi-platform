'use client';

import { Badge, Card } from '@/components/ui';
import { WinnerPodium } from '@/components/quiz';
import { LiveQuestionStage } from './live-question-stage';
import { useLiveGame } from './use-live-game';

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? '؟') + (parts[1]?.[0] ?? '');
}

export function LivePlayerExperience({
  sessionId,
  participantId,
  accessToken,
  displayName,
}: {
  sessionId: string;
  participantId: string;
  accessToken: string;
  displayName: string;
}) {
  const game = useLiveGame({
    sessionId,
    subjectId: participantId,
    accessToken,
    role: 'player',
  });
  const snapshot = game.snapshot;
  const selectedOptionId = snapshot?.playerAnswer?.optionId || undefined;
  const winners =
    snapshot?.leaderboard.slice(0, 3).map((player) => ({
      name: player.name,
      initials: getInitials(player.name),
      score: player.score,
    })) ?? [];

  return (
    <div className="live-experience live-player-experience">
      <header className="live-player-bar">
        <div>
          <span>اللاعب</span>
          <strong>{displayName}</strong>
        </div>
        <Badge className={game.connected ? 'badge-live' : ''}>
          {game.connected ? 'متصل' : 'يعيد الاتصال'}
        </Badge>
      </header>

      {game.message && (
        <p className="live-status-message" role="status">
          {game.message}
        </p>
      )}

      {!snapshot || snapshot.phase === 'LOBBY' ? (
        <Card className="live-lobby">
          <h1>بانتظار المضيف</h1>
          <p>ستظهر خيارات السؤال هنا فور بدء الجولة.</p>
        </Card>
      ) : snapshot.phase === 'FINISHED' ? (
        <>
          <Card className="live-player-result">
            <h1>النتيجة النهائية</h1>
            <p>انتهت المسابقة، وهذه المراكز الثلاثة الأولى.</p>
            {winners.length > 0 ? <WinnerPodium winners={winners} /> : <p>لا توجد نتائج مسجلة.</p>}
          </Card>
          {snapshot.leaderboard.length > 0 && (
            <Card className="live-leaderboard">
              <h2>ترتيب المتسابقين</h2>
              <ol>
                {snapshot.leaderboard.slice(0, 10).map((player) => (
                  <li key={player.id}>
                    <span>{player.rank.toLocaleString('ar-SA')}</span>
                    <strong>{player.name}</strong>
                    <b>{player.score.toLocaleString('ar-SA')}</b>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </>
      ) : snapshot.phase === 'LEADERBOARD' ? (
        <Card className="live-lobby">
          <h1>يُعرض الترتيب الآن</h1>
          <p>السؤال التالي سيظهر تلقائيًا خلال لحظات.</p>
        </Card>
      ) : snapshot.question ? (
        <>
          <LiveQuestionStage
            question={snapshot.question}
            phase={snapshot.phase}
            reveal={snapshot.reveal}
            stats={snapshot.phase === 'REVEAL' ? game.stats : null}
            clockOffset={game.clockOffset}
            selectedOptionId={selectedOptionId}
            onSelect={(optionId) => game.submitAnswer(snapshot.question!.questionId, optionId)}
            disabled={game.busy || Boolean(snapshot.playerAnswer)}
          />
          {snapshot.playerAnswer && snapshot.phase === 'QUESTION' && (
            <p className="live-answer-confirmed" role="status">
              تم استلام إجابتك
            </p>
          )}
          {snapshot.phase === 'REVEAL' && (
            <Card className="live-player-result" role="status">
              {snapshot.playerResult ? (
                <>
                  <h2>{snapshot.playerResult.correct ? 'إجابة صحيحة' : 'إجابة غير صحيحة'}</h2>
                  <p>نقاط السؤال: +{snapshot.playerResult.earnedPoints.toLocaleString('ar-SA')}</p>
                  <p>مجموعك: {snapshot.playerResult.totalScore.toLocaleString('ar-SA')}</p>
                  <p>ترتيبك: {snapshot.playerResult.rank.toLocaleString('ar-SA')}</p>
                </>
              ) : (
                <>
                  <h2>انتهى وقت السؤال</h2>
                  <p>لم تُسجل إجابة لهذه الجولة.</p>
                </>
              )}
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
