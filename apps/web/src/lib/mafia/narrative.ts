import type { MafiaRoleName } from './rules';

export type MafiaCharacterArchetype =
  | 'SCHOLAR'
  | 'MERCHANT'
  | 'FARMER'
  | 'NOBLE'
  | 'ARTISAN'
  | 'SERVANT'
  | 'OFFICER'
  | 'TRAVELER';

export type MafiaEndingStyle = 'DRAMA' | 'TRAGEDY' | 'HOPE' | 'IRONY' | 'MYSTERY';

export type MafiaNarrativeCharacter = {
  archetype: MafiaCharacterArchetype;
  displayName: string;
  backstory: string;
  quotes: {
    intro: string;
    accused: string;
    defending: string;
    dying: string;
    victory: string;
    defeat: string;
  };
  flavorText: Record<MafiaRoleName, string>;
};

const CHARACTER_ARCHETYPES_TMP: Record<
  MafiaCharacterArchetype,
  Omit<MafiaNarrativeCharacter, 'displayName'>
> = {
  SCHOLAR: {
    archetype: 'SCHOLAR',
    backstory:
      'وصل من الأزهر القديم يحمل كتبًا منسوخة بخطه، وينفق وقته في تحليل النصوص القديمة وكشف الأسرار.',
    quotes: {
      intro: 'إنّ الكلمات هي أقوى من السيوف، وأنا أتقن حروفًا قد تغيّر مصير القرية.',
      accused: 'تتهموني؟ لقد قضيتُ حياتي دروسًا أخلاق. اقرأوا بين سطور القصة.',
      defending: 'دعوني أشرح لكم المنطق الخفي وراء ما حدث — كل شيء له سبب.',
      dying: 'الكتاب الذي كنتُ أكتبه… لن يكتمل الآن. خذوه كدليل…',
      victory: 'أفكارنا انتصرت، والعدل ظهر كما تظهر الحقائق في صفحات التاريخ.',
      defeat: 'الغلبة على العقل مذهلة، لكنها ستُفقدكم من دون شك.',
    },
    flavorText: {
      KILLER: 'الكاتب الذي أتقن كتابة الجريمة قبل أن يرتكبها.',
      DETECTIVE: 'الفقيه الذي يقرأ الأدلة كما يقرأ القرآن.',
      DOCTOR: 'الطبيب الذي عالج الأمراض بالعلاج العشبي القديم.',
      GUARD: 'الذي حرّم نفسه من النوم لحراسة المخطوطات.',
      WITNESS: 'صاحب الذاكرة الخارقة الذي لا ينسى تفصيلًا واحدًا.',
      CITIZEN: 'العالم الذي يدرس القانون ويحل النزاعات بالحجة.',
    },
  },
  MERCHANT: {
    archetype: 'MERCHANT',
    backstory:
      'يعتبر من أغنى تجار القاهرة، يتاجر في البخور والحرير والياقوت، لكن أصوله لا تزال غامضة.',
    quotes: {
      intro: 'المال يفتح أبوابًا مغلقة، وأنا أعرف كل مفاتيح هذه القرية.',
      accused: 'لدي ذهبٌ يكفي لشراء كل شاهد. هل تظنّ أنني أحتاج للقتل؟',
      defending: 'أنظر إلى بيانات البضائع — لقد كنتُ أتفاوض مع البائعين في ذلك الوقت.',
      dying: 'الكنز الذي أخفيته… لن تجدوه. يختفي معي إلى الأبد.',
      victory: 'قصة نجاحي لا تنتهي حتى بالنصر، والربح اليوم مضمون.',
      defeat: 'المال لم يكن كافيًا هذه المرة، لكن أصدقائي سينتقمون لي.',
    },
    flavorText: {
      KILLER: 'القاتل الذي يدفع ثمن الصمت بثمن الياقوت.',
      DETECTIVE: 'المحقق الذي يشتري الأدلة ويشتري الشهود.',
      DOCTOR: 'الذي يعالج المرضى بالثمن المرتفع ثم يعيدهم بالدعاء.',
      GUARD: 'الذي يحمي قريته لأنه يملك نصفها.',
      WITNESS: 'رأى كل شيء، لكن الكلمة صامتة حتى يأتي العرض المناسب.',
      CITIZEN: 'أصحاب المصلحة الذين يرون الأحداث من خلف المقصف.',
    },
  },
  FARMER: {
    archetype: 'FARMER',
    backstory:
      'يحول حقول القمح والشعير في ضواحي القرية، يخرج قبل الفجر ولا يعود إلا بعد الغروب.',
    quotes: {
      intro: 'أنا أعرف الأرض كما أعرف أصدقائي، والطيور تخبرني بالأخبار قبل أن تصل إلينا.',
      accused: 'أخي، أنا أقتل النعاج والأبقار، ألا أرى أن القتل شيء غير سهل بالنسبة لي؟',
      defending: 'كانت الأرض بحاجة للحراثة الليلة الماضية — اسألوا الحيوانات.',
      dying: 'حقل القمح هذا العام سيكون وفيرًا، لكنني لن أحصد منه قطعة.',
      victory: 'القرية آمنة، ويمكننا الآن العودة للحياة البسيطة التي أحبها.',
      defeat: 'الظلام يغطي الحقول… والقمح سيذبل من دون رعايتي.',
    },
    flavorText: {
      KILLER: 'القاتل الذي يستخدم المنجل في مهام لا نذكرها عادةً.',
      DETECTIVE: 'المحقق الذي يقرأ أثر الأقدام في الطين أكثر مما يقرأ الكلمات.',
      DOCTOR: 'يعرف العشب الذي يعالج الحمى، والعشب الذي يسببها.',
      GUARD: 'يحيط بالقرية كالسياج، ولن يمر أحد من دون إذنه.',
      WITNESS: 'أماكن العمل مبكرة، فكان يرى ما يحدث قبل أن يستيقظ الباقون.',
      CITIZEN: 'عامل الأرض الذي يكره الجريمة لأنها تفسد المحصول.',
    },
  },
  NOBLE: {
    archetype: 'NOBLE',
    backstory:
      'ابن الحاكم السابق، عاد من المنفى بعد سنوات طويلة، يطالب بحقوقه لكن حديثه يخفي نوايا أكثر.',
    quotes: {
      intro: 'نعم، أنا من نسل الطواغيت الذين حكموا هذه الأرض، لكنني جئتُ لإنصافها لا لاستعبادها.',
      accused: 'أنت تتهم ابنًا من أهل البيت؟ هات دليلًا قبل أن تلعن نسبك.',
      defending: 'عائلتي بنت هذه القرية. لماذا أدمر ما بناه أجدادي؟',
      dying: 'العرش الذي كنتُ أستعده… ضاع الآن في دمي.',
      victory: 'هذا هو العدل الذي وعدتُ به القرية، وإنّ أهل البيت أمناء.',
      defeat: 'لقد خضتُ حربًا لم أكن أجهّز لها جيوشًا كافية.',
    },
    flavorText: {
      KILLER: 'القاتل الذي يرتكب الجريمة برغبة في استعادة ملكه.',
      DETECTIVE: 'المحقق النبيل الذي تستجيب له الشهود قبل أن يطرح السؤال.',
      DOCTOR: 'الطبيب الذي عالج الأمراء في القصور قبل أن يعالج الفقراء.',
      GUARD: 'حرّس ساحات القصور قديماً، والآن يحرس القرية.',
      WITNESS: 'كان يراقب من نافذة القصر، ورأى ما لم يراه أحد.',
      CITIZEN: 'السيد المتفرج الذي يعرف أسرار كل منسوب.',
    },
  },
  ARTISAN: {
    archetype: 'ARTISAN',
    backstory:
      'صانع الفخار والأدوات الحديدية، يصنع بأ يده كل ما تحتاجه القرية، وينفق أمواله على الأيتام.',
    quotes: {
      intro: 'كل قطعة أثر في هذه القرية تحملي بصمة يدي، وأنا أعرف كل زاوية فيها.',
      accused: 'أنا أصنع الحياة، لا آخذها. هذه اليدين لا تلمس سوى الطين والحديد.',
      defending: 'لقد كنتُ أعملُ على قطعة فخار رائعة — اسألوا زبائني.',
      dying: 'أحببتُ أن أترك أثرًا جميلًا… الآن يختفي الأثر في دمي.',
      victory: 'كل من صنع يدي سيعيش، وضدّي اختفى من الصفحة.',
      defeat: 'الأدوات التي صنعتُها… ستُستخدم ضدي في النهاية.',
    },
    flavorText: {
      KILLER: 'القاتل الذي يعرف كل زاوية ضعف في البيت كما يعرفها في فخاره.',
      DETECTIVE: 'المحقق الذي يقرأ الأثر على الأبواب كما يقرأه على سكينه.',
      DOCTOR: 'يعرف كيف يصلح الكسر في الفخار وكذلك في العظام.',
      GUARD: 'يصنع الأقفال كما يحميها من المقتحمين.',
      WITNESS: 'كان ينهي عمله متأخراً، فسمع الأصوات من خلف الجدار.',
      CITIZEN: 'الصانع الذي يعرف من الذي طلب سكينًا حادًا أمس.',
    },
  },
  SERVANT: {
    archetype: 'SERVANT',
    backstory:
      'خدم في منازل الكبرى طوال حياته، ويعرف الأسرار التي لا تُقال ولا تُكتب في السجلات.',
    quotes: {
      intro: 'أنا لا أتحدث كثيرًا، لكن أذنيي تسمعان كل شيء من خلف الأبواب المغلقة.',
      accused: 'أنا مجرد خادم! لأجلكِ ماذا أربح من القتل؟ القليل الذي أتقاضاه يكفيني.',
      defending: 'كنتُ أحضر قهوة السيد وقت الجريمة — الإبريق لا يكذب.',
      dying: 'الأسرار التي حملتها… ستُدفن معي في الثلج.',
      victory: 'الخادم الذي ظلّ صامتًا هو الذي أنقذه الجميع اليوم.',
      defeat: 'الصمت لم يكن كافيًا لحمايتي هذه المرة.',
    },
    flavorText: {
      KILLER: 'القاتل الذي دخل الغرفة دون أن يسمع أحد له خطوة.',
      DETECTIVE: 'المحقق الذي يعرف تفاصيل الحياة الخاصة لكل قاطن.',
      DOCTOR: 'الذي يجهّز الدواء لمالكه قبل أن يجهّزه لوالديه.',
      GUARD: 'كان حراسًا مخفيًا في الظل طوال سنوات.',
      WITNESS: 'رأى الجريمة من خلف الستار، لكنه خاف أن يتكلم.',
      CITIZEN: 'الخادم الذي أطاع الأوامر دون أن يسأل عن الأسباب.',
    },
  },
  OFFICER: {
    archetype: 'OFFICER',
    backstory:
      'ضابط متقاعد من الجيش، قاد فرقًا في المعارك القديمة، وعاد للقرية ليحيا بسلام مع عائلته.',
    quotes: {
      intro: 'الصبر في المعارك نصف الانتصار، وأنا صبور كالجبل.',
      accused: 'أنا قاتلتُ في الحروب المشروعة، لكن لم أقتل أحدًا بظهره مائلًا.',
      defending: 'كنتُ أدرب ابني على فن السيف وقت الجريمة — الشهود عدوّ.',
      dying: 'الرصاصة التي لم تصلني في المعارك وجدتني هنا… في قريتي.',
      victory: 'الانضباط والشجاعة انتصرا كما انتصرا في ساحات المعارك.',
      defeat: 'استسلمتُ للمرة الأولى، لكن الموت في الظلام ليس بموت الفارس.',
    },
    flavorText: {
      KILLER: 'القاتل الذي يعرف كيف يهاجم بهدوء كما يعرف كيف يهاجم بالجنود.',
      DETECTIVE: 'المحقق الذي يستخدم المنطق العسكري في البحث عن الجاني.',
      DOCTOR: 'الطبيب الذي عالج الجراحات في حقول المعارك.',
      GUARD: 'حرّس القواعد الحصينة قديماً، والقرية الآن.',
      WITNESS: 'كان يتمرن عند الفجر، فرأى جسدًا يُنقل في الظلام.',
      CITIZEN: 'الجندي المتقاعد الذي يدرّب الشباب على الدفاع عن النفس.',
    },
  },
  TRAVELER: {
    archetype: 'TRAVELER',
    backstory:
      'وصل مؤخرًا من أرض بعيدة، يحمل حقيبة مليئة بآثار غريبة وقصص لا يصدقها أحد.',
    quotes: {
      intro: 'رأيتُ مدنًا تختفي في الرمال، وقرى تُبنى من جديد — لكن ما رأيته هنا… فريد من نوعه.',
      accused: 'أنا جديد هنا! لماذا أقتل شخصًا لم أقابله حتى؟ هذا غير منطقي.',
      defending: 'كنتُ أكتب رسائل لأهلي في الحانة وقت الجريمة — السجين عليها ختمي.',
      dying: 'رحلة حياتي تنتهي هنا… فكيف لطريف أنني متّ في أرض أجنبية.',
      victory: 'لقد وجدتُ في هذه القرية ما كنتُ أبحثُ عنه طوال حياتي — العدالة.',
      defeat: 'الغربة دائمًا ما تكون قاتلة، لكنني كنتُ أتمنى أن تموتُ على فراشي.',
    },
    flavorText: {
      KILLER: 'القاتل الغريب الذي أتى ليطارد ثأره القديم.',
      DETECTIVE: 'المحقق الذي يعرف طرقًا غريبة للبحث عن الجاني.',
      DOCTOR: 'يعرف أدوية من أرض بعيدة تعالج ما لا تعالجه الأدوية المحلية.',
      GUARD: 'المحارب الذي جاء من أرض بعيدة ليكسب لقمة عيشه بالحماية.',
      WITNESS: 'جاء في وقت غريب، فرأى شيئًا لم يكن من المفترض أن يُرى.',
      CITIZEN: 'النزيل الذي يبدو عابرًا، لكنه يحمل أسرارًا أقدم من عمر القرية.',
    },
  },
};

