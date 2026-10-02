import { legalNotice } from '@/content/legal';
import { LegalPage } from '@/components/pages/LegalPage';
import { routes } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata = pageMetadata({
  locale: 'es',
  paths: { es: routes.es.legal, en: routes.en.legal },
  title: `Aviso legal — ${site.name}`,
  description: `Datos del titular y condiciones de uso de la web de ${site.name}.`,
});

export default function Page() {
  return <LegalPage locale="es" doc={legalNotice('es')} />;
}
