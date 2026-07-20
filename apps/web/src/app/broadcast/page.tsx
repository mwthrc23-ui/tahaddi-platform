import { BroadcastLayout } from '@/components/layout';
import { AnswerOption, QuestionCard, QuizTimer } from '@/components/quiz';
import { question } from '@/mocks';
export default function Page() { return <BroadcastLayout><div className="broadcast-top"><strong>كأس المعرفة العربية</strong><QuizTimer total={20} remaining={12} size="lg" /></div><QuestionCard {...question}><div className="answers-list">{question.answers.map((answer) => <AnswerOption key={answer.id} {...answer} />)}</div></QuestionCard></BroadcastLayout>; }
