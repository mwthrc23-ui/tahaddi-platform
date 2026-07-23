'use server';

import { revalidatePath } from 'next/cache';
import { getPrismaClient, hasDatabaseUrl } from '@/lib/auth/prisma';
import { requireActiveUser } from '@/lib/auth/session';
import { generateUniqueActivityRoomCode } from '@/lib/quiz/room-code';

const ROOM_CODE_RE = /^[34679ACDEFGHJKMNPQRTUVWXY]{6,8}$/;
const MAX_QUIZ_QUESTIONS = 100;

export type QuizActionResult =
  { status: 'success'; quizId: string; roomCode: string } | { status: 'error'; message: string };

export type CreateQuizInput = {
  title: string;
  description?: string;
  questionIds: string[];
  maxPlayers?: number;
  autoLockAnswers?: boolean;
  autoAdvance?: boolean;
  speedScoring?: boolean;
};

export type PublicQuiz = {
  id: string;
  title: string;
  description: string | null;
  roomCode: string;
  ownerName: string | null;
  questionCount: number;
  createdAt: string;
};

export type PublicQuizzesResult =
  { status: 'success'; quizzes: PublicQuiz[] } | { status: 'error'; message: string; quizzes: [] };

function normalizeRoomCode(value: string) {
  return value.trim().replace(/\s+/g, '').toUpperCase();
}

function isUniqueConstraintError(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2002');
}

export async function joinQuizByCode(value: string): Promise<QuizActionResult> {
  const roomCode = normalizeRoomCode(value);
  if (!ROOM_CODE_RE.test(roomCode)) {
    return {
      status: 'error',
      message: 'الرمز يجب أن يتكوّن من ٦ إلى ٨ أحرف أو أرقام صالحة.',
    };
  }

  if (!hasDatabaseUrl()) {
    return { status: 'error', message: 'خدمة المسابقات غير متاحة حاليًا.' };
  }

  try {
    const quiz = await getPrismaClient().quiz.findUnique({
      where: { roomCode },
      select: { id: true, roomCode: true, status: true },
    });

    if (!quiz || quiz.status !== 'ACTIVE') {
      return { status: 'error', message: 'لم نجد مسابقة نشطة بهذا الرمز.' };
    }

    return { status: 'success', quizId: quiz.id, roomCode: quiz.roomCode };
  } catch {
    return { status: 'error', message: 'تعذّر التحقق من رمز المسابقة الآن.' };
  }
}

export async function createQuiz(input: CreateQuizInput): Promise<QuizActionResult> {
  if (!hasDatabaseUrl()) {
    return { status: 'error', message: 'قاعدة البيانات غير مهيأة بعد.' };
  }

  const user = await requireActiveUser('/quizzes/new');
  const title = input.title.trim();
  const description = input.description?.trim() || undefined;
  const questionIds = [...new Set(input.questionIds)];
  const maxPlayers = Math.min(500, Math.max(2, Math.trunc(input.maxPlayers ?? 50)));

  if (title.length < 3 || title.length > 160) {
    return { status: 'error', message: 'عنوان المسابقة يجب أن يكون بين ٣ و١٦٠ حرفًا.' };
  }
  if (description && description.length > 1000) {
    return { status: 'error', message: 'وصف المسابقة يجب ألا يتجاوز ١٠٠٠ حرف.' };
  }
  if (questionIds.length === 0 || questionIds.length > MAX_QUIZ_QUESTIONS) {
    return { status: 'error', message: 'اختر سؤالًا واحدًا على الأقل وبحد أقصى ١٠٠ سؤال.' };
  }

  const prisma = getPrismaClient();
  try {
    const ownedQuestionCount = await prisma.question.count({
      where: {
        id: { in: questionIds },
        ownerId: user.id,
        status: { not: 'ARCHIVED' },
      },
    });

    if (ownedQuestionCount !== questionIds.length) {
      return {
        status: 'error',
        message: 'تعذّر حفظ المسابقة لأن بعض الأسئلة غير متاحة أو لا تملكها.',
      };
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const roomCode = await generateUniqueActivityRoomCode(prisma);
      try {
        const quiz = await prisma.quiz.create({
          data: {
            title,
            description,
            ownerId: user.id,
            roomCode,
            status: 'DRAFT',
            isPublic: false,
            maxPlayers,
            autoLockAnswers: input.autoLockAnswers ?? true,
            autoAdvance: input.autoAdvance ?? false,
            speedScoring: input.speedScoring ?? true,
            questions: {
              create: questionIds.map((questionId, position) => ({ questionId, position })),
            },
          },
          select: { id: true, roomCode: true },
        });

        revalidatePath('/quizzes');
        revalidatePath('/quizzes/new');
        revalidatePath('/');
        return { status: 'success', quizId: quiz.id, roomCode: quiz.roomCode };
      } catch (error) {
        if (!isUniqueConstraintError(error)) throw error;
      }
    }

    return { status: 'error', message: 'تعذّر إنشاء رمز غرفة فريد. حاول مرة أخرى.' };
  } catch {
    return { status: 'error', message: 'تعذّر حفظ المسابقة الآن. حاول مرة أخرى.' };
  }
}

export async function getPublicQuizzes(limit = 6): Promise<PublicQuizzesResult> {
  if (!hasDatabaseUrl()) {
    return { status: 'success', quizzes: [] };
  }

  try {
    const take = Math.min(24, Math.max(1, Math.trunc(limit) || 6));
    const quizzes = await getPrismaClient().quiz.findMany({
      where: { isPublic: true, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        title: true,
        description: true,
        roomCode: true,
        createdAt: true,
        owner: { select: { name: true } },
        _count: { select: { questions: true } },
      },
    });

    return {
      status: 'success',
      quizzes: quizzes.map((quiz) => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        roomCode: quiz.roomCode,
        ownerName: quiz.owner.name,
        questionCount: quiz._count.questions,
        createdAt: quiz.createdAt.toISOString(),
      })),
    };
  } catch {
    return {
      status: 'error',
      message: 'تعذّر تحميل المسابقات العامة الآن.',
      quizzes: [],
    };
  }
}
