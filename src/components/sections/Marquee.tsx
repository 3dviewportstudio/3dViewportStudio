import { t } from '@/content/copy';
import type { Locale } from '@/lib/routes';

/** Banda infinita con lo que hago: la lista se repite dos veces para que el bucle no tenga corte. */
export function Marquee({ locale }: { locale: Locale }) {
  const items = t(locale).marquee;
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <li key={item} className="flex items-center whitespace-nowrap font-display text-[clamp(2rem,5vw,4.5rem)] font-bold tracking-[-0.04em] text-fg/90">
          <span className="px-5 md:px-8">{item}</span>
          <svg viewBox="0 0 24 24" className="h-[0.45em] w-[0.45em] text-accent" aria-hidden="true">
            <path fill="currentColor" d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0Z" />
          </svg>
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label={items.join(', ')} className="marquee overflow-hidden border-y border-line py-8 md:py-12">
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}
