'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { VideoAsset } from '@/content/media';
import { Pause, Play } from './Icons';

type Props = {
  asset: VideoAsset;
  /** Descripción accesible del contenido del vídeo. */
  label: string;
  playLabel: string;
  pauseLabel: string;
  /** Póster renderizado en el servidor (<Picture>) que se oculta al empezar la reproducción. */
  poster: ReactNode;
  hud?: string;
  className?: string;
};

/**
 * Vídeo en bucle, silencioso, que solo se descarga y reproduce cuando está en pantalla.
 * - Respeta prefers-reduced-motion y el ahorro de datos: no hay autoplay, se ofrece el botón.
 * - Siempre incluye control de pausa (WCAG 2.2.2).
 */
export function VideoLoop({ asset, label, playLabel, pauseLabel, poster, hud, className = '' }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);

  const play = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    const p = v.play();
    if (p) p.catch(() => setPlaying(false));
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const autoplay = () => !reduceQuery.matches && !conn?.saveData;
    // Dentro del visor de servicios, un plano oculto no reproduce (ni descarga) aunque esté "en pantalla"
    const layer = v.closest<HTMLElement>('[data-story-layer]');
    const onStage = () => !layer || layer.dataset.on !== 'false';
    let inView = false;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        inView = entry.isIntersecting;
        if (inView) {
          if (onStage() && autoplay() && !userPaused.current) play();
        } else if (!v.paused) {
          v.pause();
        }
      },
      { rootMargin: '150px 0px', threshold: 0.2 },
    );
    io.observe(v);

    // Si el usuario activa "reducir movimiento" con la página abierta, el vídeo se detiene (y puede reanudarlo con el botón)
    const onMotionChange = () => {
      if (reduceQuery.matches && !v.paused) v.pause();
      else if (!reduceQuery.matches && inView && onStage() && !userPaused.current) play();
    };
    reduceQuery.addEventListener('change', onMotionChange);

    // El visor avisa con `vp-layer` cuando este plano entra o sale de escena
    const onLayer = () => {
      if (!onStage()) {
        if (!v.paused) v.pause();
      } else if (inView && autoplay() && !userPaused.current) {
        play();
      }
    };
    layer?.addEventListener('vp-layer', onLayer);
    return () => {
      io.disconnect();
      reduceQuery.removeEventListener('change', onMotionChange);
      layer?.removeEventListener('vp-layer', onLayer);
    };
  }, [play]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      userPaused.current = false;
      play();
    } else {
      userPaused.current = true;
      v.pause();
    }
  };

  return (
    <div className={`absolute inset-0 ${className}`}>
      <video
        ref={ref}
        className="vp-zoom absolute inset-0 h-full w-full object-cover"
        muted
        loop
        playsInline
        preload="none"
        aria-label={label}
        width={asset.width}
        height={asset.height}
        onPlaying={() => {
          setPlaying(true);
          setStarted(true);
        }}
        onPause={() => setPlaying(false)}
      >
        <source src={asset.sources.full} type="video/mp4" media="(min-width: 768px)" />
        <source src={asset.sources.small} type="video/mp4" />
      </video>
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${started ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
        aria-hidden={started}
      >
        {poster}
      </div>
      {hud ? (
        <p className="vp-hud pointer-events-none absolute bottom-4 left-4 z-[2]" aria-hidden="true">
          {hud}
        </p>
      ) : null}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? pauseLabel : playLabel}
        className="icon-btn absolute bottom-3 right-3 z-[4] h-11 w-11 !border-white/20 bg-black/40 backdrop-blur-md"
      >
        <span className="swap">
          <span data-on={playing}>
            <Pause />
          </span>
          <span data-on={!playing}>
            <Play />
          </span>
        </span>
      </button>
    </div>
  );
}
