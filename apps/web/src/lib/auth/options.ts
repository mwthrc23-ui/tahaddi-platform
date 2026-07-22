import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { checkRateLimit } from './rate-limit';
import { getPrismaClient, hasDatabaseUrl } from './prisma';
import { signInSchema } from './validation';
import { verifyPassword } from './password';

const genericCredentialsMessage = 'تعذّر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.';

function getClientIp(req: { headers?: Record<string, string | string[] | undefined> }) {
  const forwardedFor = req.headers?.['x-forwarded-for'];
  const value = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return value?.split(',')[0]?.trim() || 'unknown';
}

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'البريد وكلمة المرور',
    credentials: {
      email: { label: 'البريد الإلكتروني', type: 'email' },
      password: { label: 'كلمة المرور', type: 'password' },
    },
    async authorize(credentials, req) {
      const parsed = signInSchema.safeParse(credentials);
      if (!parsed.success || !hasDatabaseUrl()) {
        return null;
      }

      const rateKey = `signin:${getClientIp(req)}:${parsed.data.email}`;
      if (!(await checkRateLimit(rateKey))) {
        return null;
      }

      const prisma = getPrismaClient();
      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          passwordHash: true,
          role: true,
          status: true,
          tokenVersion: true,
        },
      });

      const validPassword = await verifyPassword(parsed.data.password, user?.passwordHash);
      if (!user || !validPassword || user.status !== 'ACTIVE') {
        return null;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        status: user.status,
        tokenVersion: user.tokenVersion,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  adapter: hasDatabaseUrl() ? PrismaAdapter(getPrismaClient() as never) : undefined,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/sign-in',
  },
  providers,
  callbacks: {
    async signIn({ user }) {
      if (!user?.id || !hasDatabaseUrl()) {
        return true;
      }

      const storedUser = await getPrismaClient().user.findUnique({
        where: { id: user.id },
        select: { status: true },
      });
      return storedUser?.status !== 'SUSPENDED' && storedUser?.status !== 'DELETED';
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? 'USER';
        token.status = (user as { status?: string }).status ?? 'ACTIVE';
        const issuedTokenVersion = (user as { tokenVersion?: number }).tokenVersion;
        token.tokenVersion =
          issuedTokenVersion ??
          (hasDatabaseUrl()
            ? (
                await getPrismaClient().user.findUnique({
                  where: { id: user.id },
                  select: { tokenVersion: true },
                })
              )?.tokenVersion
            : undefined);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? '');
        session.user.role = String(token.role ?? 'USER');
        session.user.status = String(token.status ?? 'ACTIVE');
        session.user.tokenVersion =
          typeof token.tokenVersion === 'number' ? token.tokenVersion : -1;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id && hasDatabaseUrl()) {
        await getPrismaClient().user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      }
    },
  },
  debug: false,
};

export { genericCredentialsMessage };
