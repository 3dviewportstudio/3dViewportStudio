import localFont from 'next/font/local';

/**
 * Satoshi (Indian Type Foundry · Fontshare, gratuita para uso comercial) para titulares y logotipo,
 * subconjunto latino en WOFF2. Geist para texto y Geist Mono para datos técnicos.
 * Todas se sirven desde el propio dominio: sin peticiones a terceros.
 */
const satoshi = localFont({
  src: [
    { path: '../fonts/Satoshi-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../fonts/Satoshi-Black.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-satoshi',
  display: 'swap',
  preload: true,
  fallback: ['Helvetica Neue', 'Arial', 'sans-serif'],
  adjustFontFallback: 'Arial',
});

/**
 * Geist y Geist Mono (Vercel, licencia OFL) en subconjunto latino: Latin-1, Latin Extended-A y la puntuación
 * que usan los textos (– — ’ “ ” … € →). Mismo eje variable de peso, la mitad de bytes (≈36 KB cada una).
 * Se generan desde los archivos del paquete `geist` con fontTools:
 *   pyftsubset node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2 --flavor=woff2 --layout-features='*' \
 *     --unicodes="U+0020-007E,U+00A0-00FF,U+0100-017F,U+2010-2027,U+2030-203A,U+20AC,U+2122,U+2190-2193,U+2212" \
 *     --output-file=src/fonts/Geist-Variable-latin.woff2   (ídem con geist-mono/GeistMono-Variable.woff2)
 */
const geistSans = localFont({
  src: '../fonts/Geist-Variable-latin.woff2',
  variable: '--font-geist-sans',
  weight: '100 900',
  display: 'swap',
});

/** Geist Mono solo aparece en las etiquetas HUD: no se precarga para no competir con el hero en la primera carga. */
const geistMono = localFont({
  src: '../fonts/GeistMono-Variable-latin.woff2',
  variable: '--font-geist-mono',
  weight: '100 900',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Liberation Mono', 'monospace'],
});

export const fontVariables = `${satoshi.variable} ${geistSans.variable} ${geistMono.variable}`;
