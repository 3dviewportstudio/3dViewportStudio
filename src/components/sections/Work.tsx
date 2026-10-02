import Link from 'next/link';
import { t } from '@/content/copy';
import { projects, type Project } from '@/content/projects';
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
        className={`inline-flex h-7 items-center rounded-full border px-3 ${client ? 'border-accent/40 bg-accent/10 text-accent-2' : 'border-line-strong text-fg'}`}
      >
        {project.kindLabel[locale]}
      </span>
      <span>{project.sector[locale]}</span>
    </p>
  );
}

function CaseLink({ project, locale, label }: { project: Project; locale: Locale; label: string }) {
  return (
    <Link
      href={routes[locale].project(project.slug)}
      className="group/link mt-8 inline-flex items-center gap-2 font-medium text-fg after:absolute after:inset-0 after:z-[1] after:content-['']"
    >
      <span className="link-u">
        {label}
        <span className="sr-only">: {project.name}</span>
      </span>
      <ArrowUpRight className="transition-transform duration-300 ease-[var(--ease-out)] group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
    </Link>
  );
}

export function Work({ locale }: { locale: Locale }) {
  const c = t(locale).work;

  return (
    <section id={sectionIds[locale].work} aria-labelledby="work-title" className="section-y relative scroll-mt-20">
      <div className="container-x">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <SectionLabel>{c.label}</SectionLabel>
            <h2 id="work-title" className="h-section mt-6 max-w-[20ch]" data-reveal>
              {c.title}
            </h2>
          </div>
          <p className="text-lead max-w-[38ch] md:col-span-4 md:col-start-9" data-reveal>
            {c.intro}
          </p>
        </div>

        <div className="mt-20 flex flex-col gap-28 md:mt-28 md:gap-40">
          {projects.map((project) => {
            if (project.cover.layout === 'pair' && project.cover.secondary) {
              return (
                <article key={project.slug} className="vp-group relative grid gap-10 md:grid-cols-12 md:gap-8" data-cursor={c.cursor}>
                  <div className="md:col-span-4 md:self-center" data-reveal>
                    <Meta project={project} locale={locale} />
                    <h3 className="mt-6 font-display text-[clamp(2.5rem,4.6vw,4.25rem)] font-bold leading-none tracking-[-0.04em]">
                      {project.name}
                    </h3>
                    <p className="mt-5 max-w-[40ch] text-fg-2">{project.summary[locale]}</p>
                    <p className="label mt-6 !text-fg-3">{project.deliverables[locale]}</p>
                    <CaseLink project={project} locale={locale} label={c.viewCase} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 md:col-span-8 md:gap-6">
                    <Media item={project.cover.primary} locale={locale} sizes="(min-width: 768px) 30vw, 46vw" interactive parallax={-3} />
                    <Media
                      item={project.cover.secondary}
                      locale={locale}
                      sizes="(min-width: 768px) 30vw, 46vw"
                      interactive
                      parallax
                      className="mt-16 md:mt-28"
                    />
                  </div>
                </article>
              );
            }
            return (
              <article key={project.slug} className="vp-group relative" data-cursor={c.cursor}>
                {/* Crece al entrar en pantalla y se oscurece al salir (GSAP, en MotionProvider) */}
                <div data-scale-in>
                  <Media item={project.cover.primary} locale={locale} sizes="(min-width: 1440px) 1344px, 94vw" interactive />
                </div>
                <div className="mt-10 grid gap-6 md:grid-cols-12 md:gap-8" data-reveal>
                  <div className="md:col-span-5">
                    <Meta project={project} locale={locale} />
                    <h3 className="mt-6 font-display text-[clamp(2.5rem,4.6vw,4.25rem)] font-bold leading-none tracking-[-0.04em]">
                      {project.name}
                    </h3>
                  </div>
                  <div className="md:col-span-5 md:col-start-8">
                    <p className="max-w-[44ch] text-fg-2">{project.summary[locale]}</p>
                    <p className="label mt-6 !text-fg-3">{project.deliverables[locale]}</p>
                    <CaseLink project={project} locale={locale} label={c.viewCase} />
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
