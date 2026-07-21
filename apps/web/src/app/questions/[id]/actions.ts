'use server';

import { revalidatePath } from 'next/cache';
import { getPrismaClient, hasDatabaseUrl } from '@/lib/auth/prisma';
import { requireActiveUser } from '@/lib/auth/session';
import { questionSchema } from '@/lib/questions/validation';

export type UpdateQuestionActionState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

const emptyToUndefined = (value: FormDataEntryValue | null) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || undefined;
};

export async function updateQuestion(
  questionId: string,
  _previousState: UpdateQuestionActionState,
  formData: FormData,
): Promise<UpdateQuestionActionState> {
  const user = await requireActiveUser(`/questions/${questionId}`);
  if (!hasDatabaseUrl()) {
    return { status: 'error', message: 'قاعدة البيانات غير مهيأة بعد.' };
  }

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

  const { options: inputOptions, correctOption, ...question } = parsed.data;
  const client = getPrismaClient();
  type TxClient = Omit<typeof client, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;
  const updated = await client.$transaction(async (prisma: TxClient) => {
    const result = await prisma.question.updateMany({
      where: { id: questionId, ownerId: user.id, status: { not: 'ARCHIVED' } },
      data: question,
    });
    if (result.count === 0) return false;

    await prisma.questionOption.deleteMany({ where: { questionId } });
    await prisma.questionOption.createMany({
      data: inputOptions.map((text, position) => ({
        questionId,
        text,
        position,
        isCorrect: position === correctOption,
      })),
    });
    return true;
  });

  if (!updated) {
    return {
      status: 'error',
      message: 'تعذّر تعديل السؤال. قد يكون مؤرشفًا أو لا تملك صلاحية الوصول إليه.',
    };
  }

  revalidatePath('/questions');
  revalidatePath(`/questions/${questionId}`);
  return { status: 'success', message: 'تم حفظ تعديلات السؤال.' };
}
