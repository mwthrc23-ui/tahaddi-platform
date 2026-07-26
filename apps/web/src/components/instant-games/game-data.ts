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

export function isInstantGameMode(value: string): value is InstantGameMode {
  return value === 'memory-flash' || value === 'word-code' || value === 'color-rush';
}
