import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true, focusable: false } as const;

export const ArrowRight = (p: P) => (
  <svg {...base} {...p}>
    <path d="M2.5 8h10m0 0L8.5 4m4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowUpRight = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4.5 11.5l7-7m0 0H5.5m6 0v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowUp = (p: P) => (
  <svg {...base} {...p}>
    <path d="M8 13.5v-11m0 0L4 6.5m4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Plus = (p: P) => (
  <svg {...base} {...p}>
    <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const Play = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 3.5v9l7.5-4.5L5 3.5z" fill="currentColor" />
  </svg>
);

export const Pause = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 3.5v9M11 3.5v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const Menu = (p: P) => (
  <svg {...base} width={20} height={20} viewBox="0 0 20 20" {...p}>
    <path d="M3 7h14M3 13h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const Close = (p: P) => (
  <svg {...base} width={20} height={20} viewBox="0 0 20 20" {...p}>
    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const Copy = (p: P) => (
  <svg {...base} {...p}>
    <rect x="5.5" y="5.5" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.3" />
    <path d="M10.5 3.5A1.5 1.5 0 0 0 9 2H4a2 2 0 0 0-2 2v5a1.5 1.5 0 0 0 1.5 1.5" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

export const Check = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
