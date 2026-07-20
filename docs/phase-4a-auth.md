# المرحلة 4A: أساس المصادقة والهوية

## القرارات

- مكان المصادقة هو `apps/web` لأنه يعمل كواجهة وBFF لتدفقات الويب غير اللحظية.
- قاعدة الهوية في Prisma: `User`, `Account`, `Session`, `VerificationToken`, `Profile`.
- تسجيل البريد وكلمة المرور يستخدم Zod عند حدود الإدخال، وتجزيء `scrypt` من Node مع salt عشوائي.
- رسائل التسجيل والاستعادة عامة حتى لا تكشف إن كان البريد مسجلًا.
- Google OAuth مجهز عبر `AUTH_GOOGLE_ID` و`AUTH_GOOGLE_SECRET`. زر Google يظهر في الواجهة لكنه يبقى معطلًا حتى تتوفر المفاتيح.
- Supabase مدعوم عبر `DATABASE_URL` لقاعدة PostgreSQL، ومعه `NEXT_PUBLIC_SUPABASE_URL` و`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` عند الحاجة للعميل. لا تُحفظ القيم الحقيقية في Git.
- `dashboard` و`profile` محميان على الخادم عبر جلسة Auth.js.

## النشر

المصادقة الديناميكية لا تتوافق مع GitHub Pages الثابت. أبقينا `output: 'export'` متاحًا عند `TAHADDI_DEPLOY_TARGET=static`، لكن تشغيل المصادقة يحتاج نشر Next.js على Vercel أو خدمة Node:

1. اضبط `TAHADDI_DEPLOY_TARGET=node`.
2. وفر `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, وبيانات OAuth في منصة الأسرار.
3. انقل `apps/web` إلى Vercel أو Node runtime.
4. أبق `apps/realtime` كخدمة Node طويلة التشغيل مستقلة.

Workflow الحالي لا يرفع Pages إلا إذا كان متغير المستودع `TAHADDI_DEPLOY_TARGET` يساوي `static`.

## اختبارات المرحلة

- `password.test.ts`: التجزئة والتحقق دون حفظ النص الصريح.
- `validation.test.ts`: تطبيع البريد، قوة كلمة المرور، ومدخل الاستعادة.
- يلزم لاحقًا إضافة E2E مع قاعدة اختبارية لتغطية التسجيل والدخول والخروج وحماية المسارات.
