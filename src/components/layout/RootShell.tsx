import type { ReactNode } from 'react';
import { t } from '@/content/copy';
import { fontVariables } from '@/lib/fonts';
import type { Locale } from '@/lib/routes';
import { Footer } from './Footer';
import { Header } from './Header';
import { MotionProvider } from './MotionProvider';

/**
 * Se ejecuta antes del primer pintado: activa las animaciones de entrada solo si el
 * usuario no ha pedido reducir el movimiento (así no hay parpadeos ni contenido oculto sin JS).
 */
const motionScript = `(function(){try{var d=document.documentElement;d.classList.add(window.matchMedia('(prefers-reduced-motion: reduce)').matches?'motion-reduce':'motion-ok')}catch(e){}})();`;

export function RootShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const c = t(locale);
  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      {/* eslint-disable-next-line @next/next/no-head-element -- App Router: <head> en el layout raíz es válido; el script evita parpadeos antes del primer pintado. */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionScript }} />
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-svh flex-col bg-bg text-fg">
        <div id="top" tabIndex={-1} className="absolute left-0 top-0 h-px w-px outline-none" />
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-fg focus:px-4 focus:py-2 focus:text-bg"
        >
          {c.a11y.skip}
        </a>
        <Header locale={locale} />
        <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <Footer locale={locale} />
        <MotionProvider />
      </body>
    </html>
  );
}
