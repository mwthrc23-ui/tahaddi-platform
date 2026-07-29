'use client';

import { useEffect, useState } from 'react';
import { Crown, Medal, Trophy, Users, Check } from 'lucide-react';
import { WinnerPodium } from '@/components/quiz';
import { Button } from '@/components/ui';

type LeaderboardPlayer = {
  id: string;
  name: string;
  score: number;
  rank: number;
  streak?: number;
  correctAnswers?: number;
};

const DEMO_PLAYERS: LeaderboardPlayer[] = [
  { id: '1', name: 'أحمد المنصوري', score: 2450, rank: 1, streak: 5, correctAnswers: 18 },
  { id: '2', name: 'سارة العتيبي', score: 2180, rank: 2, streak: 3, correctAnswers: 16 },
  { id: '3', name: 'محمد الراشد', score: 1950, rank: 3, streak: 2, correctAnswers: 14 },
  { id: '4', name: 'نورة القحطاني', score: 1820, rank: 4, correctAnswers: 13 },
  { id: '5', name: 'خالد السعيد', score: 1640, rank: 5, correctAnswers: 12 },
  { id: '6', name: 'ريم الشهري', score: 1580, rank: 6, correctAnswers: 11 },
  { id: '7', name: 'عبدالله الفهد', score: 1420, rank: 7, correctAnswers: 10 },
  { id: '8', name: 'ليان المطيري', score: 1350, rank: 8, correctAnswers: 9 },
  { id: '9', name: 'يوسف الدوسري', score: 1210, rank: 9, correctAnswers: 8 },
  { id: '10', name: 'جنى البقمي', score: 1100, rank: 10, correctAnswers: 7 },
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? '؟') + (parts[1]?.[0] ?? '');
}

export default function LeaderboardPage() {
  const players = DEMO_PLAYERS;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 400);
    return () => window.clearTimeout(timer);
  }, []);

  const winners = players.slice(0, 3).map((player) => ({
    name: player.name,
    initials: getInitials(player.name),
    score: player.score,
    correctAnswers: player.correctAnswers,
  }));

  const topStats = [
    { label: 'المتسابقون', value: players.length.toLocaleString('ar-SA'), icon: Users },
    { label: 'أعلى نقاط', value: players[0]?.score.toLocaleString('ar-SA') ?? '-', icon: Trophy },
    { label: 'أفضل سلسلة', value: Math.max(...players.map((p) => p.streak ?? 0)).toLocaleString('ar-SA'), icon: Medal },
  ];

  return (
    <section className="leaderboard-page" aria-labelledby="leaderboard-title">
      <div className="container leaderboard-shell">
        <header className="leaderboard-header">
          <div>
            <span className="eyebrow">ترتيب المتسابقين</span>
            <h1 id="leaderboard-title">لوحة الشرف</h1>
            <p>ترتيب اللاعبين بناءً على مجموع النقاط في الجولات المباشرة.</p>
          </div>
          <div className="leaderboard-stats">
            {topStats.map((stat) => (
              <div className="leaderboard-stat" key={stat.label}>
                <stat.icon aria-hidden="true" />
                <div>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              </div>
            ))}
          </div>
        </header>

        <div className="leaderboard-podium">
          <WinnerPodium winners={winners} />
        </div>

        <div className="leaderboard-table-wrap">
          <h2 className="leaderboard-table-title">
            <Crown aria-hidden="true" />
            ترتيب المتسابقين
          </h2>
          {isLoading ? (
            <div className="leaderboard-skeleton" aria-label="جارٍ تحميل الترتيب">
              {Array.from({ length: 5 }).map((_, index) => (
                <div className="leaderboard-skeleton-row" key={`sk-${index}`}>
                  <span />
                  <span />
                  <span />
                </div>
              ))}
            </div>
          ) : (
            <ol className="leaderboard-table">
              {players.map((player) => (
                <li
                  key={player.id}
                  className={player.rank <= 3 ? 'is-podium' : ''}
                  aria-label={`المركز ${player.rank.toLocaleString('ar-SA')}: ${player.name}`}
                >
                  <span className="leaderboard-rank">
                    <strong>{player.rank.toLocaleString('ar-SA')}</strong>
                  </span>
                  <span className="leaderboard-name">{player.name}</span>
                  <span className="leaderboard-streak">
                    {player.streak ? `${player.streak} فوز متتالي` : '—'}
                  </span>
                  <span className="leaderboard-correct" dir="ltr">
                    <Check aria-hidden="true" />
                    {player.correctAnswers?.toLocaleString('ar-SA') ?? '0'}
                  </span>
                  <span className="leaderboard-score">
                    {player.score.toLocaleString('ar-SA')} نقطة
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <footer className="leaderboard-footer">
          <Button type="button" variant="secondary">
            تحديث الترتيب
          </Button>
        </footer>
      </div>
    </section>
  );
}
