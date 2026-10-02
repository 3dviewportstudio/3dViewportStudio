import type { MetadataRoute } from 'next';
import { projects } from '@/content/projects';
import { routes } from '@/lib/routes';
import { absoluteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const pairs: Array<{ es: string; en: string; priority: number }> = [
    { es: routes.es.home, en: routes.en.home, priority: 1 },
    ...projects.map((p) => ({ es: routes.es.project(p.slug), en: routes.en.project(p.slug), priority: 0.8 })),
    { es: routes.es.legal, en: routes.en.legal, priority: 0.2 },
    { es: routes.es.privacy, en: routes.en.privacy, priority: 0.2 },
  ];
  const lastModified = new Date();
  return pairs.flatMap(({ es, en, priority }) => {
    const alternates = { languages: { es: absoluteUrl(es), en: absoluteUrl(en) } };
    return [
      { url: absoluteUrl(es), lastModified, priority, alternates },
      { url: absoluteUrl(en), lastModified, priority, alternates },
    ];
  });
}
