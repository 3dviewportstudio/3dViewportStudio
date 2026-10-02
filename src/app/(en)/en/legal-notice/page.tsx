import { legalNotice } from '@/content/legal';
import { LegalPage } from '@/components/pages/LegalPage';
import { routes } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata = pageMetadata({
  locale: 'en',
  paths: { es: routes.es.legal, en: routes.en.legal },
  title: `Legal notice — ${site.name}`,
  description: `Owner details and terms of use of the ${site.name} website.`,
});

export default function Page() {
  return <LegalPage locale="en" doc={legalNotice('en')} />;
}
