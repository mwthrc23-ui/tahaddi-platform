# تحدّي

منصة عربية للمسابقات والألعاب والأسئلة المباشرة. يضم المستودع البنية التقنية ونظام تصميم عربي RTL وشاشات واجهة تجريبية، دون تنفيذ المصادقة أو منطق المسابقات بعد.

## المتطلبات

- Node.js 20.19 أو 22.12 أو 24 فأحدث ضمن الإصدارات المدعومة من Prisma 7.
- pnpm 11.
- Docker Desktop مع Docker Compose.

## بدء التشغيل محليًا

1. انسخ `.env.example` إلى `.env` وعدّل القيم المحلية عند الحاجة.
2. ثبّت الحزم: `pnpm install`.
3. شغّل PostgreSQL وRedis: `pnpm infra:up`.
4. تحقق من Prisma: `pnpm db:validate` ثم `pnpm db:generate`.
5. شغّل التطبيقين: `pnpm dev`.

الواجهة تعمل افتراضيًا على `http://localhost:3000`، وفحص خدمة الزمن الحقيقي على `http://localhost:3001/health`.

صفحة مرجع الواجهة متاحة في `/design-system`، والشاشات التجريبية في `/demo/waiting` و`/demo/question` و`/demo/results` و`/demo/winners`.

## الأوامر

| الأمر               | الوظيفة                           |
| ------------------- | --------------------------------- |
| `pnpm dev`          | تشغيل الواجهة وخدمة الزمن الحقيقي |
| `pnpm build`        | بناء جميع الحزم والتطبيقات        |
| `pnpm lint`         | فحص ESLint دون تعديل الملفات      |
| `pnpm typecheck`    | فحص TypeScript الصارم             |
| `pnpm test`         | تشغيل الاختبارات الحالية          |
| `pnpm --filter @tahaddi/web test:e2e` | تشغيل اختبارات الواجهة التجريبية |
| `pnpm format:check` | فحص تنسيق Prettier                |
| `pnpm db:validate`  | التحقق من مخطط Prisma             |
| `pnpm db:generate`  | توليد عميل Prisma                 |
| `pnpm infra:up`     | تشغيل PostgreSQL وRedis           |
| `pnpm infra:down`   | إيقاف الخدمات المحلية             |

## هيكل المستودع

```text
apps/
  web/          Next.js App Router وواجهة RTL
  realtime/     NestJS وخدمة الاتصالات الطويلة
packages/
  config/       اسم المنتج والإعدادات المشتركة
  contracts/    عقود الأنواع بين الواجهة والخادم
  domain/       أنواع ومنطق النطاق المشترك
  database/     Prisma Client ومحول PostgreSQL
prisma/         المخطط والمهاجرات وملف seed
docs/           وثائق المرحلة الأولى
```

## نظام التصميم

- الهوية والنصوص المركزية: `apps/web/src/config/site.ts`.
- روابط التنقل: `apps/web/src/config/navigation.ts`.
- الألوان والمسافات والحواف والثيم: `apps/web/src/app/globals.css`.
- المكوّنات العامة: `apps/web/src/components/ui`.
- مكوّنات المسابقات: `apps/web/src/components/quiz`.
- الدليل الكامل وقواعد RTL والوصولية: `docs/design-system.md`.

لتغيير الهوية حدّث `site.ts`. لتغيير لون عدّل متغير CSS الدلالي في الوضعين الداكن والفاتح، ولا تستخدم لونًا ثابتًا داخل المكوّن. عند إضافة مكوّن جديد عرّف Props واضحة، أضف حالات الوصولية والاختبار، ثم اعرضه في `/design-system`.

## الخدمات المحلية

- PostgreSQL هو مصدر الحقيقة للبيانات الدائمة.
- Redis مخصص للحالة اللحظية والتنسيق، وليس سجل النتائج النهائي.
- لا يحتوي المستودع على أسرار. ملف `.env` محلي ومهمل من Git.

## حالة المراحل

- [x] المرحلة الأولى: التحليل والتخطيط.
- [x] المرحلة الثانية: تأسيس المشروع.
- [x] المرحلة الثالثة: نظام التصميم والواجهة الأساسية.
- [ ] المراحل الوظيفية اللاحقة.

راجع `docs/product-requirements.md` للنطاق ومعايير القبول و`docs/architecture.md` للقرارات التقنية.
نتائج التنفيذ والتحقق موثقة في `docs/phase-2-report.md`.
مرجع المرحلة الثالثة في `docs/design-system.md`.
