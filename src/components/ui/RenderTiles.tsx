import type { CSSProperties } from 'react';

type Grid = {
  cols: number;
  rows: number;
  /** Punto de interés (fracción del ancho y del alto) desde el que empieza el render. */
  focus: [number, number];
  /** Cuadrículas que se calculan a la vez, como los hilos de la CPU en Cycles. */
  threads: number;
};

// Ritmo del render: primera cuadrícula, separación entre tandas y desfase entre hilos de una misma tanda (ms)
const START = 180;
const WAVE = 75;
const THREAD = 18;

/**
 * Orden "desde el centro" de Cycles: anillos concéntricos alrededor del producto y, dentro de cada anillo,
 * en sentido horario. Se calcula en el servidor; el navegador solo reproduce una animación CSS por celda.
 */
function delays({ cols, rows, focus: [fx, fy], threads }: Grid): number[] {
  const cells: Array<{ index: number; ring: number; angle: number }> = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const dx = x + 0.5 - fx * cols;
      const dy = y + 0.5 - fy * rows;
      cells.push({ index: y * cols + x, ring: Math.floor(Math.max(Math.abs(dx), Math.abs(dy))), angle: Math.atan2(dy, dx) });
    }
  }
  const out = new Array<number>(cells.length).fill(0);
  [...cells]
    .sort((a, b) => a.ring - b.ring || a.angle - b.angle)
    .forEach((cell, rank) => {
      out[cell.index] = START + Math.floor(rank / threads) * WAVE + (rank % threads) * THREAD;
    });
  return out;
}

/**
 * Entrada del render del hero: la imagen aparece por cuadrículas, con las esquinas ámbar de la cuadrícula activa,
 * como en la ventana de render de Blender. Comunica "esto se renderiza, no se fotografía".
 * Solo existe con movimiento permitido (clase `motion-ok`) y no bloquea nada: la imagen ya está pintada debajo.
 */
export function RenderTiles({ className = '', ...grid }: Grid & { className?: string }) {
  return (
    <div aria-hidden="true" className={`render-tiles ${className}`} style={{ '--cols': grid.cols, '--rows': grid.rows } as CSSProperties}>
      {delays(grid).map((t, i) => (
        <span key={i} style={{ '--t': `${t}ms` } as CSSProperties} />
      ))}
    </div>
  );
}
