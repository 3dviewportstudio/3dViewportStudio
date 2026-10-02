import type { CSSProperties } from 'react';
import { t } from '@/content/copy';
import { projects } from '@/content/projects';
import { ScrubText } from '@/components/ui/ScrubText';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { VariantStudio } from '@/components/ui/VariantStudio';
import type { Locale } from '@/lib/routes';

export function Problem({ locale }: { locale: Locale }) {
  const c = t(locale).problem;
  const pphoneLila = projects.find((p) => p.slug === 'pphone-17')?.gallery.find((g) => g.id === 'pphone-lila');

  return (
    <section aria-labelledby="problem-title" className="section-y relative">
      <div className="container-x">
        <SectionLabel>{c.label}</SectionLabel>
        <ScrubText
          as="h2"
          id="problem-title"
          text={c.statement}
          className="mt-10 max-w-[24ch] font-display text-[clamp(2rem,4.8vw,4.5rem)] font-bold leading-[1.04] tracking-[-0.035em]"
        />

        <div className="mt-20 grid gap-16 md:mt-28 lg:grid-cols-12 lg:gap-8">
          <ul className="flex flex-col lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:col-span-5 lg:self-start lg:pt-2">
            {c.points.map((p, i) => (
              <li key={p.title} className="border-t border-line py-8 last:border-b" data-reveal style={{ '--d': i } as CSSProperties}>
                <h3 className="font-display text-[1.625rem] font-bold leading-tight tracking-[-0.02em]">{p.title}</h3>
                <p className="mt-3 max-w-[40ch] text-fg-2">{p.text}</p>
              </li>
            ))}
          </ul>

          <div className="lg:col-span-6 lg:col-start-7" data-reveal>
            <h3 className="font-display text-[clamp(1.5rem,2.2vw,2rem)] font-bold leading-tight tracking-[-0.025em]">{c.studio.title}</h3>
            <p className="mt-3 max-w-[48ch] text-fg-2">{c.studio.hint}</p>
            <div className="mt-8">
              <VariantStudio strings={c.studio} posterAlt={pphoneLila?.alt[locale] ?? ''} />
            </div>
            <p className="mt-4 max-w-[52ch] text-sm text-fg-3">{c.studio.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
