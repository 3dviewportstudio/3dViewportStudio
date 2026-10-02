import { Fragment, type CSSProperties } from 'react';
import Link from 'next/link';
import { t } from '@/content/copy';
import { projects } from '@/content/projects';
import { Gizmo } from '@/components/ui/Gizmo';
import { Picture } from '@/components/ui/Picture';
import { RenderTiles } from '@/components/ui/RenderTiles';
import { ArrowRight } from '@/components/ui/Icons';
import { routes, sectionIds, type Locale } from '@/lib/routes';
import { site } from '@/lib/site';

/** Titular por palabras: cada una sube desde su propia máscara (CSS, desfase por índice). */
function Words({ text, offset = 0 }: { text: string; offset?: number }) {
  return text.split(' ').map((word, i, all) => (
    <Fragment key={`${word}-${i}`}>
      <span className="word-mask" aria-hidden="true">
        <span className="word-rise" style={{ '--i': offset + i } as CSSProperties}>
          {word}
        </span>
      </span>
      {i < all.length - 1 ? ' ' : null}
    </Fragment>
  ));
}

/**
 * Sala de proyección a pantalla completa: el render ocupa toda la ventana, a sangre, y el titular se
 * apoya sobre él. La entrada es el render progresivo por cuadrículas (RenderTiles) y las palabras del titular.
 */
export function Hero({ locale }: { locale: Locale }) {
  const c = t(locale);
  const contact = `#${sectionIds[locale].contact}`;
  const heroRender = projects.find((p) => p.slug === 'pphone-17');
  const heroCaption = heroRender?.gallery.find((g) => g.id === 'pphone-verde')?.caption[locale];

  return (
    <section data-hero aria-labelledby="hero-title" className="theme-dark relative isolate flex min-h-svh flex-col overflow-hidden">
      {/* Render a sangre. En móvil ocupa la parte superior; en escritorio, toda la ventana */}
      <div className="hero-media absolute inset-x-0 top-0 -z-10 h-[74svh] md:inset-0 md:h-auto">
        <div data-hero-media className="absolute inset-0">
          <div data-hero-pointer className="absolute inset-0">
            <Picture
              id="pphone-verde"
              mobileId="pphone-lila"
              alt={c.hero.imageAlt}
              sizes="100vw"
              priority
              className="block h-full w-full"
              imgClassName="h-full w-full object-cover object-[50%_40%] md:object-[64%_50%]"
            />
          </div>
          <RenderTiles className="render-tiles--mobile" cols={5} rows={8} focus={[0.5, 0.42]} threads={3} />
          <RenderTiles className="render-tiles--desktop" cols={12} rows={7} focus={[0.68, 0.5]} threads={6} />
        </div>
        {/* Velos de lectura: el texto se apoya sobre negro sin tapar el producto */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/30 via-40% to-black/40" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-black/80 via-black/20 via-45% to-transparent md:block" />
      </div>

      <div className="container-x flex flex-1 flex-col justify-end pb-[calc(var(--sheet-r)+2.5rem)] pt-[56svh] md:pb-[calc(var(--sheet-r)+3.5rem)] md:pt-[calc(var(--header-h)+1.5rem)]">
        <div data-hero-copy className="hero-fade mb-auto flex items-start justify-between gap-6" style={{ '--d': 0 } as CSSProperties}>
          <p className="label-tech !text-fg/80">{c.hero.eyebrow}</p>
          <p className="label-tech hidden !text-fg/80 sm:block">{c.hero.eyebrowSide}</p>
        </div>

        <h1 id="hero-title" data-hero-copy className="mt-6 max-w-[17ch] font-display text-[clamp(2.75rem,7vw,8.25rem)] font-medium leading-[0.9] tracking-[-0.06em] md:mt-0">
          <span className="sr-only">
            {site.name} — {c.hero.title}
          </span>
          <Words text={c.hero.title} />
        </h1>

        <div data-hero-copy className="mt-10 grid gap-10 md:mt-14 md:grid-cols-12 md:items-end md:gap-8">
          <div className="md:col-span-6 lg:col-span-5">
            <p className="hero-fade text-lead !text-fg/85" style={{ '--d': 4 } as CSSProperties}>
              {c.hero.lead}
            </p>
            <div className="hero-fade mt-8 flex flex-wrap items-center gap-3" style={{ '--d': 5 } as CSSProperties}>
              <a href={contact} className="btn btn-primary" data-magnetic>
                {c.hero.primary}
                <ArrowRight />
              </a>
              <Link href={routes[locale].project('fine-nipona')} className="btn btn-ghost">
                {c.hero.secondary}
              </Link>
            </div>
            <p className="hero-fade label mt-6" style={{ '--d': 6 } as CSSProperties}>
              {c.hero.response}
            </p>
          </div>

          {/* Datos del encuadre: gizmo que orbita con el ratón y pie real del render */}
          <div className="hero-fade hidden items-center justify-end gap-4 md:col-span-5 md:col-start-8 md:flex" style={{ '--d': 7 } as CSSProperties} aria-hidden="true">
            <p className="vp-hud text-right leading-relaxed">
              {heroRender?.name}
              <br />
              <span className="text-fg-2">{heroCaption}</span>
            </p>
            <div data-hero-gizmo>
              <Gizmo size={72} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
