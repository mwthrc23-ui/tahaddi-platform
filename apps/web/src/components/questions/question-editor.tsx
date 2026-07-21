'use client';

import { useActionState, useState } from 'react';
import { Button, Input, NumberInput, Select, Textarea } from '@/components/ui';
import { createQuestion, initialQuestionActionState } from '@/app/questions/actions';

const labels = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

export function QuestionEditor() {
  const [state, formAction, pending] = useActionState(createQuestion, initialQuestionActionState);
  const [type, setType] = useState<'MULTIPLE_CHOICE' | 'TRUE_FALSE'>('MULTIPLE_CHOICE');
  const [optionCount, setOptionCount] = useState(4);
  const options: string[] =
    type === 'TRUE_FALSE' ? ['صح', 'خطأ'] : Array.from({ length: optionCount }, () => '');

  return (
    <form action={formAction} className="form-grid question-editor">
      <Select
        label="نوع السؤال"
        name="type"
        value={type}
        onChange={(event) => setType(event.target.value as typeof type)}
      >
        <option value="MULTIPLE_CHOICE">اختيار من متعدد</option>
        <option value="TRUE_FALSE">صح أو خطأ</option>
      </Select>
      <Textarea
        label="نص السؤال"
        name="prompt"
        required
        minLength={8}
        placeholder="اكتب سؤالًا واضحًا ومباشرًا"
      />
      <fieldset className="field question-options">
        <legend className="field-label">الخيارات والإجابة الصحيحة</legend>
        {options.map((value, index) => (
          <label className="question-option" key={index}>
            <input
              type="radio"
              name="correctOption"
              value={index}
              defaultChecked={index === 0}
              aria-label={`الإجابة الصحيحة للخيار ${labels[index]}`}
            />
            <input
              name="options"
              required
              defaultValue={type === 'TRUE_FALSE' ? value : ''}
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
      <Select label="الصعوبة" name="difficulty" defaultValue="MEDIUM">
        <option value="EASY">سهل</option>
        <option value="MEDIUM">متوسط</option>
        <option value="HARD">صعب</option>
      </Select>
      <Input label="الفئة" name="category" placeholder="مثل: ثقافة عامة" />
      <NumberInput
        label="الوقت بالثواني"
        name="timeLimit"
        defaultValue="20"
        min="5"
        max="300"
        required
      />
      <NumberInput
        label="النقاط الأساسية"
        name="basePoints"
        defaultValue="1000"
        min="100"
        max="10000"
        required
      />
      <Textarea
        label="الشرح بعد الإجابة (اختياري)"
        name="explanation"
        placeholder="يوضح سبب صحة الإجابة"
      />
      <Input label="المصدر (اختياري)" name="source" placeholder="رابط أو مرجع موثوق" />
      {state.status !== 'idle' && (
        <p className={state.status === 'success' ? 'text-success' : 'text-danger'} role="status">
          {state.message}
        </p>
      )}
      <Button type="submit" loading={pending}>
        حفظ كمسودة
      </Button>
    </form>
  );
}
