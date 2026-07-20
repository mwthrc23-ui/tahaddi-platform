'use client';

import { APP_CONFIG } from '@tahaddi/config';
import { FormEvent, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Crown,
  Gamepad2,
  Gauge,
  Layers3,
  LockKeyhole,
  Medal,
  Play,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Trophy,
  Users,
  Wifi,
  X,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'تفاعل لحظي',
    description: 'أسئلة ونتائج وترتيب يصل إلى الجميع في اللحظة نفسها، دون تشتيت.',
    detail: 'تتزامن الأسئلة والمؤقت ولوحة الترتيب بين المضيف وجميع اللاعبين في تجربة واحدة سريعة.',
    tone: 'blue',
  },
  {
    icon: Layers3,
    title: 'إنشاء بلا تعقيد',
    description: 'ابنِ مسابقتك ورتّب أسئلتها واضبط وقتها من مساحة عمل عربية واضحة.',
    detail: 'ابدأ من قالب جاهز، ثم أضف الأسئلة وحدد الوقت والنقاط وطريقة احتساب الإجابات.',
    tone: 'gold',
  },
  {
    icon: BarChart3,
    title: 'نتائج تفهمها',
    description: 'تعرّف على الأداء ونسب الإجابات ومتوسط السرعة في تقرير واحد.',
    detail: 'راقب الأسئلة الأصعب، ونسب الإجابات الصحيحة، وسرعة كل لاعب من لوحة سهلة القراءة.',
    tone: 'violet',
  },
  {
    icon: ShieldCheck,
    title: 'موثوق من البداية',
    description: 'الوقت والنقاط وحالة الجلسة تُدار مركزيًا لتجربة عادلة ومستقرة.',
    detail: 'تُحسب النقاط والوقت من مصدر واحد، مع حفظ حالة الجلسة وإتاحة العودة إليها بأمان.',
    tone: 'emerald',
  },
];

const steps = [
  { number: '01', title: 'أنشئ مسابقتك', text: 'أضف الأسئلة وحدد الوقت والنقاط.' },
  { number: '02', title: 'شارك رمز الغرفة', text: 'ينضم اللاعبون فورًا من أي جهاز.' },
  { number: '03', title: 'ابدأ الحماس', text: 'اعرض الأسئلة وتابع الترتيب مباشرة.' },
];

const audiences = [
  {
    icon: Users,
    title: 'للمعلمين',
    text: 'حوّل الدرس إلى تجربة يتفاعل معها الجميع.',
    detail: 'اختبارات سريعة داخل الفصل، مراجعة قبل الاختبار، وتقارير تساعدك على معرفة نقاط القوة.',
  },
  {
    icon: Gamepad2,
    title: 'لصنّاع المحتوى',
    text: 'قرّب جمهورك بمسابقة سريعة وممتعة.',
    detail: 'أطلق تحديًا مباشرًا في البث، شارك رمزًا واحدًا، واعرض الفائزين في نهاية الحلقة.',
  },
  {
    icon: Crown,
    title: 'للفِرق والمؤسسات',
    text: 'فعّل الاجتماعات والفعاليات بتجربة موحّدة.',
    detail: 'كسر جمود الاجتماعات، مسابقات المناسبات، وأنشطة فرق العمل من لوحة واحدة.',
  },
];

type ModalState =
  | { type: 'login' }
  | { type: 'create' }
  | { type: 'demo' }
  | { type: 'joined'; code: string }
  | { type: 'ready'; title: string }
  | { type: 'feature'; index: number }
  | { type: 'audience'; index: number }
  | null;

