export const competitions = [
  { id: 'arab-cup', title: 'كأس المعرفة العربية', category: 'ثقافة عامة', players: 248, status: 'live' as const, questions: 20 },
  { id: 'science', title: 'تحدّي العلوم', category: 'علوم', players: 96, status: 'soon' as const, questions: 15 },
  { id: 'history', title: 'ذاكرة التاريخ', category: 'تاريخ', players: 154, status: 'waiting' as const, questions: 18 },
];

export const games = [
  { title: 'دقيقة ذكاء', description: 'عشرة أسئلة سريعة في ستين ثانية', icon: '⚡' },
  { title: 'صح أم خطأ', description: 'اختبر حدسك ومعلوماتك في جولة خاطفة', icon: '✓' },
  { title: 'رتّبها', description: 'ضع الأحداث والعناصر في ترتيبها الصحيح', icon: '↕' },
];

export const categories = [
  { title: 'تاريخ', count: 128, emoji: '🏺' }, { title: 'علوم', count: 96, emoji: '🧪' },
  { title: 'رياضة', count: 84, emoji: '🏆' }, { title: 'تقنية', count: 72, emoji: '💻' },
];

export const players = [
  { id: '1', name: 'سارة العتيبي', initials: 'س ع', score: 9840, rank: 1, change: 2, streak: 8, online: true, ready: true, joinedAt: 'منذ دقيقة' },
  { id: '2', name: 'محمد القحطاني', initials: 'م ق', score: 9320, rank: 2, change: -1, streak: 6, online: true, ready: true, joinedAt: 'منذ دقيقتين' },
  { id: '3', name: 'نورة الحربي', initials: 'ن ح', score: 8970, rank: 3, change: 1, streak: 5, online: true, ready: false, joinedAt: 'الآن' },
  { id: '4', name: 'خالد الدوسري', initials: 'خ د', score: 8210, rank: 4, change: 0, streak: 4, online: false, ready: true, joinedAt: 'منذ ٣ دقائق' },
  { id: '5', name: 'ريم المطيري', initials: 'ر م', score: 7880, rank: 5, change: 3, streak: 3, online: true, ready: true, joinedAt: 'منذ ٤ دقائق' },
];

export const question = {
  number: 4, total: 10, text: 'ما هي أكبر دولة عربية من حيث المساحة؟', type: 'اختيار من متعدد',
  difficulty: 'متوسط', points: 1000, time: 20, category: 'جغرافيا', status: 'مفتوح',
  answers: [
    { id: 'a', label: 'A' as const, text: 'المملكة العربية السعودية', percentage: 18 },
    { id: 'b', label: 'B' as const, text: 'الجزائر', percentage: 64 },
    { id: 'c', label: 'C' as const, text: 'السودان', percentage: 11 },
    { id: 'd', label: 'D' as const, text: 'مصر', percentage: 7 },
  ],
};
