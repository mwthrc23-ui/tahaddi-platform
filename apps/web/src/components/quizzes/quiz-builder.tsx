'use client';

import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ClipboardList,
  GripVertical,
  ListPlus,
  Save,
  Settings2,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Input, NumberInput, Select, Textarea } from '@/components/ui';

type DraftQuestion = {
  id: string;
  prompt: string;
  category: string;
  duration: number;
  points: number;
};

type QuizDraft = {
  version: 1;
  title: string;
  description: string;
  roundName: string;
  presentationMode: 'SEQUENTIAL' | 'RANDOM';
  playerLimit: number;
  questions: DraftQuestion[];
};

const storageKey = 'tahaddi:quiz-builder:draft:v1';
const availableQuestions: DraftQuestion[] = [
  {
    id: 'heritage',
    prompt: 'ما اسم المنطقة التي اشتهرت بآثار مدائن صالح؟',
    category: 'تراث سعودي',
    duration: 20,
    points: 1000,
  },
  {
    id: 'science',
    prompt: 'ما الكوكب الأقرب إلى الشمس؟',
    category: 'علوم',
    duration: 15,
    points: 800,
  },
  { id: 'language', prompt: 'ما جمع كلمة كتاب؟', category: 'لغة عربية', duration: 15, points: 800 },
  {
    id: 'geography',
    prompt: 'ما أكبر قارات العالم مساحةً؟',
    category: 'جغرافيا',
    duration: 20,
    points: 1000,
  },
];
const initialDraft: QuizDraft = {
  version: 1,
  title: 'مسابقة الثقافة العامة',
  description: 'مسودة قصيرة لجولة تفاعلية من أسئلة متنوعة.',
  roundName: 'الجولة الأولى',
  presentationMode: 'SEQUENTIAL',
  playerLimit: 50,
  questions: availableQuestions.slice(0, 2),
};

function isDraftQuestion(value: unknown): value is DraftQuestion {
  if (!value || typeof value !== 'object') return false;
  const question = value as Partial<DraftQuestion>;
  return (
    typeof question.id === 'string' &&
    typeof question.prompt === 'string' &&
    typeof question.category === 'string' &&
    typeof question.duration === 'number' &&
    typeof question.points === 'number'
  );
}

export function parseQuizDraft(value: string): QuizDraft | null {
  try {
    const draft = JSON.parse(value) as Partial<QuizDraft>;
    if (
      draft.version !== 1 ||
      typeof draft.title !== 'string' ||
      typeof draft.description !== 'string' ||
      typeof draft.roundName !== 'string' ||
      !['SEQUENTIAL', 'RANDOM'].includes(draft.presentationMode || '') ||
      typeof draft.playerLimit !== 'number' ||
      !Array.isArray(draft.questions) ||
      !draft.questions.every(isDraftQuestion)
    ) {
      return null;
    }
    return draft as QuizDraft;
  } catch {
    return null;
  }
}

