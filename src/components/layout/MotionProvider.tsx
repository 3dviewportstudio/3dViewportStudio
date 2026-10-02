'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { scrollToElement, setLenis } from '@/lib/scroll';
import { GIZMO_PITCH, GIZMO_YAW, orientGizmo } from '@/components/ui/Gizmo';

/**
 * Orquesta todo el movimiento de la web en un único sitio:
 * - Revelado de bloques al entrar en pantalla (IntersectionObserver + CSS).
 * - Enlaces de ancla con desplazamiento suave y foco accesible.
 * - Con movimiento permitido: GSAP ScrollTrigger (parallax, texto que se ilumina, líneas de progreso),
 *   y en escritorio con ratón: Lenis, botones magnéticos, parallax del hero y cursor con etiqueta.
 * GSAP y Lenis se cargan bajo demanda para no penalizar la primera carga.
 */
export function MotionProvider() {
  const pathname = usePathname();

  // Revelado al hacer scroll
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)'));
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  // Anclas dentro de la misma página
  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      const anchor = (ev.target as Element | null)?.closest?.('a[href*="#"]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank') return;
      const url = new URL(anchor.href, window.location.href);
      if (url.pathname !== window.location.pathname || !url.hash) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      ev.preventDefault();
      scrollToElement(target);
      window.history.pushState(null, '', url.hash);
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Servicios: el paso que cruza el centro de la pantalla elige el plano del visor.
  // Es estado, no adorno: funciona también con movimiento reducido (el CSS quita el reenfoque).
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observers = Array.from(document.querySelectorAll<HTMLElement>('[data-story]')).map((story) => {
      const steps = Array.from(story.querySelectorAll<HTMLElement>('[data-story-step]'));
      const layers = Array.from(story.querySelectorAll<HTMLElement>('[data-story-layer]'));
      let current = steps.find((step) => step.dataset.on === 'true')?.dataset.storyStep ?? '0';
      const activate = (id: string) => {
        if (id === current) return;
        current = id;
        steps.forEach((step) => {
          step.dataset.on = String(step.dataset.storyStep === id);
        });
        layers.forEach((layer) => {
          layer.dataset.on = String(layer.dataset.storyLayer === id);
          layer.dispatchEvent(new Event('vp-layer'));
        });
      };
      // Banda estrecha en el centro de la ventana: solo un paso la cruza a la vez
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) activate((entry.target as HTMLElement).dataset.storyStep ?? '0');
          }
        },
        { rootMargin: '-48% 0px -48% 0px' },
      );
      steps.forEach((step) => io.observe(step));
      return io;
    });
    return () => observers.forEach((io) => io.disconnect());
  }, [pathname]);

  // La entrada del render del hero se ve una vez por visita: al volver a la portada, la imagen ya está "renderizada"
  useEffect(() => {
    const root = document.documentElement;
    if (root.classList.contains('intro-done') || !document.querySelector('[data-hero]')) return;
    const id = window.setTimeout(() => root.classList.add('intro-done'), 2000);
    return () => window.clearTimeout(id);
  }, [pathname]);

  // Movimiento avanzado
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let disposed = false;
    const cleanups: Array<() => void> = [];

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      // En móvil la barra de direcciones cambia la altura al hacer scroll: no recalcular en cada cambio
      ScrollTrigger.config({ ignoreMobileResize: true });

      if (finePointer) {
        const { default: Lenis } = await import('lenis');
        if (disposed) return;
        const lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
        lenis.on('scroll', ScrollTrigger.update);
        const raf = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);
        setLenis(lenis);
        cleanups.push(() => {
          gsap.ticker.remove(raf);
          lenis.destroy();
          setLenis(null);
        });
      }

      // Escritorio y móvil se configuran por separado; matchMedia las recrea al cruzar el breakpoint
      // (por ejemplo al girar el dispositivo o redimensionar la ventana) y las revierte al desmontar.
      const mm = gsap.matchMedia();
      mm.add({ desktop: '(min-width: 768px)', mobile: '(max-width: 767px)' }, (mmCtx) => {
        const desktop = Boolean(mmCtx.conditions?.desktop);
        // En móvil los desplazamientos se reducen a la mitad
        const k = desktop ? 1 : 0.5;

        // Parallax de medios dentro de su visor (data-parallax = % de recorrido; negativo = sentido contrario)
        gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
          const amount = parseFloat(el.dataset.parallax || '6') * k;
          gsap.fromTo(
            el,
            { yPercent: -amount },
            {
              yPercent: amount,
              ease: 'none',
              scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          );
        });

        // Hero: el render se aleja y el texto se desvanece al bajar
        const hero = document.querySelector<HTMLElement>('[data-hero]');
        if (hero) {
          const media = hero.querySelector('[data-hero-media]');
          const copyEls = hero.querySelectorAll('[data-hero-copy]');
          const tl = gsap.timeline({
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
          });
          if (media) tl.to(media, { yPercent: 10 * k, scale: 1 + 0.05 * k, ease: 'none' }, 0);
          if (copyEls.length) tl.to(copyEls, { y: -60, opacity: 0, ease: 'none' }, 0);
        }

        // Imágenes principales: el encuadre se abre desde un marco compacto hasta ocupar todo su ancho,
        // mientras la imagen se asienta (zoom 1.14 → 1). El marco se escala entero, así que la proporción
        // no cambia y, al terminar, la imagen se ve completa. Al salir por arriba se atenúa (solo escritorio).
        gsap.utils.toArray<HTMLElement>('[data-scale-in]').forEach((el) => {
          const trigger = { trigger: el, start: 'top bottom', end: desktop ? 'top 30%' : 'top 45%', scrub: true };
          gsap.fromTo(el, { scale: desktop ? 0.84 : 0.94 }, { scale: 1, ease: 'none', scrollTrigger: trigger });
          const inner = el.querySelector<HTMLElement>('.vp-media > :first-child:not([data-parallax])');
          if (inner) gsap.fromTo(inner, { scale: desktop ? 1.14 : 1.06 }, { scale: 1, ease: 'none', scrollTrigger: trigger });
          if (desktop) {
            gsap.fromTo(
              el,
              { opacity: 1 },
              { opacity: 0.3, ease: 'none', immediateRender: false, scrollTrigger: { trigger: el, start: 'bottom 45%', end: 'bottom top', scrub: true } },
            );
          }
        });

        // Línea vertical del proceso: avanza con los pasos
        gsap.utils.toArray<HTMLElement>('[data-progress-y]').forEach((el) => {
          gsap.fromTo(
            el,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: 'none',
              transformOrigin: 'center top',
              scrollTrigger: { trigger: el.parentElement ?? el, start: 'top 70%', end: 'bottom 60%', scrub: true },
            },
          );
        });

        // Frases que se iluminan palabra a palabra
        gsap.utils.toArray<HTMLElement>('[data-scrub-words]').forEach((el) => {
          gsap.fromTo(
            el.querySelectorAll('.scrub-word'),
            { opacity: 0.4 },
            {
              opacity: 1,
              stagger: 0.1,
              ease: 'none',
              scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 50%', scrub: true },
            },
          );
        });

        // Líneas de progreso (proceso)
        gsap.utils.toArray<HTMLElement>('[data-progress]').forEach((el) => {
          gsap.fromTo(
            el,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: 'none',
              transformOrigin: 'left center',
              scrollTrigger: { trigger: el.closest('section') ?? el, start: 'top 65%', end: 'bottom 75%', scrub: true },
            },
          );
        });
      });
      cleanups.push(() => mm.revert());

      if (finePointer) {
        // Botones magnéticos
        gsap.utils.toArray<HTMLElement>('[data-magnetic]').forEach((el) => {
          const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
          const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
          const move = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
            yTo((e.clientY - (r.top + r.height / 2)) * 0.32);
          };
          const leave = () => {
            xTo(0);
            yTo(0);
          };
          el.addEventListener('pointermove', move);
          el.addEventListener('pointerleave', leave);
          cleanups.push(() => {
            el.removeEventListener('pointermove', move);
            el.removeEventListener('pointerleave', leave);
            gsap.set(el, { clearProps: 'transform' });
          });
        });

        // Parallax del render del hero con el ratón
        const pointerTarget = document.querySelector<HTMLElement>('[data-hero-pointer]');
        if (pointerTarget) {
          gsap.set(pointerTarget, { scale: 1.04 });
          const xTo = gsap.quickTo(pointerTarget, 'x', { duration: 1.4, ease: 'power3' });
          const yTo = gsap.quickTo(pointerTarget, 'y', { duration: 1.4, ease: 'power3' });
          // El gizmo de ejes gira con la misma "cámara": el parallax se lee como una órbita alrededor del producto
          const gizmo = document.querySelector<HTMLElement>('[data-hero-gizmo]');
          const orbit = { yaw: GIZMO_YAW, pitch: GIZMO_PITCH };
          const yawTo = gsap.quickTo(orbit, 'yaw', { duration: 1.4, ease: 'power3', onUpdate: () => orientGizmo(gizmo, orbit.yaw, orbit.pitch) });
          const pitchTo = gsap.quickTo(orbit, 'pitch', { duration: 1.4, ease: 'power3' });
          const move = (e: PointerEvent) => {
            const nx = e.clientX / window.innerWidth - 0.5;
            const ny = e.clientY / window.innerHeight - 0.5;
            xTo(nx * -22);
            yTo(ny * -14);
            if (gizmo) {
              yawTo(GIZMO_YAW + nx * 1.1);
              pitchTo(GIZMO_PITCH + ny * 0.6);
            }
          };
          window.addEventListener('pointermove', move, { passive: true });
          cleanups.push(() => {
            window.removeEventListener('pointermove', move);
            gsap.set(pointerTarget, { clearProps: 'transform' });
            orientGizmo(gizmo, GIZMO_YAW, GIZMO_PITCH);
          });
        }

        // Contacto: la luz principal sigue al cursor con inercia, como reorientar un foco sobre la escena
        const light = document.querySelector<HTMLElement>('[data-studio-light]');
        const lightHost = light?.closest<HTMLElement>('section');
        if (light && lightHost) {
          const lx = gsap.quickTo(light, 'xPercent', { duration: 2.4, ease: 'power3' });
          const ly = gsap.quickTo(light, 'yPercent', { duration: 2.4, ease: 'power3' });
          const onLight = (e: PointerEvent) => {
            const r = lightHost.getBoundingClientRect();
            // La luz mide el 60 % del ancho y reposa con su centro al 72 %: se desplaza hacia el cursor sin salir de la sección
            lx(gsap.utils.clamp(-75, 33, (((e.clientX - r.left) / r.width - 0.72) / 0.6) * 100));
            ly(gsap.utils.clamp(0, 25, ((e.clientY - r.top) / r.height) * 30));
          };
          lightHost.addEventListener('pointermove', onLight, { passive: true });
          cleanups.push(() => {
            lightHost.removeEventListener('pointermove', onLight);
            gsap.set(light, { clearProps: 'transform' });
          });
        }

        // Cursor con etiqueta sobre los proyectos
        const label = document.createElement('div');
        label.className = 'cursor-label';
        label.setAttribute('aria-hidden', 'true');
        document.body.appendChild(label);
        gsap.set(label, { xPercent: -50, yPercent: -50 });
        const lx = gsap.quickTo(label, 'x', { duration: 0.35, ease: 'power3' });
        const ly = gsap.quickTo(label, 'y', { duration: 0.35, ease: 'power3' });
        const onMove = (e: PointerEvent) => {
          lx(e.clientX);
          ly(e.clientY);
          const el = e.target as Element | null;
          const host = el?.closest?.('[data-cursor]');
          const overControl = el?.closest?.('button, input, select, textarea');
          if (host && !overControl) {
            const text = host.getAttribute('data-cursor') ?? '';
            if (label.textContent !== text) label.textContent = text;
            label.dataset.visible = 'true';
          } else {
            label.dataset.visible = 'false';
          }
        };
        window.addEventListener('pointermove', onMove, { passive: true });
        cleanups.push(() => {
          window.removeEventListener('pointermove', onMove);
          label.remove();
        });
      }

      document.fonts?.ready.then(() => {
        if (!disposed) ScrollTrigger.refresh();
      });
    })();

    return () => {
      disposed = true;
      cleanups.splice(0).reverse().forEach((fn) => fn());
    };
  }, [pathname]);

  return null;
}
