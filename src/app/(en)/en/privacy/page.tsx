import { privacyPolicy } from '@/content/legal';
import { LegalPage } from '@/components/pages/LegalPage';
import { routes } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata = pageMetadata({
  locale: 'en',
  paths: { es: routes.es.privacy, en: routes.en.privacy },
  title: `Privacy policy — ${site.name}`,
  description: `How ${site.name} handles the data you send through the contact form.`,
});

export default function Page() {
  return <LegalPage locale="en" doc={privacyPolicy('en')} />;
}
