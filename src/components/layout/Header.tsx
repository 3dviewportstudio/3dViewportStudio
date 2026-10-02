'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { t } from '@/content/copy';
import { lockScroll } from '@/lib/scroll';
import { routes, sectionHref, sectionIds, translatePath, type Locale, type SectionKey } from '@/lib/routes';
import { site } from '@/lib/site';
import { ArrowRight, Close, Menu } from '@/components/ui/Icons';

const NAV: SectionKey[] = ['work', 'services', 'process', 'about', 'faq'];

export function Header({ locale }: { locale: Locale }) {
  const c = t(locale);
  const pathname = usePathname() || routes[locale].home;
  const onHome = pathname === routes[locale].home;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<SectionKey | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const href = (key: SectionKey) => (onHome ? `#${sectionIds[locale][key]}` : sectionHref(locale, key));
  const other: Locale = locale === 'es' ? 'en' : 'es';
  const otherHref = translatePath(pathname, other);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Sección visible en la home: se marca en la navegación (aria-current="location")
  useEffect(() => {
    if (!onHome || !('IntersectionObserver' in window)) return;
    const keys = [...NAV, 'contact' as const];
    const els = keys
      .map((k) => ({ k, el: document.getElementById(sectionIds[locale][k]) }))
      .filter((x): x is { k: SectionKey; el: HTMLElement } => !!x.el);
    const seen = new Map<SectionKey, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const k = els.find((x) => x.el === e.target)?.k;
          if (k) seen.set(k, e.isIntersecting);
        }
        const current = keys.find((k) => seen.get(k));
        setActive(current ?? null);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    els.forEach(({ el }) => io.observe(el));
    return () => io.disconnect();
  }, [onHome, locale]);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  // Cerrar el menú al cambiar de página (también con atrás/adelante del navegador)
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(false);
  }

  // Si la ventana pasa a escritorio con el menú abierto, se cierra (el menú móvil deja de existir)
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [open]);

  // Bloqueo de scroll, foco atrapado y tecla Escape mientras el menú está abierto
  useEffect(() => {
    lockScroll(open);
    if (!open) return;
    const panel = panelRef.current;
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []).filter((el) => el.offsetParent !== null);
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = [toggleRef.current, ...focusables()].filter(Boolean) as HTMLElement[];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      lockScroll(false);
    };
  }, [open, close]);

  // Al elegir una sección del menú, el foco pasa a esa sección (lo hace el gestor de anclas); fuera de la home, al botón
  const navLink = (k: SectionKey, className: string, current = false) =>
    onHome ? (
      <a href={href(k)} className={className} aria-current={current ? 'location' : undefined} onClick={() => open && close(false)}>
        {c.nav[k]}
      </a>
    ) : (
      <Link href={href(k)} className={className} onClick={() => open && close(false)}>
        {c.nav[k]}
      </Link>
    );

  const ctaHref = href('contact');

  return (
    <header
      className="site-header fixed inset-x-0 top-0 z-50 h-[var(--header-h)] pt-3"
      // Ancla visual: la cabecera no se mueve ni se funde al cambiar de página
      style={{ viewTransitionName: 'site-header' }}
      data-scrolled={scrolled || open ? 'true' : 'false'}
      data-menu={open ? 'true' : 'false'}
    >
      <div className="container-x h-full">
        <div className="nav-shell flex h-[calc(var(--header-h)-0.75rem)] items-center justify-between gap-4 pl-4 pr-2 sm:pl-5">
          <Link
            href={routes[locale].home}
            className="rounded-full font-display text-[1.0625rem] font-bold tracking-[-0.03em] text-fg"
            aria-label={`${site.name} — ${locale === 'es' ? 'inicio' : 'home'}`}
          >
            Viewport<span className="text-fg-2">Studio3D</span>
          </Link>

          <nav aria-label={c.a11y.mainNav} className="hidden lg:block">
            <ul className="flex items-center">
              {NAV.map((k) => (
                <li key={k}>{navLink(k, 'nav-link', active === k)}</li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-0.5 text-[0.8125rem] font-medium sm:flex" aria-label={c.a11y.language} role="group">
              <span className="rounded-full px-2 py-1 text-fg" aria-current="true">
                {locale.toUpperCase()}
              </span>
              <span aria-hidden="true" className="text-fg-3">
                /
              </span>
              <a href={otherHref} hrefLang={other} lang={other} className="nav-link !px-2 !py-1 !text-[0.8125rem]" aria-label={c.a11y.switchTo}>
                {other.toUpperCase()}
              </a>
            </div>
            {onHome ? (
              <a href={ctaHref} className="btn btn-primary btn-sm" data-magnetic>
                <span className="hidden sm:inline">{c.nav.cta}</span>
                <span className="sm:hidden">{c.nav.ctaShort}</span>
              </a>
            ) : (
              <Link href={ctaHref} className="btn btn-primary btn-sm" data-magnetic>
                <span className="hidden sm:inline">{c.nav.cta}</span>
                <span className="sm:hidden">{c.nav.ctaShort}</span>
              </Link>
            )}
            <button
              ref={toggleRef}
              type="button"
              className="icon-btn h-10 w-10 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? c.a11y.menuClose : c.a11y.menuOpen}
              onClick={() => (open ? close() : setOpen(true))}
            >
              <span className="swap">
                <span data-on={!open}>
                  <Menu />
                </span>
                <span data-on={open}>
                  <Close />
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <div
        id="mobile-menu"
        ref={panelRef}
        className="menu-panel fixed inset-x-0 bottom-0 top-[var(--header-h)] overflow-y-auto bg-bg lg:hidden"
        data-open={open ? 'true' : 'false'}
        aria-hidden={!open}
        inert={!open}
      >
        <nav aria-label={c.a11y.mainNav} className="container-x flex min-h-full flex-col justify-between pb-10 pt-8">
          <ul className="flex flex-col">
            {[...NAV, 'contact' as const].map((k, i) => (
              <li key={k} className="menu-item border-b border-line" style={{ '--i': i } as CSSProperties}>
                {navLink(
                  k,
                  `flex items-center justify-between py-4 font-display text-[2rem] font-bold tracking-[-0.03em] transition-colors duration-200 aria-[current]:text-accent`,
                  active === k,
                )}
              </li>
            ))}
          </ul>
          <div className="menu-item mt-10 flex flex-col gap-6" style={{ '--i': 7 } as CSSProperties}>
            <a href={`mailto:${site.email}`} className="text-lg text-fg-2">
              {site.email}
            </a>
            <div className="flex items-center justify-between gap-4">
              <a href={otherHref} hrefLang={other} lang={other} className="label !text-fg">
                {c.a11y.switchTo}
              </a>
              {onHome ? (
                <a href={ctaHref} className="btn btn-primary" onClick={() => close(false)}>
                  {c.nav.cta}
                  <ArrowRight />
                </a>
              ) : (
                <Link href={ctaHref} className="btn btn-primary" onClick={() => close(false)}>
                  {c.nav.cta}
                  <ArrowRight />
                </Link>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
