import { copy } from '@/content/copy';
import type { Project } from '@/content/projects';
import { image, largestSrc } from '@/content/media';
import { routes, sectionHref, type Locale } from './routes';
import { absoluteUrl, site, siteUrl } from './site';

const ORG_ID = () => `${siteUrl()}/#studio`;
const PERSON_ID = () => `${siteUrl()}/#lucas`;
const SITE_ID = () => `${siteUrl()}/#website`;

function studio(locale: Locale) {
  const c = copy[locale];
  return {
    '@type': 'ProfessionalService',
    '@id': ORG_ID(),
    name: site.name,
    url: absoluteUrl(routes[locale].home),
    email: site.email,
    description: c.meta.description,
    image: absoluteUrl(largestSrc(image('pphone-verde'))),
    logo: absoluteUrl('/icon.svg'),
    founder: { '@id': PERSON_ID() },
    address: { '@type': 'PostalAddress', addressCountry: site.country },
    areaServed: 'Worldwide',
    knowsLanguage: ['es', 'en'],
    makesOffer: Object.values(c.services.items).map((s) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: s.name, description: s.text },
    })),
  };
}

function person(locale: Locale) {
  return {
    '@type': 'Person',
    '@id': PERSON_ID(),
    name: site.founder,
    jobTitle: locale === 'es' ? 'Fundador y artista 3D de producto' : 'Founder & 3D product artist',
    worksFor: { '@id': ORG_ID() },
    knowsAbout: ['3D product rendering', 'Blender', 'Product animation', 'CGI'],
  };
}

export function homeJsonLd(locale: Locale) {
  const c = copy[locale];
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': SITE_ID(),
        url: absoluteUrl(routes[locale].home),
        name: site.name,
        inLanguage: locale,
        publisher: { '@id': ORG_ID() },
      },
      studio(locale),
      person(locale),
      {
        '@type': 'FAQPage',
        inLanguage: locale,
        mainEntity: c.faq.items.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  };
}

export function projectJsonLd(locale: Locale, project: Project) {
  const c = copy[locale];
  const url = absoluteUrl(routes[locale].project(project.slug));
  const cover = project.cover.primary.kind === 'image' ? image(project.cover.primary.id) : image(`${project.cover.primary.id}-poster`);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      studio(locale),
      person(locale),
      {
        '@type': 'CreativeWork',
        name: project.name,
        url,
        inLanguage: locale,
        description: project.summary[locale],
        genre: project.discipline[locale],
        image: absoluteUrl(largestSrc(cover)),
        creator: { '@id': PERSON_ID() },
        publisher: { '@id': ORG_ID() },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: site.name, item: absoluteUrl(routes[locale].home) },
          { '@type': 'ListItem', position: 2, name: c.project.breadcrumb, item: absoluteUrl(sectionHref(locale, 'work')) },
          { '@type': 'ListItem', position: 3, name: project.name, item: url },
        ],
      },
    ],
  };
}