const ALL_ROLES: MafiaRoleName[] = ['KILLER', 'DETECTIVE', 'DOCTOR', 'GUARD', 'WITNESS', 'CITIZEN'];

export const ARCHETYPE_LABELS: Record<MafiaCharacterArchetype, string> = {
  SCHOLAR: 'العالِم',
  MERCHANT: 'التاجر',
  FARMER: 'الفلاح',
  NOBLE: 'النبيل',
  ARTISAN: 'الحرفي',
  SERVANT: 'الخادم',
  OFFICER: 'الضابط',
  TRAVELER: 'المسافر',
};

export const ROLE_FLAVOR: Record<MafiaRoleName, Record<MafiaCharacterArchetype, string>> =
  ALL_ROLES.reduce(
    (acc, role) => {
      (Object.keys(CHARACTER_ARCHETYPES_TMP) as MafiaCharacterArchetype[]).forEach((a) => {
        acc[role] ??= {} as Record<MafiaCharacterArchetype, string>;
        acc[role][a] = CHARACTER_ARCHETYPES_TMP[a].flavorText[role];
      });
      return acc;
    },
    {} as Record<MafiaRoleName, Record<MafiaCharacterArchetype, string>>,
  );

export const CHARACTER_ARCHETYPES = CHARACTER_ARCHETYPES_TMP;

