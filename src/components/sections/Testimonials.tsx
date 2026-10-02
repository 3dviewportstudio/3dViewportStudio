import { t } from '@/content/copy';
import { testimonials } from '@/content/projects';
import { SectionLabel } from '@/components/ui/SectionLabel';
import type { Locale } from '@/lib/routes';

/** Solo se muestra cuando hay testimonios reales en src/content/projects.ts. */
export function Testimonials({ locale }: { locale: Locale }) {
  if (testimonials.length === 0) return null;
  const c = t(locale).testimonials;
  return (
    <section aria-labelledby="testimonials-title" className="section-y relative border-t border-line">
      <div className="container-x">
        <SectionLabel>{c.label}</SectionLabel>
        <h2 id="testimonials-title" className="h-section mt-6 max-w-[18ch]" data-reveal>
          {c.title}
        </h2>
        <ul className="mt-16 grid gap-6 md:grid-cols-2">
          {testimonials.map((item) => (
            <li key={item.author} className="rounded-[var(--radius-media)] border border-line bg-white/[0.03] p-8 backdrop-blur-md md:p-10" data-reveal>
              <figure>
                <blockquote className="font-display text-2xl font-medium leading-snug tracking-[-0.02em]">“{item.quote[locale]}”</blockquote>
                <figcaption className="mt-8 text-fg-2">
                  <span className="text-fg">{item.author}</span> · {item.role[locale]}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
