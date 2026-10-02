import { privacyPolicy } from '@/content/legal';
import { LegalPage } from '@/components/pages/LegalPage';
import { routes } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata = pageMetadata({
  locale: 'es',
  paths: { es: routes.es.privacy, en: routes.en.privacy },
  title: `Política de privacidad — ${site.name}`,
  description: `Cómo trata ${site.name} los datos que envías por el formulario de contacto.`,
});

export default function Page() {
  return <LegalPage locale="es" doc={privacyPolicy('es')} />;
}
