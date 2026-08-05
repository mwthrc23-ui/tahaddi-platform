import type { MafiaRoleName } from './rules';

export type MafiaPhaseName = 'LOBBY' | 'NIGHT' | 'DAY' | 'VOTING' | 'FINISHED';

export type MafiaMission = {
  title: string;
  summary: string;
  steps: readonly string[];
};

export type MafiaRoleGuide = {
  objective: string;
  identity: string;
  privacy: string;
  missions: Record<'NIGHT' | 'DAY' | 'VOTING', MafiaMission>;
};

export const mafiaRoleGuides: Record<MafiaRoleName, MafiaRoleGuide> = {
  KILLER: {
    identity: 'أنت ضمن فريق القتلة وتعرف زملاءك من خلال القناة السرية.',
    objective: 'أخرج المواطنين واحدًا تلو الآخر حتى يصبح عدد القتلة مساويًا لعدد الباقين.',
    privacy: 'لا تذكر دورك أو أسماء زملائك، وحاول الظهور كمواطن يبحث عن الحقيقة.',
    missions: {
      NIGHT: {
        title: 'اختر ضحية الليل',
        summary: 'نسّق مع القتلة في القناة السرية ثم ثبّت اختيار لاعب غير قاتل.',
        steps: [
          'اقرأ اقتراحات زملائك في قناة القتلة.',
          'اختر لاعبًا واحدًا من قائمة الأحياء.',
          'اضغط «تثبيت قرار الليل» قبل انتهاء المؤقت.',
        ],
      },
      DAY: {
        title: 'أبعد الشبهة عن فريقك',
        summary: 'شارك في النقاش بصورة طبيعية ووجّه التحليل بعيدًا عن القتلة.',
        steps: [
          'استمع للأدلة قبل الرد.',
          'اطرح تفسيرًا مقنعًا دون الدفاع المباشر عن زميلك.',
          'جهّز اسم المشتبه الذي ستصوّت ضده.',
        ],
      },
      VOTING: {
        title: 'صوّت لمصلحة فريق القتلة',
        summary: 'اختر مواطنًا أو لاعبًا يهدد فريقك، ولا تصوّت لنفسك.',
        steps: ['راجع اتجاه النقاش.', 'اختر الهدف من القائمة.', 'ثبّت صوتك قبل الصفر.'],
      },
    },
  },
  DETECTIVE: {
    identity: 'أنت المحقق، وتستطيع كشف ما إذا كان لاعب واحد من القتلة كل ليلة.',
    objective: 'اجمع نتائج مؤكدة وساعد المواطنين على طرد القتلة دون أن تصبح هدفًا سهلًا.',
    privacy: 'نتيجة التحقيق تظهر لك وحدك في «معلومة خاصة». اكشفها في الوقت المناسب فقط.',
    missions: {
      NIGHT: {
        title: 'تحقق من لاعب واحد',
        summary: 'اختر اللاعب الأكثر إثارة للشك، وستصلك نتيجة سرية بعد تثبيت القرار.',
        steps: [
          'اختر لاعبًا حيًا لم تتحقق منه سابقًا.',
          'اضغط «تثبيت قرار الليل».',
          'احتفظ بالنتيجة لتستخدمها في نقاش النهار.',
        ],
      },
      DAY: {
        title: 'حوّل التحقيق إلى دليل',
        summary: 'وجّه النقاش نحو نتيجتك من غير أن تكشف دورك مبكرًا.',
        steps: [
          'قارن النتيجة بسلوك اللاعب في النقاش.',
          'اطرح أسئلة تكشف تناقضاته.',
          'اكشف أنك المحقق فقط عندما تكون الفائدة أكبر من الخطر.',
        ],
      },
      VOTING: {
        title: 'صوّت بناءً على التحقيق',
        summary: 'قدّم الأولوية للاعب الذي ثبت أنه قاتل، وإلا اتبع أقوى دليل متاح.',
        steps: ['اختر المشتبه الأقوى.', 'ثبّت صوتك.', 'لا تكشف معلومات إضافية بعد انتهاء الوقت.'],
      },
    },
  },
  DOCTOR: {
    identity: 'أنت الطبيب، ويمكنك إنقاذ لاعب واحد من محاولة القتل في كل ليلة.',
    objective: 'أبقِ الشخصيات المهمة والمواطنين أحياء لأطول وقت ممكن.',
    privacy: 'لا تعلن من حميته؛ معرفة القتلة بخطتك تساعدهم على تجاوز الحماية.',
    missions: {
      NIGHT: {
        title: 'اختر من ستحميه',
        summary: 'اختر لاعبًا واحدًا تتوقع أن يستهدفه القتلة، ويمكنك اختيار نفسك.',
        steps: [
          'قدّر من لفت انتباه القتلة في النهار.',
          'اختره من قائمة الأحياء.',
          'ثبّت الحماية قبل انتهاء المؤقت.',
        ],
      },
      DAY: {
        title: 'راقب أثر الحماية',
        summary: 'إذا لم يخرج أحد فقد تكون الحماية نجحت، لكن لا تكشف ذلك مباشرة.',
        steps: [
          'تابع رسالة نتيجة الليل.',
          'راقب من يدّعي أدوارًا مهمة.',
          'استخدم المعلومة لتحديد حماية الليلة القادمة.',
        ],
      },
      VOTING: {
        title: 'صوّت كمواطن',
        summary: 'اختر اللاعب الأكثر احتمالًا أن يكون قاتلًا مع الحفاظ على سرية دورك.',
        steps: ['راجع الأدلة.', 'اختر المشتبه.', 'ثبّت صوتك قبل الصفر.'],
      },
    },
  },
  GUARD: {
    identity: 'أنت الحارس، وتحمي لاعبًا آخر من محاولة القتل أثناء الليل.',
    objective: 'احمِ الشخصيات الأكثر فائدة للمواطنين وساعدهم على الوصول إلى القتلة.',
    privacy: 'لا يمكنك حماية نفسك، ولا ينبغي أن تعلن هدف الحماية مسبقًا.',
    missions: {
      NIGHT: {
        title: 'احمِ لاعبًا آخر',
        summary: 'اختر لاعبًا حيًا غيرك تتوقع أن يكون مستهدفًا هذه الليلة.',
        steps: [
          'استبعد اسمك من الحسابات.',
          'اختر لاعبًا مهمًا أو معرضًا للخطر.',
          'ثبّت الحماية قبل انتهاء المؤقت.',
        ],
      },
      DAY: {
        title: 'حدد من يستحق الحماية',
        summary: 'راقب من يقدم أدلة مفيدة ومن يتعرض لتهديد القتلة.',
        steps: ['دوّن أقوى المتحدثين.', 'راقب محاولات إسكاتهم أو اتهامهم.', 'لا تكشف أنك الحارس.'],
      },
      VOTING: {
        title: 'ساعد المواطنين بصوتك',
        summary: 'صوّت ضد أقوى مشتبه مع تجنب كشف الشخص الذي تنوي حمايته.',
        steps: ['اختر المشتبه.', 'ثبّت الصوت.', 'استعد لاختيار حماية جديدة ليلًا.'],
      },
    },
  },
  WITNESS: {
    identity: 'أنت الشاهد، ويصلك بعد الليل دليل مختصر يساعدك على تضييق دائرة القتلة.',
    objective: 'اربط الأدلة المتتابعة بسلوك اللاعبين وقد المواطنين نحو القرار الصحيح.',
    privacy: 'دليلك ليس كشفًا كاملًا؛ لا تبالغ في اليقين ولا تكشف دورك دون ضرورة.',
    missions: {
      NIGHT: {
        title: 'انتظر دليل الجولة',
        summary: 'ليس لديك اختيار ليلي؛ راقب المؤقت وستظهر المعلومة السرية بعد نهاية الليل.',
        steps: [
          'لا ترسل قرارًا ليليًا.',
          'انتظر انتقال اللعبة إلى النهار.',
          'اقرأ «معلومة خاصة» الجديدة بعناية.',
        ],
      },
      DAY: {
        title: 'فسّر الدليل بحذر',
        summary: 'قارن الدليل بأسماء الأحياء وكلامهم ثم وجّه النقاش بأسئلة محددة.',
        steps: [
          'احصر اللاعبين الذين ينطبق عليهم الدليل.',
          'قارن سلوكهم في الجولات.',
          'اطرح أسئلة تكشف التناقض من دون إعلان دورك.',
        ],
      },
      VOTING: {
        title: 'صوّت لأقوى تطابق',
        summary: 'اختر اللاعب الذي تجمع عليه الدليل والسلوك، لا الدليل وحده.',
        steps: ['وازن الدليل مع النقاش.', 'اختر المشتبه.', 'ثبّت الصوت قبل الصفر.'],
      },
    },
  },
  CITIZEN: {
    identity: 'أنت مواطن بلا قدرة سرية، لكن النقاش والتصويت هما أقوى أدواتك.',
    objective: 'اكتشف القتلة من أقوالهم وتصويتاتهم وساعد فريق المواطنين على طردهم.',
    privacy: 'لا تدّعِ امتلاك معلومة سرية؛ ركّز على الملاحظة والمنطق.',
    missions: {
      NIGHT: {
        title: 'انتظر نهاية الليل',
        summary: 'ليس لديك إجراء ليلي. لا ترسل اختيارًا وانتظر إعلان نتيجة الليل.',
        steps: [
          'راجع ما حدث في النهار السابق.',
          'راقب المؤقت حتى نهاية المرحلة.',
          'استعد لمناقشة التناقضات عند الصباح.',
        ],
      },
      DAY: {
        title: 'حلّل واسأل',
        summary: 'ناقش الأدلة وراقب من يغيّر قصته أو يدافع بلا سبب واضح.',
        steps: [
          'اسأل كل مشتبه عن سبب تصويته.',
          'قارن كلامه بالجولات السابقة.',
          'اختر مشتبهًا واحدًا واذكر سببك بوضوح.',
        ],
      },
      VOTING: {
        title: 'حوّل تحليلك إلى صوت',
        summary: 'اختر أقوى مشتبه ولا تترك التصويت حتى اللحظة الأخيرة.',
        steps: ['راجع السبب النهائي.', 'اختر اللاعب.', 'ثبّت صوتك قبل انتهاء المؤقت.'],
      },
    },
  },
};

