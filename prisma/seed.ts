import { config } from 'dotenv';
import { createPrismaClient } from '@tahaddi/database';

config({ path: '.env', quiet: true });
config({ path: '.env.local', override: true, quiet: true });

const db = createPrismaClient(process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '');

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
  // ─── جغرافيا ────────────────────────────────────────────────────────────
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
    prompt: 'العراق دولة تطلّ على البحر المتوسط.',
    explanation: 'العراق لا يطلّ على البحر المتوسط؛ منفذه البحري الوحيد هو شريط ضيّق على الخليج العربي.',
    category: 'جغرافيا',
    difficulty: 'MEDIUM',
    type: 'TRUE_FALSE',
    timeLimit: 15,
    basePoints: 800,
    options: [
      { text: 'صحيح', isCorrect: false },
      { text: 'خطأ', isCorrect: true },
    ],
  },
  // ─── علوم ───────────────────────────────────────────────────────────────
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
    prompt: 'كم عدد عظام جسم الإنسان البالغ؟',
    explanation: 'يحتوي جسم الإنسان البالغ على 206 عظمة، بينما يولد الرضيع بنحو 270 عظمة تندمج مع النمو.',
    category: 'علوم',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    timeLimit: 25,
    basePoints: 1500,
    options: [
      { text: '206', isCorrect: true },
      { text: '180', isCorrect: false },
      { text: '256', isCorrect: false },
      { text: '320', isCorrect: false },
    ],
  },
  {
    prompt: 'ما هو العنصر الكيميائي الأكثر وفرةً في الغلاف الجوي للأرض؟',
    explanation: 'النيتروجين (N₂) يمثّل نحو 78 % من حجم الغلاف الجوي، يليه الأكسجين بنحو 21 %.',
    category: 'علوم',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    timeLimit: 20,
    basePoints: 1000,
    options: [
      { text: 'النيتروجين', isCorrect: true },
      { text: 'الأكسجين', isCorrect: false },
      { text: 'ثاني أكسيد الكربون', isCorrect: false },
      { text: 'الأرجون', isCorrect: false },
    ],
  },
  // ─── تاريخ ───────────────────────────────────────────────────────────────
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
    prompt: 'من هو أول خليفة في الإسلام بعد وفاة النبي ﷺ؟',
    explanation: 'أبو بكر الصديق رضي الله عنه هو أول الخلفاء الراشدين، تولّى الخلافة عام 11 هـ.',
    category: 'تاريخ',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    timeLimit: 20,
    basePoints: 1000,
    options: [
      { text: 'أبو بكر الصديق', isCorrect: true },
      { text: 'عمر بن الخطاب', isCorrect: false },
      { text: 'عثمان بن عفان', isCorrect: false },
      { text: 'علي بن أبي طالب', isCorrect: false },
    ],
  },
  {
    prompt: 'في أي عام افتتح صلاح الدين الأيوبي بيت المقدس؟',
    explanation: 'استعاد صلاح الدين الأيوبي القدس عام 583 هـ / 1187 م في معركة حطّين الشهيرة.',
    category: 'تاريخ',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    timeLimit: 30,
    basePoints: 1500,
    options: [
      { text: '1187 م', isCorrect: true },
      { text: '1099 م', isCorrect: false },
      { text: '1291 م', isCorrect: false },
      { text: '1453 م', isCorrect: false },
    ],
  },
  // ─── أدب ─────────────────────────────────────────────────────────────────
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
    prompt: 'نجيب محفوظ هو أول أديب عربي يحصل على جائزة نوبل للآداب.',
    explanation: 'حصل نجيب محفوظ على جائزة نوبل للآداب عام 1988، وهو أول وحيد أديب عربي يفوز بها حتى اليوم.',
    category: 'أدب',
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
    prompt: 'من كتب قصيدة «أنا من آمن بالإنسان»؟',
    explanation: 'القصيدة المشهورة «أنا من آمن بالإنسان» للشاعر الفلسطيني محمود درويش.',
    category: 'أدب',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    timeLimit: 30,
    basePoints: 1500,
    options: [
      { text: 'محمود درويش', isCorrect: true },
      { text: 'نزار قباني', isCorrect: false },
      { text: 'أحمد شوقي', isCorrect: false },
      { text: 'البياتي', isCorrect: false },
    ],
  },
  // ─── ثقافة إسلامية ──────────────────────────────────────────────────────
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
    prompt: 'القرآن الكريم يتكوّن من 30 جزءًا.',
    explanation: 'يُقسَّم المصحف الشريف إلى ثلاثين جزءاً متساوياً تقريباً لتيسير ختمه.',
    category: 'ثقافة إسلامية',
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
    prompt: 'كم عدد سور القرآن الكريم؟',
    explanation: 'يشتمل القرآن الكريم على 114 سورة تتفاوت في طولها بين المطوّلات كالبقرة والمقصّرات كالكوثر.',
    category: 'ثقافة إسلامية',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    timeLimit: 20,
    basePoints: 1000,
    options: [
      { text: '114', isCorrect: true },
      { text: '100', isCorrect: false },
      { text: '120', isCorrect: false },
      { text: '99', isCorrect: false },
    ],
  },
  // ─── رياضة ───────────────────────────────────────────────────────────────
  {
    prompt: 'كم عدد لاعبي فريق كرة القدم على الملعب؟',
    explanation: 'يتكوّن كل فريق من 11 لاعباً على أرض الملعب وفقاً لقوانين كرة القدم.',
    category: 'رياضة',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    timeLimit: 15,
    basePoints: 800,
    options: [
      { text: '11', isCorrect: true },
      { text: '9', isCorrect: false },
      { text: '10', isCorrect: false },
      { text: '12', isCorrect: false },
    ],
  },
  {
    prompt: 'ما هي الدولة العربية الأولى التي استضافت كأس العالم لكرة القدم؟',
    explanation: 'استضافت قطر كأس العالم FIFA 2022، وكانت أول دولة عربية وشرق أوسطية تحتضن هذا الحدث الكبير.',
    category: 'رياضة',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    timeLimit: 20,
    basePoints: 1000,
    options: [
      { text: 'قطر', isCorrect: true },
      { text: 'المغرب', isCorrect: false },
      { text: 'الإمارات', isCorrect: false },
      { text: 'السعودية', isCorrect: false },
    ],
  },
  {
    prompt: 'المنتخب السعودي لكرة القدم هزم منتخب الأرجنتين في كأس العالم 2022.',
    explanation: 'فاز المنتخب السعودي على الأرجنتين 2-1 في المجموعات بكأس العالم قطر 2022 في إحدى أكبر المفاجآت.',
    category: 'رياضة',
    difficulty: 'MEDIUM',
    type: 'TRUE_FALSE',
    timeLimit: 15,
    basePoints: 800,
    options: [
      { text: 'صحيح', isCorrect: true },
      { text: 'خطأ', isCorrect: false },
    ],
  },
  // ─── لغة وثقافة ─────────────────────────────────────────────────────────
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
