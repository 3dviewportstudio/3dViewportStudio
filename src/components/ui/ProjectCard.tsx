import Link from 'next/link';
import type { Project } from '@/content/projects';
import { Media } from '@/components/ui/Media';
import { ArrowUpRight } from '@/components/ui/Icons';
import { routes, type Locale } from '@/lib/routes';

type Props = {
  project: Project;
  locale: Locale;
  /** Texto del enlace (p. ej. `copy.work.viewCase`). */
  label: string;
  className?: string;
};

/**
 * Tarjeta de proyecto compacta, reutilizable en rejillas y "más proyectos".
 * Toda la tarjeta es un único enlace accesible (el ::after del título cubre el área).
 */
export function ProjectCard({ project, locale, label, className = '' }: Props) {
  const client = project.kind === 'client';

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-[var(--radius-media)] border border-line bg-bg-2 transition-[border-color,transform] duration-300 ease-[var(--ease-out)] hover:-translate-y-1 hover:border-line-strong focus-within:border-accent ${className}`}
    >
      <Media item={project.cover.primary} locale={locale} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 94vw" ratio="4 / 3" />

      <div className="flex flex-1 flex-col gap-4 p-6">
        <p className="label flex flex-wrap items-center gap-x-3 gap-y-2">
          <span
            className={`inline-flex h-7 items-center rounded-full border px-3 ${client ? 'border-accent/40 bg-accent/10 text-accent-2' : 'border-line-strong text-fg'}`}
          >
            {project.kindLabel[locale]}
          </span>
          <span>{project.sector[locale]}</span>
        </p>

        <h3 className="font-display text-2xl font-bold leading-tight tracking-[-0.03em]">
          <Link
            href={routes[locale].project(project.slug)}
            className="after:absolute after:inset-0 after:z-[1] after:content-[''] focus-visible:outline-none"
          >
            {project.name}
          </Link>
        </h3>

        <p className="text-fg-2">{project.summary[locale]}</p>

        <p className="label mt-auto !text-fg-3">{project.deliverables[locale]}</p>

        <span className="inline-flex items-center gap-2 font-medium text-fg">
          <span className="link-u">{label}</span>
          <ArrowUpRight className="transition-transform duration-300 ease-[var(--ease-out)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  );
}
