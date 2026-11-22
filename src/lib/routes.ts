export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];

export const ogLocale: Record<Locale, string> = { es: 'es_ES', en: 'en_US' };

/** IDs de las secciones de la home en cada idioma (anclas de navegación). */
export const sectionIds = {
  es: { work: 'trabajo', services: 'servicios', process: 'proceso', about: 'sobre-mi', faq: 'faq', contact: 'contacto' },
  en: { work: 'work', services: 'services', process: 'process', about: 'about', faq: 'faq', contact: 'contact' },
} as const satisfies Record<Locale, Record<string, string>>;

export type SectionKey = keyof (typeof sectionIds)['es'];

export const routes = {
  es: {
    home: '/',
    project: (slug: string) => `/proyectos/${slug}`,
    legal: '/aviso-legal',
    privacy: '/privacidad',
  },
  en: {
    home: '/en',
    project: (slug: string) => `/en/projects/${slug}`,
    legal: '/en/legal-notice',
    privacy: '/en/privacy',
  },
} as const;

/** Enlace a una sección de la home (p. ej. "/#contacto" o "/en#contact"). */
export function sectionHref(locale: Locale, key: SectionKey): string {
  return `${routes[locale].home}#${sectionIds[locale][key]}`;
}

/** Devuelve la ruta equivalente en el otro idioma para el selector de idioma. */
export function translatePath(pathname: string, target: Locale): string {
  const clean = pathname.replace(/\/$/, '') || '/';
  const isEn = clean === '/en' || clean.startsWith('/en/');
  const from: Locale = isEn ? 'en' : 'es';
  if (from === target) return clean;

  const pairs: Array<[string, string]> = [
    [routes.es.legal, routes.en.legal],
    [routes.es.privacy, routes.en.privacy],
  ];
  for (const [es, en] of pairs) {
    if (from === 'es' && clean === es) return en;
    if (from === 'en' && clean === en) return es;
  }

  const esProject = clean.match(/^\/proyectos\/([^/]+)$/);
  if (esProject?.[1]) return routes.en.project(esProject[1]);
  const enProject = clean.match(/^\/en\/projects\/([^/]+)$/);
  if (enProject?.[1]) return routes.es.project(enProject[1]);

  return routes[target].home;
}

export function localeFromPath(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'es';
}
