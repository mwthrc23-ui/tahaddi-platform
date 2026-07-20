import { Maximize2, Users } from 'lucide-react';
import { HostLayout } from '@/components/layout';
import { HostControls, PlayerJoinCard, QuestionCard, QuizTimer } from '@/components/quiz';
import { Button, Card } from '@/components/ui';
import { players, question } from '@/mocks';
export default function Page() { return <HostLayout players={players.length}><div className="host-stage"><section><div className="inline-between"><QuizTimer total={20} remaining={12} mode="horizontal" /><Button variant="ghost" size="icon" aria-label="ملء الشاشة"><Maximize2 /></Button></div><QuestionCard {...question} /><HostControls /></section><aside><Card><h2><Users />اللاعبون</h2>{players.map((p) => <PlayerJoinCard key={p.id} {...p} hostTools />)}</Card></aside></div></HostLayout>; }
