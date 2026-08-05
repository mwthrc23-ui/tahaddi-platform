export type InstantGameMode = 'memory-flash' | 'word-code' | 'color-rush';

export type InstantGameMeta = {
  mode: InstantGameMode;
  title: string;
  description: string;
  roundSeconds: number;
  minimumPlayers: number;
  contentLabel: string;
};

export const INSTANT_GAME_META: Record<InstantGameMode, InstantGameMeta> = {
  'memory-flash': {
    mode: 'memory-flash',
    title: 'ومضة الذاكرة',
    description: 'احفظ تسلسل الرموز، ثم أعده بالترتيب قبل أن تفقد محاولاتك.',
    roundSeconds: 60,
    minimumPlayers: 1,
    contentLabel: 'جولات تلقائية',
  },
  'word-code': {
    mode: 'word-code',
    title: 'شفرة الحروف',
    description: 'فكّ الحروف العربية المبعثرة مستعينًا بالتلميح، واجمع أكبر رصيد.',
    roundSeconds: 60,
    minimumPlayers: 1,
    contentLabel: 'بنك كلمات',
  },
  'color-rush': {
    mode: 'color-rush',
    title: 'خدعة الألوان',
    description: 'اقرأ لون الكلمة لا معناها، واضغط الإجابة الصحيحة بأقصى سرعة.',
    roundSeconds: 45,
    minimumPlayers: 1,
    contentLabel: 'جولات تلقائية',
  },
};

export const INSTANT_GAME_ORDER: InstantGameMode[] = ['memory-flash', 'word-code', 'color-rush'];

export const MEMORY_SYMBOL_BANK = [
  { value: '⚡', label: 'برق', color: '#facc15' },
  { value: '★', label: 'نجمة', color: '#fbbf24' },
  { value: '◆', label: 'ماسة', color: '#a78bfa' },
  { value: '●', label: 'دائرة', color: '#34d399' },
  { value: '🔥', label: 'لهب', color: '#f97316' },
  { value: '💎', label: 'جوهرة', color: '#22d3ee' },
  { value: '🌸', label: 'زهرة', color: '#fb7185' },
  { value: '🌙', label: 'قمر', color: '#c4b5fd' },
  { value: '🎯', label: 'هدف', color: '#f87171' },
  { value: '🏆', label: 'كأس', color: '#fcd34d' },
  { value: '🌈', label: 'قوس قزح', color: '#f472b6' },
  { value: '⚓', label: 'مرساة', color: '#94a3b8' },
] as const;

export type MemoryDifficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'legendary';

export type MemorySettings = {
  difficulty: MemoryDifficulty;
  mode: 'solo' | 'versus';
  previewBaseMs: number;
  previewStepMs: number;
  startingLives: number;
  totalSeconds: number;
  pointsPerSymbol: number;
};

export const MEMORY_DIFFICULTIES: Record<MemoryDifficulty, MemorySettings> = {
  easy: {
    difficulty: 'easy',
    mode: 'solo',
    previewBaseMs: 1000,
    previewStepMs: 180,
    startingLives: 5,
    totalSeconds: 90,
    pointsPerSymbol: 20,
  },
  medium: {
    difficulty: 'medium',
    mode: 'solo',
    previewBaseMs: 850,
    previewStepMs: 160,
    startingLives: 4,
    totalSeconds: 75,
    pointsPerSymbol: 25,
  },
  hard: {
    difficulty: 'hard',
    mode: 'solo',
    previewBaseMs: 700,
    previewStepMs: 140,
    startingLives: 3,
    totalSeconds: 60,
    pointsPerSymbol: 30,
  },
  expert: {
    difficulty: 'expert',
    mode: 'solo',
    previewBaseMs: 550,
    previewStepMs: 120,
    startingLives: 2,
    totalSeconds: 50,
    pointsPerSymbol: 35,
  },
  legendary: {
    difficulty: 'legendary',
    mode: 'solo',
    previewBaseMs: 400,
    previewStepMs: 100,
    startingLives: 1,
    totalSeconds: 40,
    pointsPerSymbol: 40,
  },
};

