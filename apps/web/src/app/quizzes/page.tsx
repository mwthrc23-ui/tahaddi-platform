import { SiteLayout } from '@/components/layout';
import { CompetitionCard } from '@/components/ui';
import { competitions } from '@/mocks';

export default function QuizzesPage() {
  return (
    <SiteLayout>
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">استكشف وشارك</span>
              <h1>المسابقات العامة</h1>
              <p>تابع المسابقات المتاحة واختر الجولة التي تناسبك.</p>
            </div>
          </div>
          <div className="card-grid three">
            {competitions.map((competition) => (
              <CompetitionCard
                key={competition.id}
                title={competition.title}
                description={`${competition.category} · ${competition.questions} سؤالًا`}
                meta={`${competition.players} لاعبًا`}
                href={`/demo/waiting?quiz=${competition.id}`}
              />
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