export const mafiaPhaseGuides: Record<
  MafiaPhaseName,
  { summary: string; next: string; hostTask: string }
> = {
  LOBBY: {
    summary: 'ينضم اللاعبون وتبقى الأدوار مخفية حتى يبدأ المضيف.',
    next: 'الليل الأول',
    hostTask: 'شارك رمز الغرفة وابدأ بعد انضمام خمسة لاعبين على الأقل.',
  },
  NIGHT: {
    summary: 'تنفذ الأدوار السرية قراراتها، بينما ينتظر بقية اللاعبين.',
    next: 'النهار وإعلان نتيجة الليل',
    hostTask: 'دع المؤقت يعمل وتابع اكتمال القرارات السرية من دون كشفها.',
  },
  DAY: {
    summary: 'يناقش الجميع نتيجة الليل والأدلة والشكوك في القناة العامة.',
    next: 'التصويت',
    hostTask: 'حافظ على تركيز النقاش واترك لكل مشتبه فرصة قصيرة للرد.',
  },
  VOTING: {
    summary: 'يثبت كل لاعب حي صوته ضد مشتبه واحد قبل انتهاء الوقت.',
    next: 'الليل التالي أو إعلان الفائز',
    hostTask: 'ذكّر اللاعبين بتثبيت أصواتهم واترك النظام يحسم النتيجة.',
  },
  FINISHED: {
    summary: 'انتهت اللعبة وكُشفت الأدوار والجهة الفائزة.',
    next: 'لعبة جديدة',
    hostTask: 'راجع الأدوار والقرارات مع اللاعبين ثم ابدأ غرفة جديدة عند الرغبة.',
  },
};

