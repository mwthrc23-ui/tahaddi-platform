'use client';

import { ArrowLeft, BarChart3, LogOut, Share2, Trophy, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SiteLayout } from '@/components/layout';
import { AnswerOption, LeaderboardItem, PlayerJoinCard, QuestionCard, QuestionProgress, QuizTimer, RoomCode, ScoreDisplay, WinnerPodium } from '@/components/quiz';
import { Alert, Badge, Button, Card, Progress } from '@/components/ui';

const demoPlayers = [
  { id: '1', name: 'سارة العتيبي', initials: 'س ع', score: 9840, rank: 1, change: 2, streak: 8, online: true, ready: true, joinedAt: 'منذ دقيقة' },
  { id: '2', name: 'محمد القحطاني', initials: 'م ق', score: 9320, rank: 2, change: -1, streak: 6, online: true, ready: true, joinedAt: 'منذ دقيقتين' },
  { id: '3', name: 'نورة الحربي', initials: 'ن ح', score: 8970, rank: 3, change: 1, streak: 5, online: true, ready: false, joinedAt: 'الآن' },
  { id: '4', name: 'خالد الدوسري', initials: 'خ د', score: 8210, rank: 4, change: 0, streak: 4, online: false, ready: true, joinedAt: 'منذ ٣ دقائق' },
  { id: '5', name: 'ريم المطيري', initials: 'ر م', score: 7880, rank: 5, change: 3, streak: 3, online: true, ready: true, joinedAt: 'منذ ٤ دقائق' },
];

const QUESTION_TIME = 20;
const CORRECT_ANSWER_ID = 'b';

const demoQuestion = {
  number: 4, total: 10, text: 'ما هي أكبر دولة عربية من حيث المساحة؟', type: 'اختيار من متعدد',
  difficulty: 'متوسط', points: 1000, time: QUESTION_TIME, category: 'جغرافيا', status: 'مفتوح',
  answers: [
    { id: 'a', label: 'A' as const, text: 'المملكة العربية السعودية', percentage: 18 },
    { id: 'b', label: 'B' as const, text: 'الجزائر', percentage: 64 },
    { id: 'c', label: 'C' as const, text: 'السودان', percentage: 11 },
    { id: 'd', label: 'D' as const, text: 'مصر', percentage: 7 },
  ],
};

function calcEarned(basePoints: number, timeLimit: number, remaining: number): number {
  const speedBonus = Math.round((remaining / timeLimit) * basePoints * 0.5);
  return basePoints + speedBonus;
}

export function WaitingScreen() { return <SiteLayout><div className="demo-page"><div className="container"><div className="demo-heading"><div><Badge>غرفة مفتوحة</Badge><h1>كأس المعرفة العربية</h1><p>شارك الرمز مع اللاعبين، وستبدأ الجولة عندما يكون الجميع مستعدًا.</p></div><Button variant="destructive"><LogOut />مغادرة</Button></div><div className="waiting-grid"><RoomCode code="582914" /><Card className="players-panel"><div className="inline-between"><h2><Users />اللاعبون</h2><Badge>{demoPlayers.length} / 50</Badge></div><div className="players-grid">{demoPlayers.map((player) => <PlayerJoinCard key={player.id} {...player} />)}</div></Card></div><Alert variant="info">ننتظر المضيف لبدء المسابقة… أبقِ هذه الصفحة مفتوحة.</Alert><DemoSteps current="waiting" /></div></div></SiteLayout>; }