export function pickArchetype(seed: number): MafiaCharacterArchetype {
  const keys = Object.keys(CHARACTER_ARCHETYPES) as MafiaCharacterArchetype[];
  return keys[Math.abs(seed) % keys.length];
}

export function buildNarrative(displayName: string, role: MafiaRoleName, seed: number) {
  const archetype = pickArchetype(seed);
  const base = CHARACTER_ARCHETYPES[archetype];
  return {
    archetype,
    title: ARCHETYPE_LABELS[archetype],
    displayName,
    role,
    backstory: base.backstory,
    quotes: base.quotes,
    roleFlavor: base.flavorText[role],
  } as const;
}

export const INTRO_NARRATIVES = [
  'في قرية صغيرة تحيط بها الجبال، ضاع نور الفجر. استيقظ القاطنون على صوت صرخة مروعة: أحد أصدقائهم ليس بينهم بعد الآن.',
  'كان الليل باردًا كالجليد، والريح تحكي قصصًا قديمة. لكن هذه المرة كانت القصة حقيقية: جريمة ارتُكبت في الظلام.',
  'جمعت القرية أهلها في الساحة الكبرى. صمت مرعب يقطع النفس قبل أن يتكلم أحد. ما الذي حدث في الليل؟',
  'في زاوية غير مرئية، تحركت يد القاتل ببرود شديد. لم يعرف أحد أنه سيشارك في اللعبة الأكثر فتكًا في تاريخ القرية.',
];

