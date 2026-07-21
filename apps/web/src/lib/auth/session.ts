import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './options';
import { sanitizeCallbackPath } from './redirects';

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

  if (user.status !== 'ACTIVE') {
    redirect('/auth/sign-in?error=account');
  }

  return user;
}
