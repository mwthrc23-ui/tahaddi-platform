import { CheckCircle2, Eye, ListChecks } from 'lucide-react';
import { QuestionImage } from '@/components/questions/question-image';
import { Badge, Card } from '@/components/ui';

type HostQuestion = {
  questionId: string;
  question: {
    id: string;
    prompt: string;
    imageUrl: string | null;
    category: string | null;
    timeLimit: number;
    basePoints: number;
    options: {
      id: string;
      text: string;
      isCorrect: boolean;
    }[];
  };
};

export function HostQuestionViewer({
  questions,
  currentPosition,
  answeredCount,
  activeCount,
}: {
  questions: HostQuestion[];
  currentPosition: number;
  answeredCount: number;
  activeCount: number;
}) {
  const currentQuestion = questions[currentPosition]?.question;
  if (!currentQuestion) return null;

  return (
    <Card className="host-question-panel">
      <div className="inline-between host-question-heading">
        <div>
          <span className="eyebrow">
            <Eye aria-hidden="true" />
            السؤال المعروض الآن
          </span>
          <h2>{currentQuestion.prompt}</h2>
        </div>
        <Badge className="badge-live">
          {answeredCount.toLocaleString('ar-SA')} من {activeCount.toLocaleString('ar-SA')} أجابوا
        </Badge>
      </div>

      <div className="question-meta">
        <Badge>{currentQuestion.category ?? 'عام'}</Badge>
        <span>{currentQuestion.timeLimit.toLocaleString('ar-SA')} ثانية</span>
        <span>{currentQuestion.basePoints.toLocaleString('ar-SA')} نقطة</span>
      </div>
      {currentQuestion.imageUrl && (
        <QuestionImage src={currentQuestion.imageUrl} className="question-media" eager />
      )}
      <div className="host-current-options">
        {currentQuestion.options.map((option, index) => (
          <div className={option.isCorrect ? 'is-correct' : undefined} key={option.id}>
            <span>{String.fromCharCode(65 + index)}</span>
            <p>{option.text}</p>
            {option.isCorrect && (
              <strong>
                <CheckCircle2 aria-hidden="true" />
                الإجابة الصحيحة
              </strong>
            )}
          </div>
        ))}
      </div>

      <div className="host-question-list-heading">
        <ListChecks aria-hidden="true" />
        <div>
          <h3>جميع أسئلة الغرفة</h3>
          <p className="muted">هذه القائمة خاصة بالمضيف ولا تظهر للاعبين.</p>
        </div>
      </div>
      <div className="host-question-list">
        {questions.map((quizQuestion, index) => (
          <details
            className="host-question-item"
            key={quizQuestion.questionId}
            open={index === currentPosition}
          >
            <summary>
              <span>{(index + 1).toLocaleString('ar-SA')}</span>
              <strong>{quizQuestion.question.prompt}</strong>
              {index === currentPosition && <Badge>الحالي</Badge>}
            </summary>
            <ul>
              {quizQuestion.question.options.map((option) => (
                <li className={option.isCorrect ? 'is-correct' : undefined} key={option.id}>
                  {option.text}
                  {option.isCorrect && <CheckCircle2 aria-label="الإجابة الصحيحة" />}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </Card>
  );
}
