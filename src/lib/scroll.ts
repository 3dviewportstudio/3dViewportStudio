'use client';

/**
 * Punto único de acceso al scroll suave (Lenis) para que el menú móvil pueda
 * detenerlo y los enlaces de ancla puedan usarlo sin acoplar componentes.
 */
type LenisLike = {
  scrollTo: (target: HTMLElement | number, opts?: { offset?: number; immediate?: boolean; duration?: number }) => void;
  stop: () => void;
  start: () => void;
};

let instance: LenisLike | null = null;

export function setLenis(l: LenisLike | null) {
  instance = l;
}

export function getLenis(): LenisLike | null {
  return instance;
}

export function headerOffset(): number {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--header-h');
  return (parseInt(v, 10) || 64) + 16;
}

export function scrollToElement(el: HTMLElement) {
  const lenis = getLenis();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (lenis) {
    lenis.scrollTo(el, { offset: -headerOffset(), immediate: reduce });
  } else {
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset();
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }
}

export function lockScroll(locked: boolean) {
  const lenis = getLenis();
  if (locked) {
    lenis?.stop();
    document.documentElement.style.overflow = 'hidden';
  } else {
    lenis?.start();
    document.documentElement.style.overflow = '';
  }
}
