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

export const MEMORY_MODE_META: Record<
  MemorySettings['mode'],
  { label: string; description: string }
> = {
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
  { word: 'السعودية', scrambled: 'سعلاةودي', hint: 'وطننا الغالي' },
  { word: 'منافسة', scrambled: 'افسمنة', hint: 'تحدٍّ بين لاعبين' },
  { word: 'صحراء', scrambled: 'ءحراص', hint: 'رمال واسعة' },
  { word: 'تاريخ', scrambled: 'راتيخ', hint: 'حكاية ما مضى' },
  { word: 'سرعة', scrambled: 'عرةس', hint: 'عكس البطء' },
  { word: 'نجمة', scrambled: 'جنةم', hint: 'تلمع في السماء' },
  { word: 'بطولة', scrambled: 'وبلةط', hint: 'منافسة تنتهي بكأس' },
  { word: 'مغامرة', scrambled: 'غمامرة', hint: 'رحلة مليئة بالمفاجآت' },
  { word: 'فريق', scrambled: 'فيرق', hint: 'لاعبون في جهة واحدة' },
  { word: 'صدارة', scrambled: 'ةرداص', hint: 'المركز الأول' },
  { word: 'إجابة', scrambled: 'اإبجة', hint: 'حل السؤال' },
  { word: 'حماس', scrambled: 'احمس', hint: 'شعور يشعل التحدّي' },
  { word: 'مكتبة', scrambled: 'تكةبم', hint: 'بيت الكتب' },
  { word: 'قهوة', scrambled: 'ةقهو', hint: 'مشروب الضيافة العربي' },
  { word: 'شاطئ', scrambled: 'طائش', hint: 'حيث يلتقي البحر بالرمل' },
  { word: 'نخلة', scrambled: 'نلةخ', hint: 'شجرة التمر' },
  { word: 'قلعة', scrambled: 'لةعق', hint: 'حصن قديم' },
  { word: 'مدرسة', scrambled: 'مرةدس', hint: 'مكان التعلم' },
  { word: 'طائرة', scrambled: 'رةاطئ', hint: 'تحلق في السماء' },
  { word: 'مفتاح', scrambled: 'مفاحت', hint: 'يفتح الأبواب' },
  { word: 'جزيرة', scrambled: 'رجةزي', hint: 'أرض يحيط بها الماء' },
  { word: 'مهرجان', scrambled: 'مجرهان', hint: 'احتفال كبير' },
  { word: 'عاصمة', scrambled: 'معاةص', hint: 'أهم مدينة في الدولة' },
  { word: 'ملعب', scrambled: 'لمبع', hint: 'ساحة المباريات' },
  { word: 'حاسوب', scrambled: 'ابوسح', hint: 'جهاز ذكي للعمل واللعب' },
  { word: 'شلال', scrambled: 'للشا', hint: 'ماء يهوي من علٍ' },
  { word: 'غيمة', scrambled: 'يةغم', hint: 'تحمل المطر' },
  { word: 'فانوس', scrambled: 'وسافن', hint: 'مصباح رمضان' },
  { word: 'خريطة', scrambled: 'خرطةي', hint: 'دليل الأماكن' },
  { word: 'متحف', scrambled: 'فحمت', hint: 'بيت الآثار' },
  { word: 'برتقال', scrambled: 'ربلقات', hint: 'فاكهة شتوية لونها اسمها' },
  { word: 'مسابقة', scrambled: 'سباةقم', hint: 'اختبار يفوز فيه الأسرع' },
  { word: 'هدية', scrambled: 'هدةي', hint: 'تُقدَّم في المناسبات' },
  { word: 'رحلة', scrambled: 'رةلح', hint: 'سفر قصير أو طويل' },
  { word: 'لغز', scrambled: 'زغل', hint: 'سؤال محيّر' },
  { word: 'ذهب', scrambled: 'هذب', hint: 'معدن أصفر ثمين' },
  { word: 'قصيدة', scrambled: 'يةدصق', hint: 'كلام موزون مقفّى' },
  { word: 'واحة', scrambled: 'وةاح', hint: 'خضرة وسط الصحراء' },
  { word: 'مرصد', scrambled: 'رصدم', hint: 'منه نراقب النجوم' },
  { word: 'سفينة', scrambled: 'فةنسي', hint: 'تمخر عباب البحر' },
] as const;

export const COLOR_RUSH_BANK = [
  { label: 'أحمر', value: '#ff5252', symbol: '▲', symbolLabel: 'مثلث' },
  { label: 'أزرق', value: '#00d4ff', symbol: '●', symbolLabel: 'دائرة' },
  { label: 'ذهبي', value: '#ffb000', symbol: '■', symbolLabel: 'مربع' },
  { label: 'أخضر', value: '#10b981', symbol: '◆', symbolLabel: 'معيّن' },
] as const;

export function isInstantGameMode(value: string): value is InstantGameMode {
  return INSTANT_GAME_ORDER.includes(value as InstantGameMode);
}
