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
<<<<<<< HEAD
import { useMemo, useState } from 'react';
=======
import { useEffect, useMemo, useState } from 'react';
>>>>>>> origin/main
import { Badge, Button, Card, Input, NumberInput, Select, Textarea } from '@/components/ui';

type DraftQuestion = {
  id: string;
  prompt: string;
  category: string;
  duration: number;
  points: number;
};

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

<<<<<<< HEAD
=======
const draftStorageKey = 'tahaddi-quiz-draft';

>>>>>>> origin/main
export function QuizBuilder() {
  const [title, setTitle] = useState('مسابقة الثقافة العامة');
  const [description, setDescription] = useState('مسودة قصيرة لجولة تفاعلية من أسئلة متنوعة.');
  const [roundName, setRoundName] = useState('الجولة الأولى');
  const [questions, setQuestions] = useState<DraftQuestion[]>(availableQuestions.slice(0, 2));
  const [notice, setNotice] = useState('');

<<<<<<< HEAD
=======
  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(draftStorageKey);
        if (!saved) return;

        const draft = JSON.parse(saved) as {
          title?: unknown;
          description?: unknown;
          roundName?: unknown;
          questions?: unknown;
        };
        if (
          typeof draft.title !== 'string' ||
          typeof draft.description !== 'string' ||
          typeof draft.roundName !== 'string' ||
          !Array.isArray(draft.questions)
        ) {
          return;
        }

        setTitle(draft.title);
        setDescription(draft.description);
        setRoundName(draft.roundName);
        setQuestions(draft.questions as DraftQuestion[]);
        setNotice('استُعيدت آخر مسودة محفوظة على هذا الجهاز.');
      } catch {
        localStorage.removeItem(draftStorageKey);
      }
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

>>>>>>> origin/main
  const totalDuration = useMemo(
    () => questions.reduce((sum, question) => sum + question.duration, 0),
    [questions],
  );
  const totalPoints = useMemo(
    () => questions.reduce((sum, question) => sum + question.points, 0),
    [questions],
  );

<<<<<<< HEAD
const addQuestion = (question: DraftQuestion) => {
  setQuestions((current) => {
    if (current.some((existing) => existing.id === question.id)) {
      setNotice(`السؤال «${question.category}» موجود بالفعل في المسودة.`);
      return current;
    }
    setNotice(`أُضيف سؤال «${question.category}» إلى المسودة محليًا.`);
    return [...current, question];
  });
};
=======
  const addQuestion = (question: DraftQuestion) => {
    setQuestions((current) => [...current, question]);
    setNotice(`أُضيف سؤال «${question.category}» إلى المسودة محليًا.`);
  };
>>>>>>> origin/main
  const removeQuestion = (id: string) => {
    setQuestions((current) => current.filter((question) => question.id !== id));
    setNotice('أُزيل السؤال من المسودة المحلية.');
  };
  const moveQuestion = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= questions.length) return;
    setQuestions((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };
  const updateQuestion = (id: string, field: 'duration' | 'points', value: number) => {
    setQuestions((current) =>
      current.map((question) => (question.id === id ? { ...question, [field]: value } : question)),
    );
  };

  const selected = new Set(questions.map((question) => question.id));

<<<<<<< HEAD
  return (
    <div className="quiz-builder" dir="rtl">
      <div className="dashboard-actions">
        <Button
          variant="outline"
          type="button"
          onClick={() => setNotice('هذه مسودة محلية فقط؛ لن تُحفظ في قاعدة البيانات بعد.')}
        >
=======
  const saveDraft = () => {
    try {
      localStorage.setItem(
        draftStorageKey,
        JSON.stringify({ title, description, roundName, questions }),
      );
      setNotice('حُفظت المسودة على هذا الجهاز.');
    } catch {
      setNotice('تعذّر حفظ المسودة على هذا الجهاز.');
    }
  };

  return (
    <div className="quiz-builder" dir="rtl">
      <div className="dashboard-actions">
        <Button variant="outline" type="button" onClick={saveDraft}>
>>>>>>> origin/main
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
          <p className="text-success" role="status">
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
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <Input
              label="اسم الجولة"
              value={roundName}
              onChange={(event) => setRoundName(event.target.value)}
            />
            <Textarea
              className="quiz-builder-wide"
              label="وصف مختصر"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <Select label="طريقة عرض الأسئلة" defaultValue="SEQUENTIAL">
              <option value="SEQUENTIAL">بالترتيب</option>
              <option value="RANDOM">ترتيب عشوائي</option>
            </Select>
            <NumberInput label="حد اللاعبين" defaultValue="50" min="2" max="500" />
          </div>
        </Card>

        <Card>
          <h2>
            <ListPlus /> ملخص المسودة
          </h2>
          <div className="card-grid three quiz-builder-stats">
            <div>
              <strong>{questions.length}</strong>
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
            {title || 'مسابقة بلا عنوان'} · {roundName || 'جولة بلا اسم'}
          </p>
<<<<<<< HEAD
          <p className="muted">لا توجد مشاركة أو نشر أو حفظ دائم في هذه الشاشة حتى الآن.</p>
=======
          <p className="muted">
            تُحفظ المسودة على هذا الجهاز فقط؛ لا توجد مشاركة أو نشر دائم حتى الآن.
          </p>
>>>>>>> origin/main
        </Card>
      </div>

      <div className="card-grid two quiz-builder-grid">
        <Card>
          <div className="inline-between">
            <h2>
              <GripVertical /> أسئلة {roundName || 'الجولة'}
            </h2>
            <Badge>{questions.length} مختارة</Badge>
          </div>
          {questions.length === 0 ? (
            <p className="muted">أضف سؤالًا من القائمة المجاورة لتكوين المسودة.</p>
          ) : (
            <ol className="quiz-builder-list">
              {questions.map((question, index) => (
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
                      disabled={index === questions.length - 1}
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