export default function Home() {
  const [modal, setModal] = useState<ModalState>(null);
  const [roomCode, setRoomCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleJoin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = roomCode.trim();

    if (!/^[0-9\u0660-\u0669]{4,8}$/.test(code)) {
      setJoinError('أدخل رمزًا صحيحًا من ٤ إلى ٨ أرقام.');
      return;
    }

    setJoinError('');
    setModal({ type: 'joined', code });
  };

  const closeModal = () => setModal(null);

  return (
    <main>
      <header className="site-header">
        <div className="shell header-inner">
          <a className="brand" href="#top" aria-label="تحدّي — الصفحة الرئيسية">
            <span className="brand-mark" aria-hidden="true">
              <Trophy size={20} strokeWidth={2.2} />
            </span>
            <span>{APP_CONFIG.name}</span>
          </a>

          <nav className="main-nav" aria-label="التنقل الرئيسي">
            <a href="#features">المزايا</a>
            <a href="#how-it-works">كيف تعمل؟</a>
            <a href="#audiences">لمن تحدّي؟</a>
          </nav>

          <div className="header-actions">
            <button className="text-link button-reset" type="button" onClick={() => setModal({ type: 'login' })}>
              دخول
            </button>
            <button className="button button-small button-primary" type="button" onClick={() => setModal({ type: 'create' })}>
              ابدأ الآن
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-orb hero-orb-one" aria-hidden="true" />
        <div className="hero-orb hero-orb-two" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />

        <div className="shell hero-layout">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={15} aria-hidden="true" />
              منصة مسابقات عربية، صُممت للحماس
            </div>
            <h1>
              اصنع لحظةً
              <span> لا تُنسى.</span>
            </h1>
            <p className="hero-lead">
              أنشئ مسابقتك، اجمع اللاعبين، وشاهد الترتيب يتغيّر لحظة بلحظة — في تجربة عربية سريعة
              وممتعة للجميع.
            </p>

            <div className="hero-actions">
              <button className="button button-primary button-large" type="button" onClick={() => setModal({ type: 'create' })}>
                أنشئ مسابقة مجانًا
                <ArrowLeft size={19} aria-hidden="true" />
              </button>
              <button className="button button-ghost button-large" type="button" onClick={() => setModal({ type: 'demo' })}>
                <span className="play-dot">
                  <Play size={15} fill="currentColor" aria-hidden="true" />
                </span>
                شاهد كيف تعمل
              </button>
            </div>

            <div className="trust-line" aria-label="مزايا الانضمام">
              <span>
                <CheckCircle2 size={17} aria-hidden="true" /> بلا بطاقة ائتمانية
              </span>
              <span>
                <CheckCircle2 size={17} aria-hidden="true" /> انضمام الضيف بلا حساب
              </span>
            </div>
          </div>

          <div className="hero-visual" aria-label="معاينة جلسة مسابقة مباشرة">
            <div className="visual-glow" aria-hidden="true" />
            <div className="quiz-window">
              <div className="window-topbar">
                <div className="live-pill">
                  <span className="live-dot" /> مباشر
                </div>
                <span className="question-count">السؤال ٤ من ١٠</span>
                <div className="room-pill">
                  <Wifi size={14} aria-hidden="true" /> ٢٤ لاعبًا
                </div>
              </div>

              <div className="timer-row">
                <span>الوقت المتبقي</span>
                <strong>١٢</strong>
              </div>

              <div className="question-card">
                <span className="question-label">جغرافيا</span>
                <h2>ما هي أكبر دولة عربية من حيث المساحة؟</h2>
                <div className="answers-grid" aria-label="اختر إجابة تجريبية">
                  <button
                    className={`answer answer-blue ${selectedAnswer === 0 ? 'answer-selected' : ''}`}
                    type="button"
                    onClick={() => setSelectedAnswer(0)}
                  >
                    <span>أ</span> السعودية
                  </button>
                  <button
                    className={`answer answer-gold ${selectedAnswer === 1 ? 'answer-selected answer-correct' : ''}`}
                    type="button"
                    onClick={() => setSelectedAnswer(1)}
                  >
                    <span>ب</span> الجزائر
                  </button>
                  <button
                    className={`answer answer-violet ${selectedAnswer === 2 ? 'answer-selected' : ''}`}
                    type="button"
                    onClick={() => setSelectedAnswer(2)}
                  >
                    <span>ج</span> السودان
                  </button>
                  <button
                    className={`answer answer-rose ${selectedAnswer === 3 ? 'answer-selected' : ''}`}
                    type="button"
                    onClick={() => setSelectedAnswer(3)}
                  >
                    <span>د</span> مصر
                  </button>
                </div>
                {selectedAnswer !== null && (
                  <p className={`answer-feedback ${selectedAnswer === 1 ? 'is-correct' : ''}`} role="status">
                    {selectedAnswer === 1 ? 'إجابة صحيحة — أحسنت!' : 'محاولة جميلة — الإجابة الصحيحة هي الجزائر.'}
                  </p>
                )}
              </div>

              <div className="window-footer">
                <div className="avatar-stack" aria-hidden="true">
                  <span>س</span>
                  <span>م</span>
                  <span>ن</span>
                </div>
                <span>أجاب ١٨ لاعبًا</span>
                <div className="progress-track">
                  <span />
                </div>
              </div>
            </div>

            <div className="floating-card ranking-card">
              <Medal size={20} aria-hidden="true" />
              <div>
                <span>المركز الأول</span>
                <strong>سارة · ٨٬٤٢٠</strong>
              </div>
            </div>
            <div className="floating-card speed-card">
              <Gauge size={20} aria-hidden="true" />
              <div>
                <span>سرعة الاستجابة</span>
                <strong>لحظية</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="shell quick-join" id="join">
          <div className="join-heading">
            <span className="join-icon">
              <Gamepad2 size={22} aria-hidden="true" />
            </span>
            <div>
              <strong>لديك رمز غرفة؟</strong>
              <span>ادخل وانضم خلال ثوانٍ</span>
            </div>
          </div>
          <form className="join-form" onSubmit={handleJoin} noValidate>
            <label className="sr-only" htmlFor="room-code">
              رمز الغرفة
            </label>
            <input
              id="room-code"
              name="code"
              inputMode="numeric"
              maxLength={8}
              placeholder="أدخل الرمز هنا"
              value={roomCode}
              aria-describedby={joinError ? 'room-code-error' : undefined}
              aria-invalid={Boolean(joinError)}
              onChange={(event) => {
                setRoomCode(event.target.value);
                if (joinError) setJoinError('');
              }}
            />
            <button className="button button-primary" type="submit">
              انضم للمسابقة <ArrowLeft size={18} aria-hidden="true" />
            </button>
            {joinError && <span className="join-error" id="room-code-error">{joinError}</span>}
          </form>
        </div>
      </section>

      <section className="section features-section" id="features">
        <div className="shell">
          <div className="section-heading centered">
            <span className="section-kicker">كل ما تحتاجه في مكان واحد</span>
            <h2>مسابقات أقوى. تجربة أبسط.</h2>
            <p>من أول سؤال حتى لوحة النتائج، صُممت كل خطوة لتبقي تركيزك على جمهورك.</p>
          </div>

          <div className="feature-grid">
            {features.map(({ icon: Icon, title, description, tone }, index) => (
              <button
                className="feature-card card-button"
                key={title}
                type="button"
                onClick={() => setModal({ type: 'feature', index })}
                aria-label={`اعرف المزيد عن ${title}`}
              >
                <div className={`feature-icon feature-icon-${tone}`}>
                  <Icon size={24} aria-hidden="true" />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="feature-arrow" aria-hidden="true">
                  <ArrowLeft size={18} />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section steps-section" id="how-it-works">
        <div className="shell steps-layout">
          <div className="steps-copy">
            <span className="section-kicker">ثلاث خطوات فقط</span>
            <h2>من الفكرة إلى التحدّي في دقائق.</h2>
            <p>لا إعدادات معقدة ولا وقت ضائع. ابدأ بمسابقة جاهزة وشاركها فورًا مع جمهورك.</p>
            <a className="inline-link" href="#join">
              ابدأ تحدّيك الأول <ArrowLeft size={17} aria-hidden="true" />
            </a>
          </div>
          <ol className="steps-list">
            {steps.map((step, index) => (
              <li key={step.number}>
                <span className="step-number">{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
                {index < steps.length - 1 && <span className="step-line" aria-hidden="true" />}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section audience-section" id="audiences">
        <div className="shell">
          <div className="section-heading centered">
            <span className="section-kicker">مساحة واحدة، فرص لا تنتهي</span>
            <h2>مصممة لكل من يصنع تفاعلًا.</h2>
          </div>
          <div className="audience-grid">
            {audiences.map(({ icon: Icon, title, text }, index) => (
              <button
                className="audience-card card-button"
                key={title}
                type="button"
                onClick={() => setModal({ type: 'audience', index })}
                aria-label={`استكشف حلول ${title}`}
              >
                <Icon size={28} aria-hidden="true" />
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                <ArrowLeft className="audience-arrow" size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section final-cta-section">
        <div className="shell final-cta">
          <div className="cta-glow" aria-hidden="true" />
          <div className="cta-content">
            <span className="cta-icon">
              <Trophy size={26} aria-hidden="true" />
            </span>
            <h2>جاهز لصناعة التحدّي؟</h2>
            <p>ابدأ مجانًا، واجعل مسابقتك القادمة أكثر حضورًا وحماسًا.</p>
            <button className="button button-primary button-large" type="button" onClick={() => setModal({ type: 'create' })}>
              ابدأ الآن مجانًا <ArrowLeft size={19} aria-hidden="true" />
            </button>
          </div>
          <div className="cta-badge cta-badge-one">
            <TimerReset size={18} /> إعداد سريع
          </div>
          <div className="cta-badge cta-badge-two">
            <LockKeyhole size={18} /> تجربة موثوقة
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="shell footer-inner">
          <a className="brand" href="#top">
            <span className="brand-mark">
              <Trophy size={19} />
            </span>
            <span>{APP_CONFIG.name}</span>
          </a>
          <p>{APP_CONFIG.slogan}</p>
          <div className="footer-links">
            <a href="#features">المزايا</a>
            <a href="#how-it-works">كيف تعمل؟</a>
            <a href="#join">انضم</a>
          </div>
          <span className="copyright">© ٢٠٢٦ تحدّي</span>
        </div>
      </footer>

      {modal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeModal}>
          <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="modal-close" type="button" onClick={closeModal} aria-label="إغلاق النافذة">
              <X size={20} aria-hidden="true" />
            </button>

            {modal.type === 'login' && (
              <>
                <span className="modal-kicker">مرحبًا بعودتك</span>
                <h2 id="modal-title">ادخل إلى حسابك</h2>
                <p>هذه نسخة الواجهة الأولى. اختر طريقة الدخول التي تريد تجهيزها في المرحلة التالية.</p>
                <div className="modal-options">
                  <button type="button" onClick={() => setModal({ type: 'ready', title: 'الدخول بالبريد الإلكتروني' })}>
                    البريد الإلكتروني <ArrowLeft size={17} />
                  </button>
                  <button type="button" onClick={() => setModal({ type: 'ready', title: 'الدخول بحساب Google' })}>
                    حساب Google <ArrowLeft size={17} />
                  </button>
                </div>
              </>
            )}

            {modal.type === 'create' && (
              <>
                <span className="modal-kicker">مسابقة جديدة</span>
                <h2 id="modal-title">ابدأ تحدّيك خلال دقائق</h2>
                <p>أدخل التفاصيل الأساسية لنجهز لك مساحة المسابقة.</p>
                <form
                  className="modal-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setModal({ type: 'ready', title: 'إنشاء المسابقة' });
                  }}
                >
                  <label htmlFor="quiz-title">اسم المسابقة</label>
                  <input id="quiz-title" required placeholder="مثال: تحدّي المعلومات العامة" />
                  <label htmlFor="quiz-size">عدد الأسئلة</label>
                  <select id="quiz-size" defaultValue="10">
                    <option value="5">٥ أسئلة</option>
                    <option value="10">١٠ أسئلة</option>
                    <option value="20">٢٠ سؤالًا</option>
                  </select>
                  <button className="button button-primary" type="submit">متابعة الإنشاء <ArrowLeft size={18} /></button>
                </form>
              </>
            )}

            {modal.type === 'demo' && (
              <>
                <span className="modal-kicker">جولة سريعة</span>
                <h2 id="modal-title">كيف تعمل تحدّي؟</h2>
                <div className="demo-steps">
                  {steps.map((step) => (
                    <div key={step.number}><span>{step.number}</span><div><strong>{step.title}</strong><p>{step.text}</p></div></div>
                  ))}
                </div>
                <button className="button button-primary modal-primary" type="button" onClick={() => setModal({ type: 'create' })}>
                  أنشئ مسابقتك <ArrowLeft size={18} />
                </button>
              </>
            )}

            {modal.type === 'feature' && (() => {
              const feature = features[modal.index];
              const Icon = feature.icon;
              return <><span className={`modal-icon feature-icon-${feature.tone}`}><Icon size={27} /></span><span className="modal-kicker">ميزة في تحدّي</span><h2 id="modal-title">{feature.title}</h2><p>{feature.detail}</p><button className="button button-primary modal-primary" type="button" onClick={() => setModal({ type: 'create' })}>جرّب هذه الميزة <ArrowLeft size={18} /></button></>;
            })()}

            {modal.type === 'audience' && (() => {
              const audience = audiences[modal.index];
              const Icon = audience.icon;
              return <><span className="modal-icon audience-modal-icon"><Icon size={27} /></span><span className="modal-kicker">حل مصمم لك</span><h2 id="modal-title">{audience.title}</h2><p>{audience.detail}</p><button className="button button-primary modal-primary" type="button" onClick={() => setModal({ type: 'create' })}>ابدأ تجربتك <ArrowLeft size={18} /></button></>;
            })()}

            {modal.type === 'joined' && (
              <div className="modal-success"><span><CheckCircle2 size={34} /></span><span className="modal-kicker">تم التحقق من الرمز</span><h2 id="modal-title">الغرفة {modal.code} جاهزة</h2><p>واجهة الانضمام تعمل الآن. سيتم ربط الغرفة المباشرة بخدمة الجلسات في مرحلة التطبيق التالية.</p><button className="button button-primary modal-primary" type="button" onClick={closeModal}>فهمت</button></div>
            )}

            {modal.type === 'ready' && (
              <div className="modal-success"><span><CheckCircle2 size={34} /></span><span className="modal-kicker">النافذة تعمل</span><h2 id="modal-title">{modal.title}</h2><p>تم تجهيز المسار التفاعلي في التصميم. الربط بالحسابات والبيانات سيكون ضمن مرحلة الوظائف الخلفية.</p><button className="button button-primary modal-primary" type="button" onClick={closeModal}>عودة للصفحة</button></div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
