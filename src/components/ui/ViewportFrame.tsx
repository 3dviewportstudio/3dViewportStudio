import type { CSSProperties, ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** Relación de aspecto del visor, p. ej. "9 / 16". */
  ratio?: string;
  interactive?: boolean;
  className?: string;
  mediaClassName?: string;
  /** Texto técnico superpuesto arriba a la izquierda (datos reales del archivo). */
  hud?: ReactNode;
  cursor?: string;
  style?: CSSProperties;
};

/**
 * Marco "Viewport": las cuatro esquinas del encuadre de la cámara de Blender.
 * Es el motivo gráfico propio de la marca; en elementos interactivos se cierran al pasar el ratón.
 */
export function ViewportFrame({ children, ratio, interactive = false, className = '', mediaClassName = '', hud, cursor, style }: Props) {
  return (
    <div className={`vp-frame ${interactive ? 'vp-interactive' : ''} ${className}`} style={style} data-cursor={cursor}>
      <div className="vp-corners" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className={`vp-media ${mediaClassName}`} style={ratio ? { aspectRatio: ratio } : undefined}>
        {children}
        {hud ? (
          <div className="vp-hud pointer-events-none absolute left-4 top-4 z-[2]" aria-hidden="true">
            {hud}
          </div>
        ) : null}
      </div>
    </div>
  );
}