export function QuestionScreen() {
  const [selected, setSelected] = useState<string>();
  const [phase, setPhase] = useState<'answering' | 'revealed'>('answering');
  const [remaining, setRemaining] = useState(QUESTION_TIME);
  const [score, setScore] = useState(3240);
  const [earned, setEarned] = useState(0);
  const [streak, setStreak] = useState(3);

  useEffect(() => {
    if (phase !== 'answering') return;
    if (remaining <= 0) { reveal(undefined); return; }
    const id = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearTimeout(id);
  }, [remaining, phase]);

  function reveal(answerId: string | undefined) {
    const isCorrect = answerId === CORRECT_ANSWER_ID;
    const earnedPoints = isCorrect ? calcEarned(demoQuestion.points, QUESTION_TIME, remaining) : 0;
    setEarned(earnedPoints);
    setScore((s) => s + earnedPoints);
    setStreak(isCorrect ? (s) => s + 1 : 0);
    setPhase('revealed');
  }

  function handleConfirm() { if (selected) reveal(selected); }

  function answerState(id: string) {
    if (phase === 'answering') return selected === id ? 'selected' : 'default';
    if (id === CORRECT_ANSWER_ID) return 'correct';
    if (id === selected && selected !== CORRECT_ANSWER_ID) return 'wrong';
    return 'disabled';
  }

  return <SiteLayout><div className="demo-page question-screen"><div className="container"><div className="question-top"><div><Badge>كأس المعرفة العربية</Badge><QuestionProgress current={demoQuestion.number} total={demoQuestion.total} /></div><QuizTimer total={QUESTION_TIME} remaining={remaining} size="lg" /></div><QuestionCard {...demoQuestion}><div className="answers-list">{demoQuestion.answers.map((answer) => <AnswerOption key={answer.id} {...answer} state={answerState(answer.id)} percentage={phase === 'revealed' ? answer.percentage : undefined} onSelect={phase === 'answering' ? () => setSelected(answer.id) : undefined} />)}</div></QuestionCard><div className="inline-between"><ScoreDisplay score={score} earned={earned} streak={streak} multiplier={1.5} />{phase === 'answering' ? <Button disabled={!selected} size="lg" onClick={handleConfirm}>تأكيد الإجابة<ArrowLeft /></Button> : <Link className="button button-primary button-lg" href="/demo/results">عرض النتائج<ArrowLeft /></Link>}</div><DemoSteps current="question" /></div></div></SiteLayout>;
}

export function ResultsScreen() { return <SiteLayout><div className="demo-page results-screen"><div className="container narrow"><div className="result-hero"><span>إجابة صحيحة!</span><h1>الجزائر</h1><p>هي أكبر دولة عربية وإفريقية من حيث المساحة.</p></div><Card><h2><BarChart3 />توزيع الإجابات</h2><div className="result-bars">{demoQuestion.answers.map((answer) => <div key={answer.id}><div className="inline-between"><span>{answer.label} · {answer.text}</span><strong dir="ltr">{answer.percentage}%</strong></div><Progress value={answer.percentage} /><small>{answer.percentage === 64 ? 'الإجابة الصحيحة' : ''}</small></div>)}</div></Card><div className="result-stats"><ScoreDisplay score={4240} earned={1000} streak={4} multiplier={1.5} /><Card className="rank-card"><small>ترتيبك الحالي</small><strong># ٤</strong><span>تقدّمت مركزين</span></Card></div><Card><div className="inline-between"><h2>أفضل خمسة لاعبين</h2><Trophy /></div>{demoPlayers.map((player) => <LeaderboardItem key={player.id} {...player} />)}</Card><Link className="button button-primary button-lg button-full" href="/demo/winners">متابعة إلى الفائزين<ArrowLeft /></Link><DemoSteps current="results" /></div></div></SiteLayout>; }

export function WinnersScreen() { return <SiteLayout><div className="demo-page winners-screen"><div className="container"><div className="centered-heading"><Badge>انتهت المسابقة</Badge><h1>أبطال كأس المعرفة العربية</h1><p>مبارك للفائزين، وشكرًا لكل من شارك في التحدّي.</p></div><WinnerPodium winners={demoPlayers.slice(0, 3)} /><Card className="full-ranking"><h2>الترتيب الكامل</h2>{demoPlayers.map((player) => <LeaderboardItem key={player.id} {...player} />)}</Card><div className="center-actions"><Button variant="gold"><Share2 />مشاركة النتيجة</Button><Link className="button button-outline button-md" href="/">العودة للرئيسية</Link></div><DemoSteps current="winners" /></div></div></SiteLayout>; }

function DemoSteps({ current }: { current: 'waiting' | 'question' | 'results' | 'winners' }) { const pages = [{ id: 'waiting', label: 'الانتظار' }, { id: 'question', label: 'السؤال' }, { id: 'results', label: 'النتائج' }, { id: 'winners', label: 'الفائزون' }]; return <nav className="demo-steps" aria-label="الشاشات التجريبية">{pages.map((page) => <Link key={page.id} className={page.id === current ? 'active' : ''} href={`/demo/${page.id}`}>{page.label}</Link>)}</nav>; }
