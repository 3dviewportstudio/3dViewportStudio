import { t } from '@/content/copy';
import type { LegalDoc } from '@/content/legal';
import type { Locale } from '@/lib/routes';

export function LegalPage({ locale, doc }: { locale: Locale; doc: LegalDoc }) {
  const c = t(locale).project;
  return (
    <article className="container-x pb-24 pt-[calc(var(--header-h)+3rem)] md:pb-32 md:pt-[calc(var(--header-h)+5rem)]">
      <h1 className="font-display text-[clamp(2.75rem,7vw,5.5rem)] font-bold leading-none tracking-[-0.04em]">{doc.title}</h1>
      <p className="label mt-6">
        {c.updated}: {doc.updated}
      </p>
      <div className="mt-14 grid gap-10 md:grid-cols-12 md:gap-8">
        {doc.intro ? <p className="text-lead md:col-span-8">{doc.intro}</p> : null}
        <div className="space-y-12 md:col-span-8">
          {doc.sections.map((s) => (
            <section key={s.heading} className="border-t border-line pt-6">
              <h2 className="font-display text-2xl font-bold tracking-[-0.02em]">{s.heading}</h2>
              <div className="mt-4 space-y-3 text-fg-2">
                {s.body.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
