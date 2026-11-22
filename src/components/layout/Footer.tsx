import Link from 'next/link';
import { t } from '@/content/copy';
import { routes, sectionHref, type Locale, type SectionKey } from '@/lib/routes';
import { site } from '@/lib/site';
import { ArrowUp } from '@/components/ui/Icons';

const NAV: SectionKey[] = ['work', 'services', 'process', 'about', 'faq', 'contact'];

export function Footer({ locale }: { locale: Locale }) {
  const c = t(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto border-t border-line bg-bg">
      <div className="container-x pb-10 pt-20 md:pt-28">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="font-display text-2xl font-bold tracking-[-0.03em]">
              Viewport<span className="text-fg-2">Studio3D</span>
            </p>
            <p className="mt-4 max-w-sm text-fg-2">{c.footer.tagline}</p>
          </div>

          <nav aria-label={c.footer.navTitle} className="md:col-span-3">
            <p className="label">{c.footer.navTitle}</p>
            <ul className="mt-5 space-y-2.5">
              {NAV.map((k) => (
                <li key={k}>
                  <Link href={sectionHref(locale, k)} className="link-u text-fg-2 transition-colors hover:text-fg">
                    {c.nav[k]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-4">
            <p className="label">{c.footer.contactTitle}</p>
            <p className="mt-5">
              <a href={`mailto:${site.email}`} className="link-u text-lg text-fg">
                {site.email}
              </a>
            </p>
            <p className="mt-2 text-sm text-fg-2">{c.hero.response}</p>

            <p className="label mt-10">{c.footer.legalTitle}</p>
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
              <li>
                <Link href={routes[locale].legal} className="link-u text-fg-2 transition-colors hover:text-fg">
                  {c.footer.legal}
                </Link>
              </li>
              <li>
                <Link href={routes[locale].privacy} className="link-u text-fg-2 transition-colors hover:text-fg">
                  {c.footer.privacy}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 1000 124"
          className="pointer-events-none mt-20 block w-full select-none"
        >
          <text
            x="0"
            y="100"
            textLength="1000"
            lengthAdjust="spacingAndGlyphs"
            fill="currentColor"
            className="text-fg/[0.07]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 126, letterSpacing: '-0.055em' }}
          >
            ViewportStudio3D
          </text>
        </svg>

        <div className="mt-8 flex flex-col-reverse items-start justify-between gap-4 border-t border-line pt-6 text-sm text-fg-3 sm:flex-row sm:items-center">
          <p>
            © {year} {site.name} · {site.founder}. {c.footer.rights}
          </p>
          <a href="#top" className="inline-flex items-center gap-2 text-fg-2 transition-colors hover:text-fg">
            {c.a11y.backToTop}
            <ArrowUp />
          </a>
        </div>
      </div>
    </footer>
  );
}
