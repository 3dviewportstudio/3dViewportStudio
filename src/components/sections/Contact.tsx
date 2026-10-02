import { t } from '@/content/copy';
import { CopyEmail } from '@/components/ui/CopyEmail';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { routes, sectionIds, type Locale } from '@/lib/routes';
import { site } from '@/lib/site';
import { ContactForm } from './ContactForm';

export function Contact({ locale }: { locale: Locale }) {
  const c = t(locale).contact;
  return (
    <section id={sectionIds[locale].contact} aria-labelledby="contact-title" className="theme-dark sheet section-y isolate">
      {/* Luz principal ámbar sobre la zona de contacto: con ratón sigue al cursor con inercia (MotionProvider) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          data-studio-light
          className="absolute left-[42%] top-[-35%] h-[80%] w-[60%] bg-[radial-gradient(closest-side,rgb(255_166_64/0.15),rgb(255_166_64/0.05)_55%,transparent)]"
        />
      </div>
      <div className="container-x">
        <SectionLabel>{c.label}</SectionLabel>
        <h2 id="contact-title" className="h-giant mt-8 max-w-[10ch]" data-reveal>
          {c.title}
        </h2>
      </div>
      <div className="container-x mt-16 grid gap-14 md:mt-24 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5">
          <p className="text-lead max-w-[32ch]" data-reveal>
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
