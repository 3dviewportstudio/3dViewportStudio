import type { CSSProperties, ReactNode } from 'react';
import { t } from '@/content/copy';
import { Picture } from '@/components/ui/Picture';
import { ArrowRight } from '@/components/ui/Icons';
import { sectionIds, type Locale } from '@/lib/routes';
import { site } from '@/lib/site';

/**
 * Convierte cada línea del titular en palabras animadas (desenfoque → nítido, 90 ms entre palabras).
 * Lo que va entre *asteriscos* se pinta como acento en serif cursiva.
 */
function HeadlineLines({ lines }: { lines: readonly string[] }) {
  let w = 0;
  return (
    <>
      {lines.map((line, li) => {
        const parts: ReactNode[] = [];
        line.split(/(\*[^*]+\*)/).forEach((chunk, ci) => {
          if (!chunk) return;
          const accent = chunk.startsWith('*');
          const text = accent ? chunk.slice(1, -1) : chunk;
          text.split(/(\s+)/).forEach((word, wi) => {
            if (!word) return;
            if (/^\s+$/.test(word)) {
              parts.push(' ');
              return;
            }
            parts.push(
              <span key={`${ci}-${wi}`} className={`hw ${accent ? 'serif-accent' : ''}`} style={{ '--w': w++ } as CSSProperties}>
                {word}
              </span>,
            );
          });
        });
        return (
          <span key={li} className="line block">
            {parts}
          </span>
        );
      })}
    </>
  );
}

export function Hero({ locale }: { locale: Locale }) {
  const c = t(locale);
  const contact = `#${sectionIds[locale].contact}`;
  const work = `#${sectionIds[locale].work}`;

  return (
    <section data-hero aria-labelledby="hero-title" className="relative h-svh min-h-[640px] p-2.5 sm:p-3 md:p-4">
      <div className="hero-frame relative isolate flex h-full flex-col overflow-hidden bg-black">
        {/* Render a sangre: en móvil la versión vertical (lila), en escritorio la panorámica (verde) */}
        <div data-hero-media className="absolute inset-x-0 top-0 -z-10 h-[62%] md:h-full">
          <div data-hero-pointer className="hero-settle absolute -inset-[3%]">
            <Picture
              id="pphone-verde"
              mobileId="pphone-lila"
              alt={c.hero.imageAlt}
              sizes="100vw"
              priority
              className="block h-full w-full"
              imgClassName="h-full w-full object-cover object-[50%_40%] md:object-[78%_50%]"
            />
          </div>
        </div>
        {/* Protección del texto: degradados hacia el negro del render, sin velo plano */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/55 via-35% to-transparent to-70%" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden bg-gradient-to-r from-black/80 via-black/30 via-45% to-transparent md:block" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-black/60 to-transparent" />

        {/* Fila superior: disponibilidad y ubicación */}
        <div data-hero-copy className="relative flex items-center justify-between gap-4 px-4 pt-[calc(var(--header-h)+0.75rem)] sm:px-6 md:px-10 md:pt-[calc(var(--header-h)+1.25rem)]">
          <p className="hero-fade glass inline-flex items-center gap-2.5 rounded-full px-3.5 py-2 text-[0.8125rem] font-medium text-fg/90" style={{ '--d': 1 } as CSSProperties}>
            <span className="live-dot" aria-hidden="true" />
            {c.hero.badge}
          </p>
          <p className="hero-fade label-tech hidden !text-fg/60 sm:block" style={{ '--d': 2 } as CSSProperties}>
            Blender · IA · {locale === 'es' ? 'España' : 'Spain'}
          </p>
        </div>

        <div className="flex-1" />

        {/* Bloque inferior: titular a la izquierda, propuesta y CTA a la derecha */}
        <div data-hero-copy className="relative px-4 pb-5 sm:px-6 md:px-10 md:pb-8">
          <div className="max-w-[46rem]">
            <h1 id="hero-title" className="hero-title">
              <span className="sr-only">
                {site.name} — {c.hero.title}
              </span>
              <span aria-hidden="true">
                <HeadlineLines lines={c.hero.lines} />
              </span>
            </h1>

            <p className="hero-fade mt-6 max-w-[31rem] text-[1rem] leading-[1.55] text-fg/80 md:mt-8 md:text-[1.0625rem]" style={{ '--d': 6, textShadow: '0 2px 18px rgb(0 0 0 / .42)' } as CSSProperties}>
              {c.hero.lead}
            </p>
            <div className="hero-fade mt-6 flex flex-wrap items-center gap-2.5" style={{ '--d': 8 } as CSSProperties}>
              <a href={contact} className="btn btn-primary btn-chip" data-magnetic>
                {c.hero.primary}
                <span className="chip" aria-hidden="true">
                  <ArrowRight />
                </span>
              </a>
              <a href={work} className="btn glass px-5 text-fg">
                {c.hero.secondary}
              </a>
            </div>
          </div>

          {/* Franja de datos: una sola línea discreta con separadores finos */}
          <div className="hero-fade mt-7 hidden items-end justify-between gap-6 border-t border-white/12 pt-4 sm:flex md:mt-10" style={{ '--d': 10 } as CSSProperties}>
            <dl className="flex gap-6 sm:gap-10">
              {c.hero.stats.map((s) => (
                <div key={s.label} className="flex flex-col-reverse gap-0.5">
                  <dt className="text-[0.75rem] text-fg/55">{s.label}</dt>
                  <dd className="font-display text-[1.25rem] font-bold tracking-[-0.03em] text-fg tabular-nums md:text-[1.5rem]">{s.value}</dd>
                </div>
              ))}
            </dl>
            <p className="label-tech hidden !text-fg/50 sm:block" aria-hidden="true">
              {c.hero.scroll} ↓
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
