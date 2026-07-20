'use client';

import { ArrowLeft, Crown, Gamepad2, Radio, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { SiteLayout } from '@/components/layout';
import { LeaderboardItem, LiveStatus } from '@/components/quiz';
import { Button, CategoryCard, CompetitionCard, GameCard, Input } from '@/components/ui';
import { categories, competitions, games, players } from '@/mocks';

export default function HomePage() {
  const [code, setCode] = useState('');
  return <SiteLayout><section className="hero"><div className="hero-glow" /><div className="container hero-grid"><div className="hero-copy"><span className="eyebrow"><Sparkles />منصة المسابقات العربية</span><h1>كل سؤال <em>يشعل الحماس.</em><br />وكل إجابة تقرّبك من القمة.</h1><p>انضم إلى جولات مباشرة، نافس أصدقاءك، واصنع لحظات لا تُنسى في تجربة عربية سريعة وواضحة.</p><form className="join-box" onSubmit={(event) => event.preventDefault()}><Input label="رمز الغرفة" className="join-field" placeholder="مثال: 582 914" value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" /><Button size="lg">انضم الآن<ArrowLeft /></Button></form><div className="hero-actions"><Button variant="gold"><Trophy />أنشئ مسابقة</Button><Link className="text-link" href="/demo/question"><Zap />جرّب سؤالًا سريعًا</Link></div></div><div className="hero-stage"><div className="stage-ring ring-one" /><div className="stage-ring ring-two" /><div className="hero-trophy"><Crown /><strong>تحدّي</strong><span>نافس · أجب · تصدّر</span></div><div className="floating-score score-a"><span>+١٠٠٠</span><small>إجابة صحيحة</small></div><div className="floating-score score-b"><Users /><strong>٢٤٨</strong><small>يتنافسون الآن</small></div><div className="floating-score score-c"><Radio /><strong>مباشر</strong></div></div></div></section>
  <section className="section" id="competitions"><div className="container"><div className="section-heading"><div><span className="eyebrow">الآن على تحدّي</span><h2>مسابقات مباشرة</h2></div><Button variant="ghost">عرض الكل<ArrowLeft /></Button></div><div className="card-grid three">{competitions.map((item) => <CompetitionCard key={item.id} title={item.title} description={`${item.category} · ${item.questions} سؤالًا`} meta={`${item.players} لاعبًا`} />)}</div></div></section>
  <section className="section tinted" id="games"><div className="container"><div className="section-heading"><div><span className="eyebrow">اختر وابدأ فورًا</span><h2>ألعاب سريعة</h2></div></div><div className="card-grid three">{games.map((item) => <GameCard key={item.title} title={item.title} description={item.description} icon={<span>{item.icon}</span>} meta="العب الآن" />)}</div></div></section>
  <section className="section"><div className="container"><div className="section-heading"><div><span className="eyebrow">مئات الأسئلة</span><h2>استكشف الفئات</h2></div></div><div className="card-grid four">{categories.map((item) => <CategoryCard key={item.title} title={item.title} description={`${item.count} سؤالًا`} icon={item.emoji} />)}</div></div></section>
  <section className="section leaderboard-section"><div className="container split-section"><div><span className="eyebrow">لوحة الشرف</span><h2>نجوم هذا الأسبوع</h2><p>السرعة والمعرفة وسلسلة الإجابات الصحيحة تصنع الفارق.</p><LiveStatus status="live" /></div><div className="leaderboard-list">{players.slice(0, 5).map((player) => <LeaderboardItem key={player.id} {...player} />)}</div></div></section>
  <section className="section"><div className="container cta"><div><Gamepad2 /><span>مستعد لصناعة التحدّي؟</span><h2>حوّل فكرتك إلى مسابقة يعيشها الجميع.</h2></div><Button variant="gold" size="lg">أنشئ مسابقتك<ArrowLeft /></Button></div></section></SiteLayout>;
}
