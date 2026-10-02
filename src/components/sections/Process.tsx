import type { CSSProperties } from 'react';
import { t } from '@/content/copy';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { sectionIds, type Locale } from '@/lib/routes';

export function Process({ locale }: { locale: Locale }) {
  const c = t(locale).process;
  return (
    <section id={sectionIds[locale].process} aria-labelledby="process-title" className="section-y relative border-t border-line bg-bg-2">
      <div className="container-x grid gap-14 lg:grid-cols-12 lg:gap-8">
        {/* El título queda fijo mientras los pasos avanzan */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+3rem)]">
            <SectionLabel>{c.label}</SectionLabel>
            <h2 id="process-title" className="h-section mt-6 max-w-[12ch]" data-reveal>
              {c.title}
            </h2>
          </div>
        </div>

        <div className="relative lg:col-span-7 lg:col-start-6">
          {/* Línea de progreso: los pasos son una secuencia real */}
          <div aria-hidden="true" className="absolute bottom-0 left-[15px] top-0 w-px bg-line" />
          <div aria-hidden="true" data-progress-y className="absolute bottom-0 left-[15px] top-0 w-px origin-top bg-accent" />
          <ol className="flex flex-col gap-14 md:gap-20">
            {c.steps.map((step, i) => (
              <li key={step.title} className="relative grid grid-cols-[32px_1fr] gap-6 md:gap-10" data-reveal style={{ '--d': i } as CSSProperties}>
                <span
                  aria-hidden="true"
                  className="relative z-[1] grid h-8 w-8 place-items-center rounded-full border border-line-strong bg-bg-2 font-mono text-xs tabular-nums text-fg"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-display text-[clamp(1.75rem,2.6vw,2.25rem)] font-bold leading-tight tracking-[-0.025em]">
                    <span className="sr-only">{i + 1}. </span>
                    {step.title}
                  </h3>
                  <dl className="mt-5 grid gap-5 text-[0.9375rem] leading-relaxed sm:grid-cols-2">
                    {step.send ? (
                      <div>
                        <dt className="label">{c.youSend}</dt>
                        <dd className="mt-1.5 text-fg-2">{step.send}</dd>
                      </div>
                    ) : null}
                    <div className={step.send ? '' : 'sm:col-span-2'}>
                      <dt className="label">{c.youGet}</dt>
                      <dd className="mt-1.5 max-w-[52ch] text-fg-2">{step.get}</dd>
                    </div>
                  </dl>
                  <p className="label-tech mt-5 !text-fg-3">{step.tags}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
