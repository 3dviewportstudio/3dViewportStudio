import Link from 'next/link';
import { t } from '@/content/copy';
import { projects, type Project } from '@/content/projects';
import { SharedMedia } from '@/components/layout/Transitions';
import { Media } from '@/components/ui/Media';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { ArrowUpRight } from '@/components/ui/Icons';
import { routes, sectionIds, type Locale } from '@/lib/routes';

/** Tipo de proyecto (cliente real o propio, siempre explícito) y sector. */
function Meta({ project, locale }: { project: Project; locale: Locale }) {
  const client = project.kind === 'client';
  return (
    <p className="label flex flex-wrap items-center gap-x-3 gap-y-2">
      <span
        className={`inline-flex h-7 items-center rounded-full border px-3 ${client ? 'border-accent/50 bg-accent/10 text-accent-2' : 'border-line-strong text-fg'}`}
      >
        {project.kindLabel[locale]}
      </span>
      <span>{project.sector[locale]}</span>
    </p>
  );
}

/**
 * Sala de proyección: cada proyecto es un capítulo. El nombre a escala gigante, la pieza a gran tamaño
 * (la portada principal viaja a la página del caso al abrirlo) y una línea con el resumen y el enlace.
 * Todo el capítulo es clicable (enlace extendido) y el cursor muestra "Ver caso".
 */
export function Work({ locale }: { locale: Locale }) {
  const c = t(locale).work;

  return (
    <section id={sectionIds[locale].work} aria-labelledby="work-title" className="theme-dark sheet section-y scroll-mt-20">
      <div className="container-x">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <SectionLabel>{c.label}</SectionLabel>
            <h2 id="work-title" className="h-section mt-6 max-w-[16ch]" data-reveal>
              {c.title}
            </h2>
          </div>
          <p className="text-lead max-w-[34ch] md:col-span-4" data-reveal>
            {c.intro}
          </p>
        </div>

        <div className="mt-24 flex flex-col gap-32 md:mt-36 md:gap-48">
          {projects.map((project) => {
            const pair = project.cover.layout === 'pair' && project.cover.secondary;
            return (
              <article key={project.slug} className="vp-group relative" data-cursor={c.cursor}>
                <div className="mb-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-6 md:mb-12" data-reveal>
                  <h3 className="h-giant">{project.name}</h3>
                  <Meta project={project} locale={locale} />
                </div>

                {pair && project.cover.secondary ? (
                  <div className="grid grid-cols-2 gap-3 md:gap-5">
                    <SharedMedia id={project.cover.primary.id}>
                      <Media item={project.cover.primary} locale={locale} ratio="4 / 5" sizes="(min-width: 768px) 46vw, 46vw" interactive parallax={-3} />
                    </SharedMedia>
                    <Media item={project.cover.secondary} locale={locale} ratio="4 / 5" sizes="(min-width: 768px) 46vw, 46vw" interactive parallax />
                  </div>
                ) : (
                  // Crece al entrar en pantalla y se oscurece al salir (GSAP, en MotionProvider)
                  <div data-scale-in>
                    <SharedMedia id={project.cover.primary.id}>
                      <Media item={project.cover.primary} locale={locale} sizes="(min-width: 1440px) 1344px, 94vw" interactive />
                    </SharedMedia>
                  </div>
                )}

                <div className="mt-8 grid gap-6 md:mt-10 md:grid-cols-12 md:items-start md:gap-8" data-reveal>
                  <p className="max-w-[46ch] text-lead md:col-span-6">{project.summary[locale]}</p>
                  <div className="flex flex-col gap-6 md:col-span-4 md:col-start-9 md:items-end md:text-right">
                    <p className="label-tech">{project.deliverables[locale]}</p>
                    <Link
                      href={routes[locale].project(project.slug)}
                      className="btn btn-ghost group/link self-start after:absolute after:inset-0 after:z-[1] after:content-[''] md:self-end"
                      // Sin posición propia: el ::after se extiende a todo el capítulo (enlace extendido)
                      style={{ position: 'static' }}
                    >
                      {c.viewCase}
                      <span className="sr-only">: {project.name}</span>
                      <ArrowUpRight className="transition-transform duration-300 ease-[var(--ease-out)] group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
