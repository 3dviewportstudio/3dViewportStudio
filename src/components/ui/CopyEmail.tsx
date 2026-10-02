'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from './Icons';

export function CopyEmail({ email, copyLabel, copiedLabel }: { email: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = email;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    // Pulsar otra vez reinicia el aviso en lugar de acumular temporizadores
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className={`icon-btn h-9 px-3.5 text-sm ${copied ? '!border-accent/50 text-accent-2' : 'text-fg-2'}`}
      >
        <span className="swap gap-2">
          <span data-on={!copied} aria-hidden={copied}>
            <Copy />
            {copyLabel}
          </span>
          <span data-on={copied} aria-hidden={!copied}>
            <Check />
            {copiedLabel}
          </span>
        </span>
      </button>
      {/* Aviso para lectores de pantalla, fuera del botón para no duplicar su nombre */}
      <span className="sr-only" aria-live="polite">
        {copied ? copiedLabel : ''}
      </span>
    </>
  );
}
