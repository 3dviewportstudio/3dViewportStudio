'use server';

import { headers } from 'next/headers';
import { copy } from '@/content/copy';
import { site } from '@/lib/site';
import { isBudget, isEmail, isService, LIMITS, type ContactField, type ContactState, type ContactValues } from './contact';

/* Límite de envíos por IP: 5 cada 10 minutos (por instancia del servidor). */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((ts) => now - ts < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return false;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] ?? ch);
}

export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const locale = formData.get('locale') === 'en' ? 'en' : 'es';
  const errorsCopy = copy[locale].contact.errors;
  const get = (k: string) => String(formData.get(k) ?? '').trim();

  const values: ContactValues = {
    name: get('name'),
    email: get('email'),
    company: get('company'),
    service: get('service'),
    budget: get('budget'),
    message: get('message'),
    consent: formData.get('consent') === 'on',
  };

  // Antispam: campo trampa y tiempo mínimo de relleno. Se responde "enviado" para no dar pistas.
  const startedAt = Number(get('t'));
  if (get('website') || (startedAt > 0 && Date.now() - startedAt < 2500)) {
    return { status: 'success', values: { ...values, message: '' } };
  }

  const errors: Partial<Record<ContactField, string>> = {};
  if (values.name.length < 2) errors.name = errorsCopy.name;
  else if (values.name.length > LIMITS.name) errors.name = errorsCopy.tooLong;
  if (!isEmail(values.email)) errors.email = errorsCopy.email;
  if (values.company.length > LIMITS.company) errors.company = errorsCopy.tooLong;
  if (values.message.length < LIMITS.messageMin) errors.message = errorsCopy.message;
  else if (values.message.length > LIMITS.message) errors.message = errorsCopy.tooLong;
  if (!values.consent) errors.consent = errorsCopy.consent;
  if (Object.keys(errors).length > 0) return { status: 'invalid', errors, values };

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
  if (rateLimited(ip)) return { status: 'rate', values };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[contacto] RESEND_API_KEY no está configurada: se ofrece el envío por email.');
    return { status: 'unavailable', values };
  }

  const es = copy.es.contact;
  const serviceLabel = isService(values.service) ? es.serviceOptions[values.service] : es.serviceOptions.unknown;
  const budgetLabel = isBudget(values.budget) ? es.budgetOptions[values.budget] : es.budgetOptions.unknown;
  const rows: Array<[string, string]> = [
    ['Nombre', values.name],
    ['Email', values.email],
    ['Marca o empresa', values.company || '—'],
    ['Servicio', serviceLabel],
    ['Presupuesto', budgetLabel],
    ['Idioma de la web', locale === 'es' ? 'Español' : 'Inglés'],
  ];
  const subject = `Nueva consulta web · ${values.name}${values.company ? ` (${values.company})` : ''}`;
  const text = `${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nMensaje:\n${values.message}\n`;
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.55;color:#111">
<h2 style="margin:0 0 16px;font-size:18px">${escapeHtml(subject)}</h2>
<table style="border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#666">${escapeHtml(k)}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`)
    .join('')}</table>
<p style="margin:20px 0 6px;color:#666">Mensaje</p>
<p style="margin:0;white-space:pre-wrap">${escapeHtml(values.message)}</p>
</div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`,
        to: [process.env.CONTACT_TO_EMAIL || site.email],
        reply_to: values.email,
        subject,
        text,
        html,
      }),
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('[contacto] Resend respondió', res.status, await res.text().catch(() => ''));
      return { status: 'error', values };
    }
    return { status: 'success', values: { ...values, message: '' } };
  } catch (err) {
    console.error('[contacto] Error al enviar', err);
    return { status: 'error', values };
  }
}
