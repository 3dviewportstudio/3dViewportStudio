import type { CSSProperties } from 'react';
import { serviceIds, t, type ServiceId } from '@/content/copy';
import type { GalleryItem } from '@/content/projects';
import { Media } from '@/components/ui/Media';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { ArrowRight } from '@/components/ui/Icons';
import { sectionIds, type Locale } from '@/lib/routes';

/** Cada servicio se ilustra con una pieza real del portfolio. */
const SERVICE_MEDIA: Record<ServiceId, { kind: 'image' | 'video'; id: string }> = {
  packshots: { kind: 'image', id: 'fine-nipona-matcha' },
  lifestyle: { kind: 'image', id: 'fine-nipona-escena' },
  animation: { kind: 'video', id: 'fine-nipona-gama-film' },
};

/**
 * Bento de 6 columnas en escritorio, sin celdas vacías (grid-flow-dense):
 * fila 1 → packshots (4) + animación (2, ocupa dos filas); fila 2 → lifestyle (4) + animación.
 */
const LAYOUT: Record<ServiceId, { cell: string; inner: string; mediaOrder: string }> = {
  packshots: { cell: 'lg:col-span-4', inner: 'sm:grid-cols-2', mediaOrder: '' },
  lifestyle: { cell: 'lg:col-span-4', inner: 'sm:grid-cols-2', mediaOrder: 'sm:order-2' },
  animation: { cell: 'lg:col-span-2 lg:row-span-2 lg:col-start-5 lg:row-start-1', inner: 'sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-[auto_1fr]', mediaOrder: '' },
};

function serviceMedia(id: ServiceId, alt: string): GalleryItem {
  const { kind, id: mediaId } = SERVICE_MEDIA[id];
  return { kind, id: mediaId, alt: { es: alt, en: alt }, caption: { es: '', en: '' } };
}

export function Services({ locale }: { locale: Locale }) {
  const c = t(locale).services;
  const contact = `#${sectionIds[locale].contact}`;

  return (
    <section id={sectionIds[locale].services} aria-labelledby="services-title" className="section-y relative border-t border-line">
      <div className="container-x">
        <SectionLabel>{c.label}</SectionLabel>
        <h2 id="services-title" className="h-section mt-6 max-w-[22ch]" data-reveal>
          {c.title}
        </h2>

        <ul className="mt-16 grid grid-flow-dense gap-4 md:mt-24 lg:grid-cols-6 lg:gap-5">
          {serviceIds.map((id, i) => {
            const s = c.items[id];
            const l = LAYOUT[id];
            return (
              <li
                key={id}
                className={`grid gap-6 rounded-[26px] border border-line bg-bg-2 p-3 sm:gap-8 ${l.inner} ${l.cell}`}
                data-reveal
                style={{ '--d': i } as CSSProperties}
              >
                <div className={l.mediaOrder}>
                  <Media item={serviceMedia(id, s.mediaAlt)} locale={locale} ratio="4 / 5" sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw" />
                </div>
                <div className="flex flex-col px-3 pb-4 sm:py-4">
                  <h3 className="font-display text-[1.75rem] font-bold leading-tight tracking-[-0.025em]">{s.name}</h3>
                  <p className="mt-3 text-fg-2">{s.text}</p>
                  <div className="mt-6 border-t border-line pt-5">
                    <p className="label">{c.includes}</p>
                    <ul className="mt-3 space-y-2 text-[0.9375rem]">
                      {s.includes.map((inc) => (
                        <li key={inc} className="flex gap-3">
                          <span aria-hidden="true" className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-accent" />
                          {inc}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="mt-5 flex items-baseline justify-between gap-4 border-t border-line pt-5 text-[0.9375rem]">
                    <span className="label">{c.timing}</span>
                    <span className="font-medium">{s.timing}</span>
                  </p>
                  <div className="mt-auto pt-8">
                    <a href={contact} data-service={id} className="btn btn-ghost" aria-label={`${c.cta}: ${s.name}`}>
                      {c.cta}
                      <ArrowRight />
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
