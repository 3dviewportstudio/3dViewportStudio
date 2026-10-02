import Link from 'next/link';
import { t } from '@/content/copy';
import { routes, sectionHref, type Locale } from '@/lib/routes';
import { PageTransition } from '@/components/layout/Transitions';

export function NotFoundView({ locale }: { locale: Locale }) {
  const c = t(locale).notFound;
  return (
    <PageTransition>
      <section className="container-x flex min-h-[80svh] flex-col justify-center pb-24 pt-[calc(var(--header-h)+3rem)]">
        <p className="label">404</p>
        <h1 className="mt-6 max-w-[16ch] font-display text-[clamp(2.75rem,7vw,6rem)] font-bold leading-none tracking-[-0.04em]">{c.title}</h1>
        <p className="text-lead mt-6 max-w-[44ch]">{c.text}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href={routes[locale].home} className="btn btn-primary">
            {c.home}
          </Link>
          <Link href={sectionHref(locale, 'work')} className="btn btn-ghost">
            {c.work}
          </Link>
        </div>
      </section>
    </PageTransition>
  );
}
