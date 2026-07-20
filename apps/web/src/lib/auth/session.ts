import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './options';

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireActiveUser(next = '/dashboard') {
  const session = await getCurrentSession();
  const user = session?.user;

  if (!user?.id) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(next)}`);
  }

  if (user.status !== 'ACTIVE') {
    redirect('/auth/sign-in?error=account');
  }

  return user;
}
