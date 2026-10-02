import type { Metadata } from 'next';
import { ogLocale, type Locale } from './routes';
import { site } from './site';

type PageMeta = {
  locale: Locale;
  /** Ruta de esta página y su equivalente en el otro idioma. */
  paths: Record<Locale, string>;
  title: string;
  description: string;
  /** Nombre base de la imagen Open Graph en /public/og (se añade -es / -en). */
  og?: string;
  ogAlt?: string;
  noindex?: boolean;
};

export function pageMetadata({ locale, paths, title, description, og = 'home', ogAlt, noindex }: PageMeta): Metadata {
  const image = { url: `/og/${og}-${locale}.jpg`, width: 1200, height: 630, alt: ogAlt ?? title };
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: paths[locale],
      languages: { es: paths.es, en: paths.en, 'x-default': paths.es },
    },
    openGraph: {
      type: 'website',
      siteName: site.name,
      url: paths[locale],
      title,
      description,
      locale: ogLocale[locale],
      alternateLocale: [ogLocale[locale === 'es' ? 'en' : 'es']],
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    robots: noindex ? { index: false, follow: true } : undefined,
  };
}