export const MEMORY_MODE_META: Record<MemorySettings['mode'], { label: string; description: string }> = {
  solo: {
    label: 'لاعب منفرد',
    description: 'تحدَّ ذاكرتك وحطّم الرقم القياسي.',
  },
  versus: {
    label: 'ضد صديق',
    description: 'تنافس مع صديق على نفس الجهاز: من يصل لمرحلة أعلى؟',
  },
};

export const WORD_CODE_BANK = [
  { word: 'السعودية', scrambled: 'دوعسلاية', hint: 'وطننا الغالي' },
  { word: 'منافسة', scrambled: 'سفانةم', hint: 'تحدٍّ بين لاعبين' },
  { word: 'صحراء', scrambled: 'ءارحص', hint: 'رمال واسعة' },
  { word: 'تاريخ', scrambled: 'خيرات', hint: 'حكاية ما مضى' },
  { word: 'سرعة', scrambled: 'عرةس', hint: 'عكس البطء' },
  { word: 'نجمة', scrambled: 'جمةن', hint: 'تلمع في السماء' },
  { word: 'بطولة', scrambled: 'لوطبة', hint: 'منافسة تنتهي بكأس' },
  { word: 'مغامرة', scrambled: 'رمةغام', hint: 'رحلة مليئة بالمفاجآت' },
  { word: 'فريق', scrambled: 'قفير', hint: 'لاعبون في جهة واحدة' },
  { word: 'صدارة', scrambled: 'رادصة', hint: 'المركز الأول' },
  { word: 'إجابة', scrambled: 'بةإجا', hint: 'حل السؤال' },
  { word: 'حماس', scrambled: 'سامح', hint: 'شعور يشعل التحدّي' },
  { word: 'تحدّي', scrambled: 'ديحت', hint: 'اسم المنصة' },
  { word: 'ذكاء', scrambled: 'كاءذ', hint: 'قدرة على الفهم السريع' },
  { word: 'لغز', scrambled: 'زغل', hint: 'سؤال يحتاج تفكيرًا' },
  { word: 'فوز', scrambled: 'زوف', hint: 'عكس الخسارة' },
  { word: 'وقت', scrambled: 'تقو', hint: 'يُقاس بالثواني' },
  { word: 'قمر', scrambled: 'رمق', hint: 'يضيء الليل' },
] as const;

export const COLOR_RUSH_BANK = [
  { label: 'أحمر', value: '#ff5252' },
  { label: 'أزرق', value: '#00d4ff' },
  { label: 'ذهبي', value: '#ffb000' },
  { label: 'أخضر', value: '#10b981' },
  { label: 'بنفسجي', value: '#a78bfa' },
  { label: 'برتقالي', value: '#fb923c' },
] as const;

export const INSTANT_GAME_HOW_TO: Record<
  InstantGameMode,
  { goal: string; steps: readonly string[]; tip: string }
> = {
  'memory-flash': {
    goal: 'احفظ تسلسل الرموز ثم أعده بالترتيب الصحيح.',
    steps: [
      'اختر الصعوبة ووضع اللعب.',
      'شاهد التسلسل أثناء العرض.',
      'أعد الضغط على الرموز بنفس الترتيب.',
      'كل مرحلة تضيف رمزًا — اجمع أعلى رصيد.',
    ],
    tip: 'ركّز على الألوان والأشكال معًا؛ التمهل أفضل من التخمين.',
  },
  'word-code': {
    goal: 'رتّب الحروف العربية المبعثرة لتكون الكلمة الصحيحة.',
    steps: [
      'اقرأ التلميح أولًا.',
      'انظر للحروف المبعثرة.',
      'اكتب الكلمة كاملة.',
      'اجمع النقاط قبل انتهاء الوقت.',
    ],
    tip: 'ابدأ بالحروف النادرة أو ال التعريف إن وُجدت.',
  },
  'color-rush': {
    goal: 'اختر لون الحبر لا معنى الكلمة المكتوبة.',
    steps: [
      'ستظهر كلمة لون بلون حبر مختلف.',
      'تجاهل معنى الكلمة.',
      'اضغط على لون الحبر الحقيقي.',
      'كل إجابة صحيحة تزيد رصيدك وسرعتك.',
    ],
    tip: 'انظر لحواف الحروف لا تقرأ الكلمة بصوت داخلي.',
  },
};

export function isInstantGameMode(value: string): value is InstantGameMode {
  return INSTANT_GAME_ORDER.includes(value as InstantGameMode);
}
