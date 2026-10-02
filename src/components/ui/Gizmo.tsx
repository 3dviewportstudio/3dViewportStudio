/**
 * Gizmo de navegación de Blender: los ejes X (rojo), Y (verde) y Z (azul) de la escena.
 * Se pinta ya orientado en el servidor; `orientGizmo` lo gira después sin re-render de React en cada fotograma.
 */
type AxisKey = 'x' | 'y' | 'z';

const AXES: ReadonlyArray<{ key: AxisKey; label: string; color: string }> = [
  { key: 'x', label: 'X', color: 'var(--color-axis-x)' },
  { key: 'y', label: 'Y', color: 'var(--color-axis-y)' },
  { key: 'z', label: 'Z', color: 'var(--color-axis-z)' },
];

/** Vectores de los ejes con Z de Blender hacia arriba e Y hacia el fondo de la pantalla. */
const BASE: Record<AxisKey, [number, number, number]> = {
  x: [1, 0, 0],
  y: [0, 0, -1],
  z: [0, 1, 0],
};

const R = 0.92;

/** Posición en pantalla (x, y) y profundidad de cada eje tras girar la vista. */
function project(yaw: number, pitch: number) {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return AXES.map(({ key }) => {
    const [x, y, z] = BASE[key];
    const x1 = x * cy + z * sy;
    const z1 = -x * sy + z * cy;
    const y2 = y * cp - z1 * sp;
    const z2 = y * sp + z1 * cp;
    return { key, x: +(x1 * R).toFixed(3), y: +(-y2 * R).toFixed(3), depth: z2 };
  });
}

type Node = { id: string; key: AxisKey; x: number; y: number; depth: number; positive: boolean };

function nodes(yaw: number, pitch: number): Node[] {
  return project(yaw, pitch)
    .flatMap((p) => [
      { id: p.key, key: p.key, x: p.x, y: p.y, depth: p.depth, positive: true },
      { id: `-${p.key}`, key: p.key, x: -p.x, y: -p.y, depth: -p.depth, positive: false },
    ])
    .sort((a, b) => a.depth - b.depth);
}

export const GIZMO_YAW = -0.6;
export const GIZMO_PITCH = 0.38;

export function Gizmo({ className = '', size = 76, yaw = GIZMO_YAW, pitch = GIZMO_PITCH }: { className?: string; size?: number; yaw?: number; pitch?: number }) {
  const axes = project(yaw, pitch);
  const color = (k: AxisKey) => AXES.find((a) => a.key === k)?.color ?? 'currentColor';
  const label = (k: AxisKey) => AXES.find((a) => a.key === k)?.label ?? '';

  return (
    <div className={`gizmo ${className}`} style={{ ['--gizmo-size' as string]: `${size}px` }} aria-hidden="true">
      <svg viewBox="-1.35 -1.35 2.7 2.7">
        {axes.map((a) => (
          <line
            key={`l-${a.key}`}
            data-axis-line={a.key}
            x1="0"
            y1="0"
            x2={(a.x * 0.78).toFixed(3)}
            y2={(a.y * 0.78).toFixed(3)}
            stroke={color(a.key)}
            strokeWidth="0.07"
            strokeLinecap="round"
          />
        ))}
        {nodes(yaw, pitch).map((n) =>
          n.positive ? (
            <g key={n.id} data-axis={n.id} transform={`translate(${n.x} ${n.y})`}>
              <circle r="0.24" fill={color(n.key)} />
              <text y="0.085" textAnchor="middle" fontSize="0.26" fontWeight="700" fill="#141517" style={{ fontFamily: 'var(--font-sans)' }}>
                {label(n.key)}
              </text>
            </g>
          ) : (
            <g key={n.id} data-axis={n.id} transform={`translate(${n.x} ${n.y})`}>
              <circle r="0.15" fill={color(n.key)} fillOpacity="0.28" stroke={color(n.key)} strokeOpacity="0.6" strokeWidth="0.05" />
            </g>
          ),
        )}
      </svg>
    </div>
  );
}

/** Reorienta un gizmo ya pintado (se llama en cada fotograma desde la escena 3D o el hero). */
export function orientGizmo(root: Element | null, yaw: number, pitch: number) {
  const svg = root?.querySelector('svg');
  if (!svg) return;
  for (const a of project(yaw, pitch)) {
    svg.querySelector(`[data-axis-line="${a.key}"]`)?.setAttribute('x2', (a.x * 0.78).toFixed(3));
    svg.querySelector(`[data-axis-line="${a.key}"]`)?.setAttribute('y2', (a.y * 0.78).toFixed(3));
  }
  // Lo que está más cerca de la cámara se dibuja encima
  for (const n of nodes(yaw, pitch)) {
    const el = svg.querySelector(`[data-axis="${n.id}"]`);
    if (!el) continue;
    el.setAttribute('transform', `translate(${n.x} ${n.y})`);
    svg.appendChild(el);
  }
}
