import { APP_CONFIG } from '@tahaddi/config';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-semibold text-slate-500">المرحلة الثانية</p>
      <h1 className="text-4xl font-bold tracking-tight">{APP_CONFIG.name}</h1>
      <p className="mt-4 text-lg leading-8 text-slate-600">
        اكتمل تأسيس المشروع. يبدأ بناء نظام التصميم في المرحلة التالية.
      </p>
    </main>
  );
}