export function getMafiaMission(
  role: MafiaRoleName,
  phase: MafiaPhaseName,
  eliminated = false,
): MafiaMission {
  if (eliminated) {
    return {
      title: 'تابع اللعبة من قناة المستبعدين',
      summary: 'انتهى تأثيرك في القرارات، لكن يمكنك متابعة المراحل من دون كشف الأسرار للأحياء.',
      steps: [
        'لا ترسل تصويتًا أو قرارًا.',
        'استخدم قناة المستبعدين فقط.',
        'انتظر كشف الأدوار عند نهاية اللعبة.',
      ],
    };
  }
  if (phase === 'LOBBY') {
    return {
      title: 'استعد لظهور دورك',
      summary: 'انتظر بدء المضيف، ثم اقرأ بطاقتك السرية قبل تنفيذ أي قرار.',
      steps: ['لا تغادر الصفحة.', 'لا تشارك رابطك الخاص.', 'افتح بطاقتك بعيدًا عن الآخرين.'],
    };
  }
  if (phase === 'FINISHED') {
    return {
      title: 'راجع نتيجة اللعبة',
      summary: 'كُشفت الأدوار الآن؛ راجع القرارات التي غيّرت النتيجة.',
      steps: ['راجع الفريق الفائز.', 'قارن الأدوار بالتوقعات.', 'ناقش أفضل الأدلة بعد النهاية.'],
    };
  }
  return mafiaRoleGuides[role].missions[phase];
}

/** Public-facing role blurb safe to show before the game starts. */
export type MafiaRoleCatalogEntry = {
  role: MafiaRoleName;
  label: string;
  team: 'KILLERS' | 'CITIZENS';
  teamLabel: string;
  summary: string;
  ability: string;
  unlockAt: number;
};

