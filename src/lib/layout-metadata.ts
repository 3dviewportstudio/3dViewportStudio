import type { Metadata, Viewport } from 'next';
import { copy } from '@/content/copy';
import type { Locale } from './routes';
import { site, siteUrl } from './site';

export function rootMetadata(locale: Locale): Metadata {
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: copy[locale].meta.title, template: `%s — ${site.name}` },
    description: copy[locale].meta.description,
    applicationName: site.name,
    authors: [{ name: site.founder }],
    creator: site.founder,
    formatDetection: { telephone: false, address: false, email: false },
    robots:
      process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production'
        ? { index: false, follow: false }
        : { index: true, follow: true },
  };
}

export const rootViewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};
