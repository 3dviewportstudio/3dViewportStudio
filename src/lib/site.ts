/**
 * Datos del estudio. Todo lo que se muestra en la web sobre la marca sale de aquí:
 * cambia un valor y se actualiza en todas las páginas, metadatos y datos estructurados.
 */
export const site = {
  name: 'ViewportStudio3D',
  founder: 'Lucas Expósito',
  email: '3dviewportstudio@gmail.com',
  country: 'ES',
  /** Compromiso de respuesta que se muestra junto a los CTA. */
  responseTime: { es: '24–48 h', en: '24–48 h' },
  /** Años de experiencia con Blender (dato confirmado: "por lo menos 6"). */
  blenderYears: 6,
  tools: ['Blender', 'Cinema 4D', 'Photoshop', 'After Effects', 'Premiere'],
  /**
   * Datos del aviso legal (LSSI-CE). El NIF es obligatorio para publicar:
   * mientras esté vacío, el aviso legal no muestra esa línea y el build avisa.
   */
  legal: {
    holder: process.env.NEXT_PUBLIC_LEGAL_HOLDER || 'Lucas Expósito Sánchez',
    nif: process.env.NEXT_PUBLIC_LEGAL_NIF || '',
    /** Domicilio o localidad del titular (art. 10 LSSI-CE). */
    address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || '',
  },
} as const;

/** URL pública del sitio: dominio propio → URL de producción de Vercel → local. */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return 'http://localhost:3000';
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

if ((!site.legal.nif || !site.legal.address) && process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  console.warn('[ViewportStudio3D] Faltan NEXT_PUBLIC_LEGAL_NIF y/o NEXT_PUBLIC_LEGAL_ADDRESS: el aviso legal los necesita antes de publicar.');
}
