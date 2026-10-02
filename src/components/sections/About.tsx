import { t } from '@/content/copy';
import { Media } from '@/components/ui/Media';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { sectionIds, type Locale } from '@/lib/routes';

export function About({ locale }: { locale: Locale }) {
  const c = t(locale).about;
  const alt = { es: c.mediaAlt, en: c.mediaAlt };
  return (
    <section id={sectionIds[locale].about} aria-labelledby="about-title" className="section-y relative border-t border-line">
      <div className="container-x grid gap-14 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5">
          <Media
            item={{ kind: 'image', id: 'fine-nipona-mulberry', alt, caption: { es: '', en: '' } }}
            locale={locale}
            ratio="4 / 5"
            parallax
            sizes="(min-width: 768px) 38vw, 92vw"
            className="md:sticky md:top-[calc(var(--header-h)+2rem)]"
          />
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <SectionLabel>{c.label}</SectionLabel>
          <h2 id="about-title" className="h-section mt-6 max-w-[14ch]" data-reveal>
            {c.title}
          </h2>
          <div className="mt-10 space-y-5 text-lead" data-reveal>
            {c.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <dl className="mt-14 divide-y divide-line border-y border-line" data-reveal>
            {c.facts.map((f) => (
              <div key={f.term} className="grid gap-1 py-4 text-[0.9375rem] sm:grid-cols-3 sm:gap-4">
                <dt className="label pt-0.5">{f.term}</dt>
                <dd className="sm:col-span-2">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
