import { config } from 'dotenv';
import { createPrismaClient } from '@tahaddi/database';

config({ path: '.env', quiet: true });
config({ path: '.env.local', override: true, quiet: true });

const db = createPrismaClient(process.env.DATABASE_URL ?? '');

type SeedQuestion = {
  prompt: string;
  explanation: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  timeLimit: number;
  basePoints: number;
  options: { text: string; isCorrect: boolean }[];
};

const questions: SeedQuestion[] = [
  {
    prompt: 'ما هي عاصمة المملكة العربية السعودية؟',
    explanation: 'الرياض هي العاصمة وأكبر مدن المملكة العربية السعودية.',
    category: 'جغرافيا',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    timeLimit: 20,
    basePoints: 1000,
    options: [
      { text: 'الرياض', isCorrect: true },
      { text: 'جدة', isCorrect: false },
      { text: 'الدمام', isCorrect: false },
      { text: 'مكة المكرمة', isCorrect: false },
    ],
  },
  {
    prompt: 'ما هي أكبر دولة عربية من حيث المساحة؟',
    explanation: 'الجزائر هي أكبر دولة عربية وإفريقية من حيث المساحة بما يزيد على 2.3 مليون كيلومتر مربع.',
    category: 'جغرافيا',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    timeLimit: 20,
    basePoints: 1000,
    options: [
      { text: 'المملكة العربية السعودية', isCorrect: false },
      { text: 'الجزائر', isCorrect: true },
      { text: 'السودان', isCorrect: false },
      { text: 'مصر', isCorrect: false },
    ],
  },
  {
    prompt: 'كم عدد أركان الإسلام؟',
    explanation: 'أركان الإسلام خمسة: الشهادتان، الصلاة، الزكاة، الصوم، والحج.',
    category: 'ثقافة إسلامية',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    timeLimit: 15,
    basePoints: 1000,
    options: [
      { text: 'خمسة', isCorrect: true },
      { text: 'أربعة', isCorrect: false },
      { text: 'ستة', isCorrect: false },
      { text: 'ثلاثة', isCorrect: false },
    ],
  },
  {
    prompt: 'الماء يتكوّن من عنصري الهيدروجين والأكسجين.',
    explanation: 'صيغة الماء H₂O: ذرتا هيدروجين وذرة أكسجين واحدة.',
    category: 'علوم',
    difficulty: 'EASY',
    type: 'TRUE_FALSE',
    timeLimit: 15,
    basePoints: 800,
    options: [
      { text: 'صحيح', isCorrect: true },
      { text: 'خطأ', isCorrect: false },
    ],
  },
  {
    prompt: 'من هو مؤلف رواية «مدن الملح»؟',
    explanation: 'عبد الرحمن منيف هو مؤلف الخماسية الروائية «مدن الملح».',
    category: 'أدب',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    timeLimit: 25,
    basePoints: 1000,
    options: [
      { text: 'عبد الرحمن منيف', isCorrect: true },
      { text: 'نجيب محفوظ', isCorrect: false },
      { text: 'غسان كنفاني', isCorrect: false },
      { text: 'الطيب صالح', isCorrect: false },
    ],
  },
  {
    prompt: 'ما أطول نهر في العالم؟',
    explanation: 'يُعدّ نهر النيل تقليدياً أطول أنهار العالم بطول يقارب 6650 كم.',
    category: 'جغرافيا',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    timeLimit: 20,
    basePoints: 1000,
    options: [
      { text: 'نهر النيل', isCorrect: true },
      { text: 'نهر الأمازون', isCorrect: false },
      { text: 'نهر اليانغتسي', isCorrect: false },
      { text: 'نهر المسيسيبي', isCorrect: false },
    ],
  },
  {
    prompt: 'في أي عام هجري وقعت غزوة بدر الكبرى؟',
    explanation: 'وقعت غزوة بدر في السنة الثانية للهجرة (2 هـ).',
    category: 'تاريخ',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    timeLimit: 30,
    basePoints: 1500,
    options: [
      { text: 'السنة الثانية', isCorrect: true },
      { text: 'السنة الأولى', isCorrect: false },
      { text: 'السنة الثالثة', isCorrect: false },
      { text: 'السنة الخامسة', isCorrect: false },
    ],
  },
  {
    prompt: 'ما هو أكبر كوكب في المجموعة الشمسية؟',
    explanation: 'كوكب المشتري هو أكبر كواكب المجموعة الشمسية، وكتلته تعادل أكثر من ضعفَي بقية الكواكب مجتمعة.',
    category: 'علوم',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    timeLimit: 15,
    basePoints: 800,
    options: [
      { text: 'المشتري', isCorrect: true },
      { text: 'زحل', isCorrect: false },
      { text: 'الشمس', isCorrect: false },
      { text: 'أورانوس', isCorrect: false },
    ],
  },
  {
    prompt: 'اللغة العربية هي اللغة الرسمية لأكثر من 20 دولة.',
    explanation: 'اللغة العربية لغة رسمية في 22 دولة، وهي إحدى اللغات الست الرسمية للأمم المتحدة.',
    category: 'لغة وثقافة',
    difficulty: 'EASY',
    type: 'TRUE_FALSE',
    timeLimit: 15,
    basePoints: 800,
    options: [
      { text: 'صحيح', isCorrect: true },
      { text: 'خطأ', isCorrect: false },
    ],
  },
  {
    prompt: 'ما هي عاصمة دولة الإمارات العربية المتحدة؟',
    explanation: 'أبوظبي هي عاصمة دولة الإمارات العربية المتحدة، وإن كانت دبي أكثر شهرة عالمياً.',
    category: 'جغرافيا',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    timeLimit: 20,
    basePoints: 1000,
    options: [
      { text: 'أبوظبي', isCorrect: true },
      { text: 'دبي', isCorrect: false },
      { text: 'الشارقة', isCorrect: false },
      { text: 'عجمان', isCorrect: false },
    ],
  },
];

async function main() {
  const owner = await db.user.upsert({
    where: { email: 'seed@tahaddi.local' },
    update: {},
    create: {
      email: 'seed@tahaddi.local',
      name: 'محتوى تحدّي',
      role: 'ADMIN',
    },
  });

  for (const q of questions) {
    await db.question.create({
      data: {
        ownerId: owner.id,
        type: q.type,
        status: 'PUBLISHED',
        difficulty: q.difficulty,
        prompt: q.prompt,
        explanation: q.explanation,
        category: q.category,
        source: 'seed',
        timeLimit: q.timeLimit,
        basePoints: q.basePoints,
        options: {
          create: q.options.map((o, i) => ({
            position: i,
            text: o.text,
            isCorrect: o.isCorrect,
          })),
        },
      },
    });
  }

  console.info(`✓ تمت إضافة ${questions.length} سؤالًا إلى بنك الأسئلة.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void db.$disconnect());
