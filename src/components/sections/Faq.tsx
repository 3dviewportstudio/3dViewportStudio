import { t } from '@/content/copy';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Plus } from '@/components/ui/Icons';
import { sectionIds, type Locale } from '@/lib/routes';

export function Faq({ locale }: { locale: Locale }) {
  const c = t(locale);
  return (
    <section id={sectionIds[locale].faq} aria-labelledby="faq-title" className="section-y relative border-t border-line">
      <div className="container-x grid gap-12 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-4">
          <SectionLabel>{c.faq.label}</SectionLabel>
          <h2 id="faq-title" className="h-section mt-6" data-reveal>
            {c.faq.title}
          </h2>
          <p className="mt-6 max-w-[30ch] text-fg-2" data-reveal>
            {c.contact.intro}{' '}
            <a href={`#${sectionIds[locale].contact}`} className="link-u text-fg">
              {c.nav.cta}
            </a>
          </p>
        </div>
        <div className="md:col-span-7 md:col-start-6">
          <ul className="border-t border-line">
            {c.faq.items.map((item) => (
              <li key={item.q} className="border-b border-line">
                <details className="faq-item group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-lg py-6 text-left font-display text-[1.25rem] font-bold tracking-[-0.015em] md:text-[1.375rem]">
                    {item.q}
                    <span aria-hidden="true" className="faq-icon grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line-strong">
                      <Plus />
                    </span>
                  </summary>
                  <p className="max-w-[60ch] pb-7 pr-12 text-fg-2">{item.a}</p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
