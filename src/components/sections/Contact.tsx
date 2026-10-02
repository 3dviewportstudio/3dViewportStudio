import { t } from '@/content/copy';
import { CopyEmail } from '@/components/ui/CopyEmail';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { routes, sectionIds, type Locale } from '@/lib/routes';
import { site } from '@/lib/site';
import { ContactForm } from './ContactForm';

export function Contact({ locale }: { locale: Locale }) {
  const c = t(locale).contact;
  return (
    <section id={sectionIds[locale].contact} aria-labelledby="contact-title" className="section-y relative isolate border-t border-line">
      {/* Luz principal ámbar sobre la zona de contacto */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70%] bg-[radial-gradient(55%_60%_at_72%_0%,rgb(255_166_64/0.12),transparent_70%)]" />
      <div className="container-x grid gap-14 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5">
          <SectionLabel>{c.label}</SectionLabel>
          <h2 id="contact-title" className="mt-6 max-w-[11ch] font-display text-[clamp(3rem,6vw,5.75rem)] font-bold leading-[0.95] tracking-[-0.045em]" data-reveal>
            {c.title}
          </h2>
          <p className="text-lead mt-8 max-w-[32ch]" data-reveal>
            {c.intro}
          </p>
          <div className="mt-12 border-t border-line pt-6" data-reveal>
            <p className="label">{c.emailLabel}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <a href={`mailto:${site.email}`} className="link-u break-all text-xl text-fg md:text-2xl">
                {site.email}
              </a>
              <CopyEmail email={site.email} copyLabel={c.copy} copiedLabel={c.copied} />
            </div>
          </div>
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <ContactForm locale={locale} privacyHref={routes[locale].privacy} />
        </div>
      </div>
    </section>
  );
}