export const VICTORY_NARRATIVES: Record<'CITIZENS' | 'KILLERS', Record<MafiaEndingStyle, string>> = {
  CITIZENS: {
    DRAMA:
      'في المشهد الأخير، اجتمع الناجون حول النار المتقدة. كشف المحقق وجه القاتل أمام الجميع، وكانت المفاجأة أنّ الأقرب هم الأشرار.',
    TRAGEDY:
      'انتصارٌ مرّ على شفاه المواطنين: طُرد القاتل، لكن بقية الأصدقاء قد اختفى واحدًا تلو الآخر. النار أحرقت القرية ولم يبقَ غير الأشباح.',
    HOPE:
      'بعد طرد القتلة، وقع الأبرياء في أحضان بعضهم البعض. الشمس شرقت مجدداً، وبدأت قرية جديدة تُبنى على ركيزة من الصدق والوثوق.',
    IRONY:
      'أُخرجت العصابة من القرية بضحكات مريرة. لكن بعد سنوات، أصبح أحد الأطفال الذين رأوا المشهد هو القاتل في القصة التالية.',
    MYSTERY:
      'أُعلن انتصار المواطنين وكُشفت الأدوار. لكن الرسالة الغريبة التي عثرت عليها في الجيب لم تعزُ لأحد. هل بقي أحدٌ في الظلال؟',
  },
  KILLERS: {
    DRAMA:
      'جاءت اللحظة الأخيرة: كشف القاتلان وجهي الازدواج الذي أخفاه طوال اللعبة. المواطنون الأخيران يدركان أنّ الوثيقة كانت قاتلةً أكثر من السكين.',
    TRAGEDY:
      'تخبّأ الأشرار ببراعة، وانتهت اللعبة بصقعة دم واحد تلو الآخر. بقيت القرية في عهد قاتل، والليل صار أبديًا.',
    HOPE:
      'انتصار غريب للقتلة. لكنهم قرروا التوبة بعد ما رأوه من معاناة. غادروا القرية حاملين أسرارها، ووعدهم العدل غدًا أفضل.',
    IRONY:
      'فاز القتلة بهدوء تام. ما لم يعرفوه أنّ الضحية الأولى كانت تحمل سرًا قاتلًا لهم جميعًا. النصر كان حبلًا مُشنقةً بانتظارهم.',
    MYSTERY:
      'الهرب كان مذهلاً. اختفى القاتل في الظلام، ولم يبقَ سوى بصمة قديمة على الجدار تذكر اسمًا غير مذكور في أي سجل.',
  },
};