export const mafiaRoleCatalog: readonly MafiaRoleCatalogEntry[] = [
  {
    role: 'KILLER',
    label: 'القاتل',
    team: 'KILLERS',
    teamLabel: 'فريق القتلة',
    summary: 'يقضي على المواطنين ليلًا ويتظاهر بالنهار أنه بريء.',
    ability: 'اختيار ضحية واحدة كل ليلة مع زملائه عبر قناة سرية.',
    unlockAt: 5,
  },
  {
    role: 'DETECTIVE',
    label: 'المحقق',
    team: 'CITIZENS',
    teamLabel: 'فريق المواطنين',
    summary: 'يكشف ليلًا إن كان لاعب واحد قاتلًا أم لا.',
    ability: 'نتيجة التحقيق تظهر له وحده في «معلومة خاصة».',
    unlockAt: 5,
  },
  {
    role: 'DOCTOR',
    label: 'الطبيب',
    team: 'CITIZENS',
    teamLabel: 'فريق المواطنين',
    summary: 'يحمي لاعبًا واحدًا من محاولة القتل كل ليلة.',
    ability: 'يمكنه حماية نفسه أو أي لاعب حي.',
    unlockAt: 5,
  },
  {
    role: 'GUARD',
    label: 'الحارس',
    team: 'CITIZENS',
    teamLabel: 'فريق المواطنين',
    summary: 'يحمي لاعبًا آخر من محاولة القتل أثناء الليل.',
    ability: 'لا يستطيع حماية نفسه؛ متاح من ٧ لاعبين.',
    unlockAt: 7,
  },
  {
    role: 'WITNESS',
    label: 'الشاهد',
    team: 'CITIZENS',
    teamLabel: 'فريق المواطنين',
    summary: 'يحصل بعد كل ليل على دليل مختصر عن أحد القتلة.',
    ability: 'دليل جزئي فقط؛ متاح من ٨ لاعبين.',
    unlockAt: 8,
  },
  {
    role: 'CITIZEN',
    label: 'مواطن',
    team: 'CITIZENS',
    teamLabel: 'فريق المواطنين',
    summary: 'بلا قدرة سرية؛ يعتمد على النقاش والتصويت.',
    ability: 'الملاحظة والمنطق هما أقوى أدواته.',
    unlockAt: 5,
  },
] as const;

export const mafiaHowToPlaySteps = [
  {
    title: 'انضم للغرفة',
    detail: 'اكتب اسمك ورمز الغرفة. لا تحتاج حسابًا.',
  },
  {
    title: 'اقرأ دورك سرًا',
    detail: 'عند البدء تظهر بطاقتك لك وحدك. لا تصوّر الشاشة ولا تُظهرها.',
  },
  {
    title: 'نفّذ مهمة المرحلة',
    detail: 'ليلًا: قرار سري إن وُجد. نهارًا: نقاش. ثم صوّت لطرد مشتبه.',
  },
  {
    title: 'كرر حتى الفوز',
    detail: 'تستمر الدورة حتى يفوز القتلة أو المواطنون.',
  },
] as const;

export const mafiaWinConditions = {
  citizens: {
    title: 'فوز المواطنين',
    detail: 'يطردون كل القتلة بالتصويت قبل أن يتساوى العددان.',
  },
  killers: {
    title: 'فوز القتلة',
    detail: 'يصل عدد القتلة الأحياء إلى عدد المواطنين الأحياء أو يزيد عليه.',
  },
} as const;

export const mafiaBeginnerTips = [
  'لا تكشف دورك مبكرًا إلا إذا كانت الفائدة أكبر من الخطر.',
  'اسأل كل مشتبه: لماذا صوّت بهذا الاتجاه؟ التناقض دليل.',
  'القتلة يسمعون بعضهم ليلًا فقط؛ النهار قناة عامة للجميع.',
  'إذا خرجت من اللعبة تابع من قناة المستبعدين دون كشف الأسرار.',
  'ثبّت قرار الليل أو الصوت قبل انتهاء المؤقت؛ النظام لا ينتظر.',
] as const;

export const mafiaNightActionLabels: Partial<
  Record<MafiaRoleName, { choose: string; confirm: string; confirmed: string }>
> = {
  KILLER: {
    choose: 'اختر الضحية',
    confirm: 'تثبيت قرار القتل',
    confirmed: 'تم تثبيت ضحية الليل',
  },
  DETECTIVE: {
    choose: 'تحقق من لاعب',
    confirm: 'تثبيت التحقيق',
    confirmed: 'تم تثبيت هدف التحقيق',
  },
  DOCTOR: {
    choose: 'اختر من ستحميه',
    confirm: 'تثبيت الحماية',
    confirmed: 'تم تثبيت الحماية',
  },
  GUARD: {
    choose: 'احمِ لاعبًا آخر',
    confirm: 'تثبيت الحراسة',
    confirmed: 'تم تثبيت الحراسة',
  },
};

