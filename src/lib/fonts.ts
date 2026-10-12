import localFont from 'next/font/local';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

/**
 * Archivo (Omnibus-Type, SIL Open Font License) para titulares y logotipo: grotesca variable con eje de anchura.
 * Se usa expandida (wdth 112–125) para dar a los titulares el carácter de una pieza de hardware.
 * Subconjunto latino y ejes recortados a wght 500–800 · wdth 100–125 (≈46 KB).
 * Geist para texto y Geist Mono solo para datos técnicos reales. Todo se sirve desde el propio dominio.
 */
const archivo = localFont({
  src: [{ path: '../fonts/Archivo-Variable.woff2', weight: '500 800', style: 'normal' }],
  variable: '--font-archivo',
  display: 'swap',
  preload: true,
  fallback: ['Arial', 'sans-serif'],
  adjustFontFallback: 'Arial',
  declarations: [{ prop: 'font-stretch', value: '100% 125%' }],
});

export const fontVariables = `${archivo.variable} ${GeistSans.variable} ${GeistMono.variable}`;
