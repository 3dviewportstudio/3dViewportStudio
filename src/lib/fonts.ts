import localFont from 'next/font/local';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

/**
 * Satoshi (Indian Type Foundry · Fontshare, gratuita para uso comercial) para titulares y logotipo,
 * subconjunto latino en WOFF2. Geist y Geist Mono para texto y datos técnicos.
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

export const fontVariables = `${satoshi.variable} ${GeistSans.variable} ${GeistMono.variable}`;
