import { APP_CONFIG } from '@tahaddi/config';
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
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'تفاعل لحظي',
    description: 'أسئلة ونتائج وترتيب يصل إلى الجميع في اللحظة نفسها، دون تشتيت.',
    tone: 'blue',
  },
  {
    icon: Layers3,
    title: 'إنشاء بلا تعقيد',
    description: 'ابنِ مسابقتك ورتّب أسئلتها واضبط وقتها من مساحة عمل عربية واضحة.',
    tone: 'gold',
  },
  {
    icon: BarChart3,
    title: 'نتائج تفهمها',
    description: 'تعرّف على الأداء ونسب الإجابات ومتوسط السرعة في تقرير واحد.',
    tone: 'violet',
  },
  {
    icon: ShieldCheck,
    title: 'موثوق من البداية',
    description: 'الوقت والنقاط وحالة الجلسة تُدار مركزيًا لتجربة عادلة ومستقرة.',
    tone: 'emerald',
  },
];

const steps = [
  { number: '01', title: 'أنشئ مسابقتك', text: 'أضف الأسئلة وحدد الوقت والنقاط.' },
  { number: '02', title: 'شارك رمز الغرفة', text: 'ينضم اللاعبون فورًا من أي جهاز.' },
  { number: '03', title: 'ابدأ الحماس', text: 'اعرض الأسئلة وتابع الترتيب مباشرة.' },
];

const audiences = [
  { icon: Users, title: 'للمعلمين', text: 'حوّل الدرس إلى تجربة يتفاعل معها الجميع.' },
  { icon: Gamepad2, title: 'لصنّاع المحتوى', text: 'قرّب جمهورك بمسابقة سريعة وممتعة.' },
  { icon: Crown, title: 'للفِرق والمؤسسات', text: 'فعّل الاجتماعات والفعاليات بتجربة موحّدة.' },
];

export default function Home() {
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
            <a className="text-link" href="#join">
              دخول
            </a>
            <a className="button button-small button-primary" href="#join">
              ابدأ الآن
              <ArrowLeft size={16} aria-hidden="true" />
            </a>
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
              <a className="button button-primary button-large" href="#join">
                أنشئ مسابقة مجانًا
                <ArrowLeft size={19} aria-hidden="true" />
              </a>
              <a className="button button-ghost button-large" href="#how-it-works">
                <span className="play-dot">
                  <Play size={15} fill="currentColor" aria-hidden="true" />
                </span>
                شاهد كيف تعمل
              </a>
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
                <div className="answers-grid">
                  <div className="answer answer-blue">
                    <span>أ</span> السعودية
                  </div>
                  <div className="answer answer-gold">
                    <span>ب</span> الجزائر
                  </div>
                  <div className="answer answer-violet">
                    <span>ج</span> السودان
                  </div>
                  <div className="answer answer-rose">
                    <span>د</span> مصر
                  </div>
                </div>
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
          <form className="join-form" action="/join">
            <label className="sr-only" htmlFor="room-code">
              رمز الغرفة
            </label>
            <input
              id="room-code"
              name="code"
              inputMode="numeric"
              maxLength={8}
              placeholder="أدخل الرمز هنا"
            />
            <button className="button button-primary" type="submit">
              انضم للمسابقة <ArrowLeft size={18} aria-hidden="true" />
            </button>
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
            {features.map(({ icon: Icon, title, description, tone }) => (
              <article className="feature-card" key={title}>
                <div className={`feature-icon feature-icon-${tone}`}>
                  <Icon size={24} aria-hidden="true" />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="feature-arrow" aria-hidden="true">
                  <ArrowLeft size={18} />
                </span>
              </article>
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
            {audiences.map(({ icon: Icon, title, text }) => (
              <article className="audience-card" key={title}>
                <Icon size={28} aria-hidden="true" />
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
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
            <a className="button button-primary button-large" href="#join">
              ابدأ الآن مجانًا <ArrowLeft size={19} aria-hidden="true" />
            </a>
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
    </main>
  );
}
