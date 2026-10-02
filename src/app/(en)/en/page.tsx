import { copy } from '@/content/copy';
import { HomePage } from '@/components/pages/HomePage';
import { routes } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  locale: 'en',
  paths: { es: routes.es.home, en: routes.en.home },
  title: copy.en.meta.title,
  description: copy.en.meta.description,
  og: 'home',
});

export default function Page() {
  return <HomePage locale="en" />;
}
