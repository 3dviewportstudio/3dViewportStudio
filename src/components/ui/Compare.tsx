'use client';

import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { image } from '@/content/media';
import { Picture } from './Picture';

type Props = {
  /** Fotograma en wireframe (mismo encuadre que el render). */
  wireId: string;
  /** Render final del mismo fotograma. */
  renderId: string;
  wireLabel: string;
  renderLabel: string;
  /** Nombre accesible del deslizador. */
  sliderLabel: string;
  alt: string;
  sizes: string;
};

/**
 * Comparador wireframe ↔ render: el render se recorta con clip-path sobre el wireframe.
 * Se arrastra en cualquier punto de la imagen, y con teclado se mueve con flechas, Inicio y Fin.
 */
export function Compare({ wireId, renderId, wireLabel, renderLabel, sliderLabel, alt, sizes }: Props) {
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const asset = image(renderId);

  const fromPointer = useCallback((clientX: number) => {
    const r = stage.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  }, []);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    fromPointer(e.clientX);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging) fromPointer(e.clientX);
  };
  const onUp = () => setDragging(false);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    const next =
      e.key === 'ArrowLeft' || e.key === 'ArrowDown'
        ? pos - step
        : e.key === 'ArrowRight' || e.key === 'ArrowUp'
          ? pos + step
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? 100
              : null;
    if (next === null) return;
    e.preventDefault();
    setPos(Math.min(100, Math.max(0, next)));
  };

  return (
    <figure className="compare vp-frame">
      <div
        ref={stage}
        className="compare-stage vp-media"
        style={{ aspectRatio: `${asset.width} / ${asset.height}`, ['--pos' as string]: `${pos}%` }}
        data-dragging={dragging}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <Picture id={wireId} alt="" sizes={sizes} className="absolute inset-0 block h-full w-full" imgClassName="h-full w-full object-cover" />
        <div className="compare-render absolute inset-0">
          <Picture id={renderId} alt={alt} sizes={sizes} className="block h-full w-full" imgClassName="h-full w-full object-cover" />
        </div>
        <span className="compare-tag compare-tag-l vp-hud" aria-hidden="true">
          {renderLabel}
        </span>
        <span className="compare-tag compare-tag-r vp-hud" aria-hidden="true">
          {wireLabel}
        </span>
        <div
          className="compare-handle"
          role="slider"
          tabIndex={0}
          aria-label={sliderLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          aria-valuetext={`${Math.round(pos)}% ${renderLabel}`}
          onKeyDown={onKey}
        >
          <span className="compare-knob" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.5 4.5 2 9l4.5 4.5M11.5 4.5 16 9l-4.5 4.5" />
            </svg>
          </span>
        </div>
      </div>
    </figure>
  );
}
