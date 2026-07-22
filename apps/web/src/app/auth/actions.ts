'use server';

import { headers } from 'next/headers';
import { canDeliverPasswordReset, sendPasswordResetEmail } from '@/lib/auth/email';
import { getPrismaClient, hasDatabaseUrl } from '@/lib/auth/prisma';
import { checkRateLimit } from '@/lib/auth/rate-limit';
import { hashPassword } from '@/lib/auth/password';
import { createRecoveryToken, hashRecoveryToken } from '@/lib/auth/recovery-token';
import { recoverySchema, signUpSchema } from '@/lib/auth/validation';

export type AuthActionState = {
  status: 'idle' | 'success' | 'error';
  message: string;
  errors?: Record<string, string>;
};

const genericRegistrationMessage =
  'تم استلام الطلب. إذا كان البريد مؤهلًا فستتمكن من تسجيل الدخول أو متابعة خطوات التحقق.';
const genericRecoveryMessage = 'إذا كان البريد مسجلًا لدينا فستصل إليه تعليمات الاستعادة.';

async function getRequestKey(scope: string, email: string) {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  return `${scope}:${forwardedFor}:${email}`;
}

function fieldErrors(
  error: ReturnType<typeof signUpSchema.safeParse> | ReturnType<typeof recoverySchema.safeParse>,
) {
  if (error.success) {
    return undefined;
  }

  const flattened = error.error.flatten().fieldErrors;
  return Object.fromEntries(
    Object.entries(flattened).flatMap(([key, value]) => (value?.[0] ? [[key, value[0]]] : [])),
  );
}

export async function registerWithPassword(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'راجع الحقول وحاول مرة أخرى.',
      errors: fieldErrors(parsed),
    };
  }

  if (
    !hasDatabaseUrl() ||
    !(await checkRateLimit(await getRequestKey('signup', parsed.data.email), 5))
  ) {
    return { status: 'success', message: genericRegistrationMessage };
  }

  const prisma = getPrismaClient();
  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existingUser) {
    return { status: 'success', message: genericRegistrationMessage };
  }

  await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash: await hashPassword(parsed.data.password),
      status: 'ACTIVE',
      profile: {
        create: {
          displayName: parsed.data.name,
        },
      },
    },
  });

  return { status: 'success', message: genericRegistrationMessage };
}

export async function requestPasswordRecovery(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = recoverySchema.safeParse({
    email: formData.get('email'),
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'راجع البريد الإلكتروني وحاول مرة أخرى.',
      errors: fieldErrors(parsed),
    };
  }

  if (!hasDatabaseUrl() || !canDeliverPasswordReset()) {
    return { status: 'error', message: 'خدمة استعادة الحساب غير متاحة حاليًا. حاول لاحقًا.' };
  }

  if (!(await checkRateLimit(await getRequestKey('recover', parsed.data.email), 4))) {
    return { status: 'success', message: genericRecoveryMessage };
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (user) {
    const rawToken = createRecoveryToken();
    const token = hashRecoveryToken(rawToken);
    await prisma.verificationToken.deleteMany({ where: { identifier: parsed.data.email } });
    await prisma.verificationToken.create({
      data: {
        identifier: parsed.data.email,
        token,
        expires: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    try {
      await sendPasswordResetEmail(parsed.data.email, rawToken);
    } catch (error) {
      await prisma.verificationToken.deleteMany({ where: { token } });
      console.error('[auth:password-reset] Delivery failed.', error);
    }
  }

  return { status: 'success', message: genericRecoveryMessage };
}
