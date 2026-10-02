import type { CSSProperties } from 'react';
import Link from 'next/link';
import { t } from '@/content/copy';
import { projects } from '@/content/projects';
import { Gizmo } from '@/components/ui/Gizmo';
import { Picture } from '@/components/ui/Picture';
import { ArrowRight } from '@/components/ui/Icons';
import { routes, sectionIds, type Locale } from '@/lib/routes';
import { site } from '@/lib/site';

const WORD_A = 'Viewport';
const WORD_B = 'Studio3D';

function Chars({ text, offset, dim }: { text: string; offset: number; dim?: boolean }) {
  return (
    <span className={`wordmark-mask inline-block ${dim ? 'text-fg-2' : ''}`} aria-hidden="true">
      {text.split('').map((ch, i) => (
        <span key={i} className="wordmark-char" style={{ '--i': offset + i } as CSSProperties}>
          {ch}
        </span>
      ))}
    </span>
  );
}

export function Hero({ locale }: { locale: Locale }) {
  const c = t(locale);
  const contact = `#${sectionIds[locale].contact}`;
  const heroRender = projects.find((p) => p.slug === 'pphone-17');
  const heroCaption = heroRender?.gallery.find((g) => g.id === 'pphone-verde')?.caption[locale];

  return (
    <section
      data-hero
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-svh flex-col overflow-hidden bg-black pt-[var(--header-h)]"
    >
      {/* Bloque superior: marca y propuesta */}
      <div data-hero-copy className="container-x relative z-10 pt-6 md:pt-10">
        <div className="hero-fade flex items-center justify-between gap-6" style={{ '--d': 0 } as CSSProperties}>
          <p className="label">{c.hero.eyebrow}</p>
          <p className="label hidden sm:block">{c.hero.eyebrowSide}</p>
        </div>

        <h1 id="hero-title" className="mt-6 md:mt-8">
          <span className="sr-only">{site.name} — </span>
          <span className="wordmark block text-[clamp(4.25rem,21vw,7rem)] md:whitespace-nowrap md:text-[clamp(4rem,11.2vw,12.5rem)]">
            <Chars text={WORD_A} offset={0} />
            <span className="block md:inline" />
            <Chars text={WORD_B} offset={WORD_A.length} dim />
          </span>
          <span
            className="hero-fade mt-6 block max-w-[20ch] font-display text-[clamp(1.625rem,6.6vw,2.25rem)] font-bold leading-[1.08] tracking-[-0.03em] md:mt-10 md:max-w-[24ch] md:text-[clamp(2.25rem,3.4vw,3.5rem)]"
            style={{ '--d': 2 } as CSSProperties}
          >
            {c.hero.title}
          </span>
        </h1>
      </div>

      {/* Render: en móvil ocupa su propio espacio; en escritorio es el fondo de la derecha */}
      <div className="hero-media relative -z-0 mt-2 h-[min(118vw,560px)] md:absolute md:inset-x-0 md:bottom-0 md:top-[26%] md:mt-0 md:h-auto">
        <div data-hero-media className="absolute inset-0">
          <div data-hero-pointer className="absolute inset-0">
            <Picture
              id="pphone-verde"
              mobileId="pphone-lila"
              alt={c.hero.imageAlt}
              sizes="100vw"
              priority
              className="block h-full w-full"
              imgClassName="h-full w-full object-cover object-[50%_55%] md:object-[70%_50%]"
            />
          </div>
        </div>
        {/* Fundidos para integrar el render con la página y asegurar el contraste del texto */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black via-transparent via-25% to-bg" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-black via-black/40 via-40% to-transparent md:block" />
      </div>
      {/* Fundido final fijo (fuera de la capa con parallax) para enlazar el negro del render con el grafito de la página */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-40 bg-gradient-to-b from-transparent to-bg" />

      {/* Bloque inferior: por qué contactar */}
      <div data-hero-copy className="container-x relative z-10 pb-12 md:mt-auto md:flex md:items-end md:justify-between md:gap-10 md:pb-16">
        <div className="max-w-[34rem]">
          <p className="hero-fade text-lead !text-fg/85" style={{ '--d': 3 } as CSSProperties}>
            {c.hero.lead}
          </p>
          <div className="hero-fade mt-8 flex flex-wrap items-center gap-3" style={{ '--d': 4 } as CSSProperties}>
            <a href={contact} className="btn btn-primary" data-magnetic>
              {c.hero.primary}
              <ArrowRight />
            </a>
            <Link href={routes[locale].project('fine-nipona')} className="btn btn-ghost">
              {c.hero.secondary}
            </Link>
          </div>
          <p className="hero-fade label mt-6" style={{ '--d': 5 } as CSSProperties}>
            {c.hero.response}
          </p>
        </div>

        {/* Datos del encuadre: gizmo de ejes que sigue a la "cámara" (el ratón) y pie real del render */}
        <div className="hero-fade hidden shrink-0 items-center gap-4 md:flex" style={{ '--d': 6 } as CSSProperties} aria-hidden="true">
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
    </section>
  );
}
