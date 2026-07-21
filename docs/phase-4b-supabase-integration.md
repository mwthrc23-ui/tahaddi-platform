# المرحلة 4B: ربط Supabase PostgreSQL

## القرار

- Supabase يستخدم هنا كـ PostgreSQL مدار فقط.
- نظام المصادقة يبقى Auth.js/NextAuth، ولا ننتقل إلى Supabase Auth.
- لا تحفظ قيم `DATABASE_URL` أو `DIRECT_URL` أو `AUTH_SECRET` أو service-role key في Git.
- لا تشغّل `migrate reset` أو `db push --force-reset`.

## الاتصال

استخدم متغيرين مختلفين:

- `DATABASE_URL`: اتصال تشغيل التطبيق. على Vercel/serverless يفضّل Supabase Session/Transaction Pooler حسب إعداد المشروع، وغالبًا Transaction Pooler على المنفذ `6543` مع `pgbouncer=true` و`sslmode=require`.
- `DIRECT_URL`: اتصال مباشر للهجرات وأوامر Prisma CLI مثل `prisma migrate status` و`prisma migrate deploy`. لا تستخدم pooler للهجرات.

`prisma.config.ts` يستخدم `DIRECT_URL` إن توفر، ثم يرجع إلى `DATABASE_URL` فقط للتطوير المحلي.

## Vercel

اضبط المشروع كـ Node/Next.js، وليس GitHub Pages:

- `TAHADDI_DEPLOY_TARGET=node`
- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `AUTH_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

لا تضف `SUPABASE_SERVICE_ROLE_KEY` إلا إذا احتجته في مسار server-only واضح.

## الهجرات

الأوامر الآمنة:

```bash
pnpm db:generate
pnpm db:validate
pnpm exec prisma migrate status
pnpm db:migrate:deploy
```

لا تشغّل `pnpm db:migrate:deploy` على الإنتاج إلا بعد تأكيد صريح ومراجعة `migrate status`.

إذا كانت الجداول أُنشئت يدويًا من SQL Editor، فقد يعرض `prisma migrate status` أن migration غير مطبق لأن جدول Prisma `_prisma_migrations` لا يعرف التنفيذ اليدوي. لا تعالج ذلك تلقائيًا على الإنتاج. بعد فحص الجداول والتأكد أن SQL مطابق للملف، يمكن تشغيل `prisma migrate resolve --applied <migration_name>` بتأكيد صريح فقط.

## الاختبارات

- `pnpm test` يغطي اختبارات الوحدة الآمنة دون اتصال حقيقي.
- `pnpm --filter @tahaddi/web test:e2e` يغطي صفحات المصادقة وحماية `dashboard/profile`.
- اختبار التسجيل/الدخول/الخروج الحقيقي guarded ولا يعمل إلا عند `RUN_AUTH_E2E=true` ومع قاعدة اختبارية قابلة للرمي.

## مراجع

- Supabase connection modes: https://supabase.com/docs/guides/database/connecting-to-postgres
- Supabase Prisma troubleshooting: https://supabase.com/docs/guides/database/prisma/prisma-troubleshooting
- Prisma PgBouncer guidance: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/pgbouncer
