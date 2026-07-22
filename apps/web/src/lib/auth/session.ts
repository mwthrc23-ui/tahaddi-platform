import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { getPrismaClient, hasDatabaseUrl } from './prisma';
import { authOptions } from './options';
import { sanitizeCallbackPath } from './redirects';

type SessionIdentity = {
  id: string;
  tokenVersion: number;
};

type StoredIdentity = {
  id: string;
  role: string;
  status: string;
  tokenVersion: number;
};

export function isSessionUserCurrent(
  sessionUser: SessionIdentity,
  storedUser: StoredIdentity | null,
): storedUser is StoredIdentity {
  return (
    storedUser?.status === 'ACTIVE' &&
    storedUser.id === sessionUser.id &&
    storedUser.tokenVersion === sessionUser.tokenVersion
  );
}

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireActiveUser(next = '/dashboard') {
  const session = await getCurrentSession();
  const user = session?.user;
  const safeNext = sanitizeCallbackPath(next);

  if (!user?.id) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(safeNext)}`);
  }

  if (!hasDatabaseUrl()) {
    redirect('/auth/sign-in?error=account');
  }

  const storedUser = await getPrismaClient().user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, status: true, tokenVersion: true },
  });

  if (!isSessionUserCurrent(user, storedUser)) {
    redirect('/auth/sign-in?error=session-revoked');
  }

  return {
    ...user,
    role: storedUser.role,
    status: storedUser.status,
    tokenVersion: storedUser.tokenVersion,
  };
}
