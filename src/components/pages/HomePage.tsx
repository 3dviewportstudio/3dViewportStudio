import { testimonials } from '@/content/projects';
import { JsonLd } from '@/components/layout/JsonLd';
import { About } from '@/components/sections/About';
import { Contact } from '@/components/sections/Contact';
import { Faq } from '@/components/sections/Faq';
import { Hero } from '@/components/sections/Hero';
import { Problem } from '@/components/sections/Problem';
import { Process } from '@/components/sections/Process';
import { Services } from '@/components/sections/Services';
import { Testimonials } from '@/components/sections/Testimonials';
import { Work } from '@/components/sections/Work';
import type { Locale } from '@/lib/routes';
import { homeJsonLd } from '@/lib/structured-data';

export function HomePage({ locale }: { locale: Locale }) {
  return (
    <>
      <JsonLd data={homeJsonLd(locale)} />
      <Hero locale={locale} />
      <Problem locale={locale} />
      <Work locale={locale} />
      <Services locale={locale} />
      <Process locale={locale} />
      <About locale={locale} />
      {testimonials.length > 0 ? <Testimonials locale={locale} /> : null}
      <Faq locale={locale} />
      <Contact locale={locale} />
    </>
  );
}
