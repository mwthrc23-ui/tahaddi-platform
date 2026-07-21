import { z } from 'zod';

const optionSchema = z.string().trim().min(1, 'اكتب نص الخيار.').max(500, 'الخيار طويل جدًا.');

export const questionSchema = z
  .object({
    type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE']),
    prompt: z.string().trim().min(8, 'اكتب سؤالًا أوضح.').max(1000, 'السؤال طويل جدًا.'),
    options: z
      .array(optionSchema)
      .min(2, 'أضف خيارين على الأقل.')
      .max(6, 'الحد الأقصى ستة خيارات.'),
    correctOption: z.coerce.number().int().nonnegative(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    category: z.string().trim().max(120, 'الفئة طويلة جدًا.').optional(),
    explanation: z.string().trim().max(2000, 'الشرح طويل جدًا.').optional(),
    source: z.string().trim().max(500, 'المصدر طويل جدًا.').optional(),
    timeLimit: z.coerce
      .number()
      .int()
      .min(5, 'الوقت الأدنى 5 ثوانٍ.')
      .max(300, 'الوقت الأقصى 300 ثانية.'),
    basePoints: z.coerce
      .number()
      .int()
      .min(100, 'النقاط الأدنى 100.')
      .max(10000, 'النقاط القصوى 10000.'),
  })
  .superRefine((value, context) => {
    if (value.correctOption >= value.options.length) {
      context.addIssue({
        code: 'custom',
        path: ['correctOption'],
        message: 'اختر إجابة صحيحة من الخيارات المكتوبة.',
      });
    }
    if (value.type === 'TRUE_FALSE' && value.options.length !== 2) {
      context.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'سؤال صح أو خطأ يحتوي خيارين فقط.',
      });
    }
  });

export type QuestionInput = z.infer<typeof questionSchema>;
