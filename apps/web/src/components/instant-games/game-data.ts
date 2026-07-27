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
  { value: '⚡', label: 'برق' },
  { value: '★', label: 'نجمة' },
  { value: '◆', label: 'ماسة' },
  { value: '●', label: 'دائرة' },
] as const;

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
] as const;

export const COLOR_RUSH_BANK = [
  { label: 'أحمر', value: '#ff5252' },
  { label: 'أزرق', value: '#00d4ff' },
  { label: 'ذهبي', value: '#ffb000' },
  { label: 'أخضر', value: '#10b981' },
] as const;

export function isInstantGameMode(value: string): value is InstantGameMode {
  return INSTANT_GAME_ORDER.includes(value as InstantGameMode);
}
