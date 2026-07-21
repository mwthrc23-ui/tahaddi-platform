'use server';

import { revalidatePath } from 'next/cache';
import { getPrismaClient, hasDatabaseUrl } from '@/lib/auth/prisma';
import { requireActiveUser } from '@/lib/auth/session';
import { questionSchema } from '@/lib/questions/validation';

export type QuestionActionState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

export const initialQuestionActionState: QuestionActionState = { status: 'idle', message: '' };

const emptyToUndefined = (value: FormDataEntryValue | null) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || undefined;
};

export async function createQuestion(
  _previousState: QuestionActionState,
  formData: FormData,
): Promise<QuestionActionState> {
  const user = await requireActiveUser('/questions');
  const type = formData.get('type');
  const rawOptions = formData
    .getAll('options')
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  const options = type === 'TRUE_FALSE' ? ['صح', 'خطأ'] : rawOptions;
  const parsed = questionSchema.safeParse({
    type,
    prompt: formData.get('prompt'),
    options,
    correctOption: formData.get('correctOption'),
    difficulty: formData.get('difficulty'),
    category: emptyToUndefined(formData.get('category')),
    explanation: emptyToUndefined(formData.get('explanation')),
    source: emptyToUndefined(formData.get('source')),
    timeLimit: formData.get('timeLimit'),
    basePoints: formData.get('basePoints'),
  });

  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message || 'راجع بيانات السؤال.' };
  }
  if (!hasDatabaseUrl()) {
    return { status: 'error', message: 'قاعدة البيانات غير مهيأة بعد.' };
  }

  const { options: inputOptions, correctOption, ...question } = parsed.data;
  await getPrismaClient().question.create({
    data: {
      ...question,
      ownerId: user.id,
      options: {
        create: inputOptions.map((text, position) => ({
          text,
          position,
          isCorrect: position === correctOption,
        })),
      },
    },
  });

  revalidatePath('/questions');
  return { status: 'success', message: 'حُفظ السؤال كمسودة.' };
}
