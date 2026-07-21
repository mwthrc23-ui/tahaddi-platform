'use client';

import { useActionState, useState } from 'react';
import { updateQuestion } from '@/app/questions/[id]/actions';
import { Button, Input, NumberInput, Select, Textarea } from '@/components/ui';

const labels = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
const initialUpdateQuestionActionState = { status: 'idle' as const, message: '' };
type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE';

type EditableQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: string | null;
  explanation: string | null;
  source: string | null;
  timeLimit: number;
  basePoints: number;
  options: Array<{ text: string; isCorrect: boolean }>;
};

export function QuestionEditForm({ question }: { question: EditableQuestion }) {
  const [state, formAction, pending] = useActionState(
    updateQuestion.bind(null, question.id),
    initialUpdateQuestionActionState,
  );
  const [type, setType] = useState<QuestionType>(question.type);
  const [optionCount, setOptionCount] = useState(
    Math.min(6, Math.max(2, question.type === 'TRUE_FALSE' ? 2 : question.options.length)),
  );
  const options =
    type === 'TRUE_FALSE'
      ? ['صح', 'خطأ']
      : Array.from({ length: optionCount }, (_, index) => question.options[index]?.text || '');
  const correctOption = Math.max(
    0,
    question.options.findIndex((option) => option.isCorrect),
  );

  return (
    <form action={formAction} className="form-grid question-editor">
      <Select
        label="نوع السؤال"
        name="type"
        value={type}
        onChange={(event) => setType(event.target.value as QuestionType)}
      >
        <option value="MULTIPLE_CHOICE">اختيار من متعدد</option>
        <option value="TRUE_FALSE">صح أو خطأ</option>
      </Select>
      <Textarea
        label="نص السؤال"
        name="prompt"
        required
        minLength={8}
        defaultValue={question.prompt}
      />
      <fieldset className="field question-options">
        <legend className="field-label">الخيارات والإجابة الصحيحة</legend>
        {options.map((value, index) => (
          <label className="question-option" key={`${type}-${index}`}>
            <input
              type="radio"
              name="correctOption"
              value={index}
              required
                index === (type === 'TRUE_FALSE' ? Math.min(correctOption, 1) : correctOption)
              }
              aria-label={`الإجابة الصحيحة للخيار ${labels[index]}`}
            />
            <input
              name="options"
              required
              defaultValue={value}
              readOnly={type === 'TRUE_FALSE'}
              placeholder={`الخيار ${labels[index]}`}
            />
          </label>
        ))}
        {type === 'MULTIPLE_CHOICE' && (
          <div className="inline-between">
            <small>يمكن إضافة من خيارين إلى ستة خيارات.</small>
            <div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={optionCount <= 2}
                onClick={() => setOptionCount((count) => count - 1)}
              >
                حذف خيار
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={optionCount >= 6}
                onClick={() => setOptionCount((count) => count + 1)}
              >
                إضافة خيار
              </Button>
            </div>
          </div>
        )}
      </fieldset>
      <Select label="الصعوبة" name="difficulty" defaultValue={question.difficulty}>
        <option value="EASY">سهل</option>
        <option value="MEDIUM">متوسط</option>
        <option value="HARD">صعب</option>
      </Select>
      <Input label="الفئة" name="category" defaultValue={question.category || ''} />
      <NumberInput
        label="الوقت بالثواني"
        name="timeLimit"
        defaultValue={question.timeLimit}
        min="5"
        max="300"
        required
      />
      <NumberInput
        label="النقاط الأساسية"
        name="basePoints"
        defaultValue={question.basePoints}
        min="100"
        max="10000"
        required
      />
      <Textarea
        label="الشرح بعد الإجابة (اختياري)"
        name="explanation"
        defaultValue={question.explanation || ''}
      />
      <Input label="المصدر (اختياري)" name="source" defaultValue={question.source || ''} />
      {state.status !== 'idle' && (
        <p className={state.status === 'success' ? 'text-success' : 'text-danger'} role="status">
          {state.message}
        </p>
      )}
      <Button type="submit" loading={pending}>
        حفظ التعديلات
      </Button>
    </form>
  );
}
