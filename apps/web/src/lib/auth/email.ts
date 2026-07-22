import { Resend } from 'resend';

function getPasswordResetUrl(rawToken: string) {
  const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return new URL(`/auth/reset-password/${encodeURIComponent(rawToken)}`, baseUrl).toString();
}

export function canDeliverPasswordReset() {
  return (
    process.env.NODE_ENV === 'development' ||
    Boolean(process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM)
  );
}

export async function sendPasswordResetEmail(email: string, rawToken: string) {
  const resetUrl = getPasswordResetUrl(rawToken);
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;

  if (apiKey && from) {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to: email,
      subject: 'إعادة تعيين كلمة المرور في تحدّي',
      text: `استخدم الرابط التالي لإعادة تعيين كلمة المرور خلال 30 دقيقة: ${resetUrl}`,
      html: `<p dir="rtl">استخدم الرابط التالي لإعادة تعيين كلمة المرور خلال 30 دقيقة:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
    if (error) throw new Error(`Resend rejected the password reset email: ${error.message}`);
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    // Development-only fallback when Resend credentials are intentionally unavailable.
    console.info(`[auth:password-reset] ${resetUrl}`);
    return;
  }

  throw new Error('Password reset delivery is not configured.');
}