export const ELIMINATION_NARRATIVES: Record<'NIGHT' | 'VOTING', string[]> = {
  NIGHT: [
    'في منتصف الليل، سُمع صوت ضحية… ثم صمت مطوّل. خرج {name} من اللعبة في صمت مرعب.',
    'تحرّكت الأظافر الخفية بسرعة بلا رحمة. صرخة خافتة، ثم اختفى {name} إلى الأبد من بين الأحياء.',
    'الضوء انطفأ للحظة، وعندما عاد لم يعد {name} موجودًا. الدماء على الأرض كانت دليلاً وحيدًا.',
  ],
  VOTING: [
    'رفعت الأصوات بحماس، واتّفق الجميع على نتيجة واحدة. خرج {name} من الحلبة وهو يردد أنّه بريء.',
    'تداعت الحجج لاختيار المشتبه به. تمّ الإجماع على طرد {name}، والصمت عاد يكتنف الساحة.',
    'عدّت الأصوات ببطء، وكانت النتيجة صادمة للكثيرين. سار {name} نحو الباب وهو ينظر إلى المراتب الواحدة تلو الأخرى.',
  ],
};

export function pickEndingStyle(
  round: number,
  killerCount: number,
  citizensRemained: number,
): MafiaEndingStyle {
  const sum = round * 7 + killerCount * 13 + citizensRemained * 5;
  const styles: MafiaEndingStyle[] = ['DRAMA', 'TRAGEDY', 'HOPE', 'IRONY', 'MYSTERY'];
  return styles[sum % styles.length];
}

export function renderEliminationText(
  phase: 'NIGHT' | 'VOTING',
  displayName: string,
  seed: number,
): string {
  const options = ELIMINATION_NARRATIVES[phase];
  const choice = options[Math.abs(seed) % options.length];
  return choice.replaceAll('{name}', displayName);
}

export function buildNarrativeEvent(
  event: 'start' | 'end',
  winner: 'CITIZENS' | 'KILLERS' | null,
  round: number,
  remained: number,
  killerCount: number,
): { type: 'narrative'; id: string; body: string } {
  if (event === 'start') {
    const seed = round + remained + killerCount;
    return {
      type: 'narrative',
      id: `narrative-start-${seed}`,
      body: INTRO_NARRATIVES[seed % INTRO_NARRATIVES.length],
    };
  }
  if (winner) {
    const style = pickEndingStyle(round, killerCount, remained);
    return {
      type: 'narrative',
      id: `narrative-end-${winner}-${style}`,
      body: VICTORY_NARRATIVES[winner][style],
    };
  }
  return {
    type: 'narrative',
    id: `narrative-unknown-${Date.now()}`,
    body: 'استمرت الأحداث بلا حلول واضحة.',
  };
}