export const mafiaTeamLabels = {
  KILLERS: 'فريق القتلة',
  CITIZENS: 'فريق المواطنين',
} as const;

export function getMafiaTeam(role: MafiaRoleName): 'KILLERS' | 'CITIZENS' {
  return role === 'KILLER' ? 'KILLERS' : 'CITIZENS';
}

export type MafiaPublicOutcomeKind =
  | 'night-kill'
  | 'night-safe'
  | 'night-no-victim'
  | 'vote-out'
  | 'vote-tie';

export type MafiaPublicOutcome = {
  kind: MafiaPublicOutcomeKind;
  body: string;
  victimName: string | null;
  title: string;
};

const NAMED_OUTCOME_PATTERN = /«([^»]+)»/;

export function formatNightKillMessage(victimName: string) {
  return `نتيجة الليل: تم قتل الضحية «${victimName}». ابدأوا النقاش لمعرفة من القاتل.`;
}

export function formatNightSavedMessage() {
  return 'نتيجة الليل: لم يُقتل أحد — الحماية أنقذت الضحية المستهدفة.';
}

export function formatNightNoVictimMessage() {
  return 'نتيجة الليل: لم يُقتل أحد — لم يتفق القتلة أو لم يُنفَّذ قرار.';
}

export function formatVoteOutMessage(victimName: string) {
  return `نتيجة التصويت: تم استبعاد «${victimName}» من اللعبة. الأدوار تبقى سرية حتى النهاية.`;
}

export function formatVoteTieMessage() {
  return 'نتيجة التصويت: تعادل — لم يُستبعد أحد. يستمر الليل التالي بنفس العدد.';
}

export function parseMafiaSystemOutcome(body: string): MafiaPublicOutcome | null {
  const named = body.match(NAMED_OUTCOME_PATTERN)?.[1] ?? null;

  if (body.startsWith('نتيجة الليل: تم قتل الضحية')) {
    return {
      kind: 'night-kill',
      body,
      victimName: named,
      title: named ? `تم قتل الضحية: ${named}` : 'تم قتل ضحية',
    };
  }
  if (body.startsWith('نتيجة الليل: لم يُقتل أحد — الحماية')) {
    return {
      kind: 'night-safe',
      body,
      victimName: null,
      title: 'لم يُقتل أحد — الحماية نجحت',
    };
  }
  if (body.startsWith('نتيجة الليل: لم يُقتل أحد')) {
    return {
      kind: 'night-no-victim',
      body,
      victimName: null,
      title: 'لم يُقتل أحد هذه الليلة',
    };
  }
  if (body.startsWith('نتيجة التصويت: تم استبعاد')) {
    return {
      kind: 'vote-out',
      body,
      victimName: named,
      title: named ? `تم استبعاد: ${named}` : 'تم استبعاد لاعب',
    };
  }
  if (body.startsWith('نتيجة التصويت: تعادل')) {
    return {
      kind: 'vote-tie',
      body,
      victimName: null,
      title: 'تعادل التصويت — لم يُستبعد أحد',
    };
  }
  return null;
}

/** Messages are expected newest-first (as loaded from the room feed). */
export function getLatestMafiaPublicOutcome(
  messages: ReadonlyArray<{ channel: string; body: string }>,
): MafiaPublicOutcome | null {
  for (const message of messages) {
    if (message.channel !== 'SYSTEM') continue;
    const parsed = parseMafiaSystemOutcome(message.body);
    if (parsed) return parsed;
  }
  return null;
}

export function mafiaDisplayInitial(displayName: string) {
  const trimmed = displayName.trim();
  return trimmed ? trimmed.charAt(0) : '?';
}

export function getMafiaPhaseEveryoneHint(phase: MafiaPhaseName): string {
  switch (phase) {
    case 'LOBBY':
      return 'الجميع ينتظر بدء المضيف بعد اكتمال العدد.';
    case 'NIGHT':
      return 'الأدوار السرية تختار، وبقية اللاعبين ينتظرون بصمت.';
    case 'DAY':
      return 'ناقشوا نتيجة الليل والأدلة في القناة العامة.';
    case 'VOTING':
      return 'كل لاعب حي يثبّت صوتًا ضد مشتبه واحد.';
    case 'FINISHED':
      return 'انتهت اللعبة وكُشفت الأدوار.';
  }
}
