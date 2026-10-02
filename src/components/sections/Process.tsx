import type { CSSProperties } from 'react';
import { t } from '@/content/copy';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { sectionIds, type Locale } from '@/lib/routes';

/**
 * Proceso en la sala (negro): cuatro pasos en horizontal con numerales grandes, porque sí son una secuencia.
 * La línea superior se rellena con el scroll (data-progress, en MotionProvider).
 */
export function Process({ locale }: { locale: Locale }) {
  const c = t(locale).process;
  return (
    <section id={sectionIds[locale].process} aria-labelledby="process-title" className="theme-dark sheet section-y">
      <div className="container-x">
        <SectionLabel>{c.label}</SectionLabel>
        <h2 id="process-title" className="h-section mt-6 max-w-[12ch]" data-reveal>
          {c.title}
        </h2>

        <div className="relative mt-20 md:mt-28">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 hidden h-px bg-line lg:block" />
          <div aria-hidden="true" data-progress className="absolute inset-x-0 top-0 hidden h-px origin-left bg-accent lg:block" />
          <ol className="grid gap-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {c.steps.map((step, i) => (
              <li key={step.title} className="border-t border-line pt-6 lg:border-t-0 lg:pt-10" data-reveal style={{ '--d': i } as CSSProperties}>
                <span aria-hidden="true" className="block font-display text-[clamp(4rem,7vw,7rem)] font-light leading-none tracking-[-0.06em] text-fg-3 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-8 font-display text-[clamp(1.625rem,2.2vw,2.125rem)] font-medium leading-[1.02] tracking-[-0.04em]">
                  <span className="sr-only">{i + 1}. </span>
                  {step.title}
                </h3>
                <dl className="mt-6 space-y-5 text-[0.9375rem] leading-relaxed">
                  {step.send ? (
                    <div>
                      <dt className="label">{c.youSend}</dt>
                      <dd className="mt-1.5 text-fg-2">{step.send}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="label">{c.youGet}</dt>
                    <dd className="mt-1.5 text-fg-2">{step.get}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
