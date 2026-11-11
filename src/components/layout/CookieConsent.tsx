'use client';

import { useEffect, useState } from 'react';
import type { Locale } from '@/lib/routes';

/**
 * Consentimiento de cookies publicitarias (Google Ads).
 * Sin NEXT_PUBLIC_GOOGLE_ADS_ID no se muestra nada y no se carga ningún script de terceros.
 * Con ID: el script de Google solo se inyecta después de que el visitante acepte.
 */
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() ?? '';
const STORAGE_KEY = 'vs3d-cookies';
const SCRIPT_ID = 'gtag-ads';

type Decision = 'granted' | 'denied';
type State = 'loading' | 'ask' | Decision;
type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

const text = {
  es: {
    body: 'Uso cookies de publicidad de Google (Google Ads) para medir y mostrar anuncios de mi trabajo. Si no las aceptas, no se instalan.',
    more: 'Más información',
    accept: 'Aceptar',
    reject: 'Rechazar',
    reopen: 'Cookies',
    privacy: '/privacidad',
    label: 'Preferencias de cookies',
  },
  en: {
    body: 'I use Google advertising cookies (Google Ads) to measure and show ads for my work. If you do not accept them, they are not installed.',
    more: 'More information',
    accept: 'Accept',
    reject: 'Reject',
    reopen: 'Cookies',
    privacy: '/en/privacy',
    label: 'Cookie preferences',
  },
} as const;

function readDecision(): Decision | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

function saveDecision(decision: Decision) {
  try {
    window.localStorage.setItem(STORAGE_KEY, decision);
  } catch {
    /* Sin almacenamiento: la elección solo dura esta visita. */
  }
}

function setConsent(w: GtagWindow, granted: boolean) {
  w.gtag?.('consent', 'update', {
    ad_storage: granted ? 'granted' : 'denied',
    ad_user_data: granted ? 'granted' : 'denied',
    ad_personalization: granted ? 'granted' : 'denied',
  });
}

function applyDecision(decision: Decision) {
  if (!ADS_ID) return;
  const w = window as GtagWindow;
  const loaded = document.getElementById(SCRIPT_ID) !== null;

  if (decision === 'denied') {
    if (loaded) setConsent(w, false);
    return;
  }

  if (!loaded) {
    w.dataLayer = w.dataLayer ?? [];
    // Por defecto todo denegado; el script solo se carga tras aceptar.
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer?.push(arguments);
    };
    w.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ADS_ID)}`;
    document.head.appendChild(script);
    w.gtag('js', new Date());
    w.gtag('config', ADS_ID);
  }
  setConsent(w, true);
}

export function CookieConsent({ locale }: { locale: Locale }) {
  const [state, setState] = useState<State>('loading');
  const c = text[locale];

  useEffect(() => {
    if (!ADS_ID) return;
    const saved = readDecision();
    if (saved) applyDecision(saved);
    // Lectura única tras hidratar: leer localStorage antes daría un error de hidratación.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(saved ?? 'ask');
  }, []);

  if (!ADS_ID || state === 'loading') return null;

  const choose = (decision: Decision) => {
    saveDecision(decision);
    applyDecision(decision);
    setState(decision);
  };

  if (state === 'ask') {
    return (
      <div
        role="dialog"
        aria-label={c.label}
        className="fixed inset-x-4 bottom-4 z-50 rounded-[var(--radius-media)] border border-line bg-bg/95 p-5 text-sm text-fg-2 shadow-xl backdrop-blur-md md:inset-x-auto md:right-6 md:max-w-sm"
      >
        <p>
          {c.body}{' '}
          <a href={c.privacy} className="link-u text-fg transition-colors hover:text-fg">
            {c.more}
          </a>
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => choose('granted')}
            className="rounded-full bg-fg px-5 py-2 font-medium text-bg transition-opacity hover:opacity-90"
          >
            {c.accept}
          </button>
          <button
            type="button"
            onClick={() => choose('denied')}
            className="rounded-full border border-line px-5 py-2 font-medium text-fg transition-colors hover:border-fg-2"
          >
            {c.reject}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setState('ask')}
      className="fixed bottom-4 left-4 z-40 rounded-full border border-line bg-bg/90 px-3 py-1.5 text-xs text-fg-2 backdrop-blur-md transition-colors hover:text-fg"
    >
      {c.reopen}
    </button>
  );
}
