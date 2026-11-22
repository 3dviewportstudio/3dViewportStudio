import type { CSSProperties, ReactNode } from 'react';
import { t } from '@/content/copy';
import { ArrowRight } from '@/components/ui/Icons';
import { sectionIds, type Locale } from '@/lib/routes';

/* Iconos de trazo fino (24 px, 1.5): uno por capacidad, en el mismo orden que el texto */
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const ICONS: ReactNode[] = [
  // Escenarios: montañas + sol
  <svg key="0" viewBox="0 0 24 24" width="22" height="22" {...stroke}><path d="M3 19 9.5 10l4 5.5L16 12l5 7H3Z" /><circle cx="17" cy="6" r="2" /></svg>,
  // Render a vídeo: fotograma + play
  <svg key="1" viewBox="0 0 24 24" width="22" height="22" {...stroke}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m10.5 9.5 4 2.5-4 2.5v-5Z" /></svg>,
  // Variantes: capas apiladas
  <svg key="2" viewBox="0 0 24 24" width="22" height="22" {...stroke}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></svg>,
  // Producto en uso: mano
  <svg key="3" viewBox="0 0 24 24" width="22" height="22" {...stroke}><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5v-2a1.5 1.5 0 0 1 3 0V11m0-2a1.5 1.5 0 0 1 3 0v5a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 4 15.5V13a1.5 1.5 0 0 1 3 0" /></svg>,
  // Conceptos: destello
  <svg key="4" viewBox="0 0 24 24" width="22" height="22" {...stroke}><path d="M12 3c.5 4.5 2.5 6.5 7 7-4.5.5-6.5 2.5-7 7-.5-4.5-2.5-6.5-7-7 4.5-.5 6.5-2.5 7-7Z" /><path d="M19 15c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5Z" /></svg>,
  // Reescalado: flechas hacia las esquinas
  <svg key="5" viewBox="0 0 24 24" width="22" height="22" {...stroke}><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" /></svg>,
];

function Accent({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/).map((chunk, i) =>
        chunk.startsWith('*') ? (
          <span key={i} className="serif-accent">
            {chunk.slice(1, -1)}
          </span>
        ) : (
          chunk
        ),
      )}
    </>
  );
}

export function AiSection({ locale }: { locale: Locale }) {
  const c = t(locale).ai;
  const contact = `#${sectionIds[locale].contact}`;

  return (
    <section id={sectionIds[locale].ai} aria-labelledby="ai-title" className="ai-glow section-y relative scroll-mt-20">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow" data-reveal>
              {c.label}
            </p>
            <h2 id="ai-title" className="h-section mt-6" data-reveal style={{ '--d': 1 } as CSSProperties}>
              {c.title.map((line, i) => (
                <span key={i} className={`block ${i > 0 ? 'text-fg/60' : ''}`}>
                  <Accent text={line} />
                </span>
              ))}
            </h2>
          </div>
          <div className="lg:col-span-5" data-reveal style={{ '--d': 2 } as CSSProperties}>
            <p className="text-lead max-w-[32rem]">{c.intro}</p>
            {/* Cómo se combinan: tres pasos en una línea */}
            <ol className="mt-7 flex flex-wrap items-center gap-2">
              {c.flow.map((step, i) => (
                <li key={step} className="flex items-center gap-2">
                  <span className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[0.8125rem] text-fg/90">
                    <span className="font-mono text-[0.6875rem] text-accent">0{i + 1}</span>
                    {step}
                  </span>
                  {i < c.flow.length - 1 ? (
                    <span aria-hidden="true" className="text-fg-3">
                      →
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <ul className="mt-14 grid gap-3 sm:grid-cols-2 md:mt-20 lg:grid-cols-3 lg:gap-4">
          {c.items.map((item, i) => (
            <li key={item.title} className="glass ai-card flex flex-col p-6 md:p-8" data-reveal style={{ '--d': i } as CSSProperties}>
              <div className="flex items-center justify-between">
                <span className="ai-icon">{ICONS[i]}</span>
                <span className="font-mono text-[0.6875rem] tracking-[0.18em] text-fg/40">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-10 font-display text-[1.375rem] font-bold leading-tight tracking-[-0.03em] md:mt-14">{item.title}</h3>
              <p className="mt-3 max-w-[34ch] text-[0.9375rem] leading-[1.6] text-fg-2">{item.text}</p>
            </li>
          ))}
        </ul>

        <div className="glass mt-3 flex flex-col items-start justify-between gap-5 rounded-[28px] p-6 md:mt-4 md:flex-row md:items-center md:p-8" data-reveal>
          <p className="max-w-[44rem] text-[1.0625rem] leading-[1.5] text-fg/85">
            <span className="serif-accent mr-1 text-[1.25em] !text-accent">“</span>
            {c.note}
          </p>
          <a href={contact} className="btn btn-primary btn-chip shrink-0" data-magnetic>
            {c.cta}
            <span className="chip" aria-hidden="true">
              <ArrowRight />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
