import type { Metadata } from 'next';
import { getProject, projects } from '@/content/projects';
import { routes, type Locale } from './routes';
import { site } from './site';
import { pageMetadata } from './seo';

export function projectStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export function projectMetadata(locale: Locale, slug: string): Metadata {
  const project = getProject(slug);
  if (!project) return {};
  const kind = project.kindLabel[locale];
  return pageMetadata({
    locale,
    paths: { es: routes.es.project(slug), en: routes.en.project(slug) },
    title: `${project.name} · ${project.discipline[locale]} — ${site.name}`,
    description: `${kind}. ${project.summary[locale]}`,
    og: project.ogImage,
    ogAlt: project.name,
  });
}
