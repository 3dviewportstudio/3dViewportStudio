import type { CSSProperties } from 'react';
import { t } from '@/content/copy';
import { projects } from '@/content/projects';
import { ScrubText } from '@/components/ui/ScrubText';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { VariantStudio } from '@/components/ui/VariantStudio';
import type { Locale } from '@/lib/routes';

/**
 * Manifiesto en el estudio (claro): una declaración a gran escala que se ilumina con el scroll,
 * tres ideas en columnas y, debajo, el estudio de variantes en una pantalla negra.
 */
export function Problem({ locale }: { locale: Locale }) {
  const c = t(locale).problem;
  const pphoneLila = projects.find((p) => p.slug === 'pphone-17')?.gallery.find((g) => g.id === 'pphone-lila');

  return (
    <section aria-labelledby="problem-title" className="theme-light sheet section-y">
      <div className="container-x">
        <SectionLabel>{c.label}</SectionLabel>
        <ScrubText
          as="h2"
          id="problem-title"
          text={c.statement}
          className="mt-10 max-w-[21ch] font-display text-[clamp(2.4rem,5.9vw,6.5rem)] font-medium leading-[0.95] tracking-[-0.055em]"
        />

        <ul className="mt-20 grid gap-12 md:mt-32 md:grid-cols-3 md:gap-8">
          {c.points.map((p, i) => (
            <li key={p.title} className="border-t border-fg pt-6" data-reveal style={{ '--d': i } as CSSProperties}>
              <h3 className="font-display text-[clamp(1.5rem,2vw,1.875rem)] font-medium leading-[1.05] tracking-[-0.035em]">{p.title}</h3>
              <p className="mt-4 max-w-[34ch] text-fg-2">{p.text}</p>
            </li>
          ))}
        </ul>

        {/* Laboratorio: una pantalla negra dentro del estudio */}
        <div className="theme-dark mt-24 rounded-[var(--sheet-r)] md:mt-36" data-reveal>
          <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-12 lg:gap-8 lg:p-14">
            <div className="lg:col-span-4 lg:self-center">
              <h3 className="font-display text-[clamp(2rem,3.4vw,3.5rem)] font-medium leading-[0.98] tracking-[-0.05em]">{c.studio.title}</h3>
              <p className="mt-5 max-w-[38ch] text-fg-2">{c.studio.hint}</p>
              <p className="mt-10 max-w-[40ch] text-sm text-fg-3">{c.studio.note}</p>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <VariantStudio strings={c.studio} posterAlt={pphoneLila?.alt[locale] ?? ''} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