export function QuizBuilder() {
  const [draft, setDraft] = useState<QuizDraft>(initialDraft);
  const [storageReady, setStorageReady] = useState(false);
  const [notice, setNotice] = useState('');
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const storedDraft = parseQuizDraft(localStorage.getItem(storageKey) || '');
      if (storedDraft) {
        setDraft(storedDraft);
        setNotice('استُعيدت المسودة المحلية المحفوظة.');
      }
      setStorageReady(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(draft));
        setSaveFailed(false);
      } catch {
        setSaveFailed(true);
      }
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [draft, storageReady]);

  const totalDuration = useMemo(
    () => draft.questions.reduce((sum, question) => sum + question.duration, 0),
    [draft.questions],
  );
  const totalPoints = useMemo(
    () => draft.questions.reduce((sum, question) => sum + question.points, 0),
    [draft.questions],
  );

  const updateDraft = <Key extends keyof QuizDraft>(key: Key, value: QuizDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };
  const addQuestion = (question: DraftQuestion) => {
    if (draft.questions.some((existing) => existing.id === question.id)) {
      setNotice(`السؤال «${question.category}» موجود بالفعل في المسودة.`);
      return;
    }
    updateDraft('questions', [...draft.questions, question]);
    setNotice(`أُضيف سؤال «${question.category}» إلى المسودة محليًا.`);
  };
  const removeQuestion = (id: string) => {
    updateDraft(
      'questions',
      draft.questions.filter((question) => question.id !== id),
    );
    setNotice('أُزيل السؤال من المسودة المحلية.');
  };
  const moveQuestion = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= draft.questions.length) return;
    const questions = [...draft.questions];
    [questions[index], questions[nextIndex]] = [questions[nextIndex], questions[index]];
    updateDraft('questions', questions);
  };
  const updateQuestion = (id: string, field: 'duration' | 'points', value: number) => {
    updateDraft(
      'questions',
      draft.questions.map((question) =>
        question.id === id ? { ...question, [field]: value } : question,
      ),
    );
  };
  const saveDraft = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
      setSaveFailed(false);
      setNotice('حُفظت المسودة محليًا على هذا الجهاز.');
    } catch {
      setSaveFailed(true);
      setNotice('تعذّر حفظ المسودة محليًا. تحقق من مساحة التخزين في المتصفح.');
    }
  };

  const selected = new Set(draft.questions.map((question) => question.id));

  return (
    <div className="quiz-builder" dir="rtl">
      <div className="dashboard-actions">
        <Button variant="outline" type="button" onClick={saveDraft}>
          <Save />
          حفظ المسودة محليًا
        </Button>
      </div>
      <Card className="quiz-builder-intro">
        <div className="inline-between">
          <div>
            <h2>
              <ClipboardList /> منشئ المسابقة
            </h2>
            <p className="muted">رتّب الأسئلة واضبط الجولة قبل ربطها بالحفظ والنشر الفعليين.</p>
          </div>
          <Badge>مسودة محلية</Badge>
        </div>
        {notice && (
          <p className={saveFailed ? 'text-danger' : 'text-success'} role="status">
            {notice}
          </p>
        )}
      </Card>

      <div className="card-grid two quiz-builder-grid">
        <Card>
          <h2>
            <Settings2 /> بيانات المسابقة
          </h2>
          <div className="form-grid">
            <Input
              label="عنوان المسابقة"
              value={draft.title}
              onChange={(event) => updateDraft('title', event.target.value)}
            />
            <Input
              label="اسم الجولة"
              value={draft.roundName}
              onChange={(event) => updateDraft('roundName', event.target.value)}
            />
            <Textarea
              className="quiz-builder-wide"
              label="وصف مختصر"
              value={draft.description}
              onChange={(event) => updateDraft('description', event.target.value)}
            />
            <Select
              label="طريقة عرض الأسئلة"
              value={draft.presentationMode}
              onChange={(event) =>
                updateDraft('presentationMode', event.target.value as QuizDraft['presentationMode'])
              }
            >
              <option value="SEQUENTIAL">بالترتيب</option>
              <option value="RANDOM">ترتيب عشوائي</option>
            </Select>
            <NumberInput
              label="حد اللاعبين"
              value={draft.playerLimit}
              min="2"
              max="500"
              onChange={(event) =>
                updateDraft(
                  'playerLimit',
                  Math.min(500, Math.max(2, Number(event.target.value) || 2)),
                )
              }
            />
          </div>
        </Card>

        <Card>
          <h2>
            <ListPlus /> ملخص المسودة
          </h2>
          <div className="card-grid three quiz-builder-stats">
            <div>
              <strong>{draft.questions.length}</strong>
              <span>أسئلة</span>
            </div>
            <div>
              <strong>{totalDuration}</strong>
              <span>ثانية</span>
            </div>
            <div>
              <strong>{totalPoints.toLocaleString('ar-SA')}</strong>
              <span>نقطة</span>
            </div>
          </div>
          <p className="muted">
            {draft.title || 'مسابقة بلا عنوان'} · {draft.roundName || 'جولة بلا اسم'}
          </p>
          <p className="muted">
            تُحفظ المسودة على هذا الجهاز فقط؛ لا توجد مشاركة أو نشر دائم حتى الآن.
          </p>
        </Card>
      </div>

      <div className="card-grid two quiz-builder-grid">
        <Card>
          <div className="inline-between">
            <h2>
              <GripVertical /> أسئلة {draft.roundName || 'الجولة'}
            </h2>
            <Badge>{draft.questions.length} مختارة</Badge>
          </div>
          {draft.questions.length === 0 ? (
            <p className="muted">أضف سؤالًا من القائمة المجاورة لتكوين المسودة.</p>
          ) : (
            <ol className="quiz-builder-list">
              {draft.questions.map((question, index) => (
                <li key={question.id} className="list-item">
                  <div>
                    <strong>
                      {index + 1}. {question.prompt}
                    </strong>
                    <p>{question.category}</p>
                    <div className="quiz-builder-question-settings">
                      <NumberInput
                        label="الوقت"
                        value={question.duration}
                        min="5"
                        max="300"
                        onChange={(event) =>
                          updateQuestion(question.id, 'duration', Number(event.target.value) || 5)
                        }
                      />
                      <NumberInput
                        label="النقاط"
                        value={question.points}
                        min="100"
                        max="10000"
                        onChange={(event) =>
                          updateQuestion(question.id, 'points', Number(event.target.value) || 100)
                        }
                      />
                    </div>
                  </div>
                  <div className="quiz-builder-row-actions">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="نقل السؤال لأعلى"
                      disabled={index === 0}
                      onClick={() => moveQuestion(index, -1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="نقل السؤال لأسفل"
                      disabled={index === draft.questions.length - 1}
                      onClick={() => moveQuestion(index, 1)}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="إزالة السؤال"
                      onClick={() => removeQuestion(question.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card>
          <h2>
            <CheckCircle2 /> أسئلة متاحة للمعاينة
          </h2>
          <p className="muted">هذه أمثلة محلية للواجهة وليست قراءة من بنك الأسئلة بعد.</p>
          <div className="quiz-builder-list">
            {availableQuestions.map((question) => (
              <article key={question.id} className="list-item">
                <div>
                  <strong>{question.prompt}</strong>
                  <p>
                    {question.category} · {question.duration} ثانية · {question.points} نقطة
                  </p>
                </div>
                <Button
                  type="button"
                  variant={selected.has(question.id) ? 'outline' : 'secondary'}
                  size="sm"
                  disabled={selected.has(question.id)}
                  onClick={() => addQuestion(question)}
                >
                  {selected.has(question.id) ? 'مضاف' : 'إضافة'}
                </Button>
              </article>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
