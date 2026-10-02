'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef, useState } from 'react';
import { budgetIds, serviceIds, t } from '@/content/copy';
import { initialContactState, isService, LIMITS, mailtoHref, type ContactField, type ContactState } from '@/lib/contact';
import { sendContact } from '@/lib/contact-action';
import type { Locale } from '@/lib/routes';
import { site } from '@/lib/site';
import { ArrowRight, Check } from '@/components/ui/Icons';

type Props = { locale: Locale; privacyHref: string };

export function ContactForm({ locale, privacyHref }: Props) {
  const c = t(locale).contact;
  const [state, formAction, pending] = useActionState<ContactState, FormData>(sendContact, initialContactState);
  const [service, setService] = useState<string>('');
  const [dismissed, setDismissed] = useState<ContactState | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const startedRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const showSuccess = state.status === 'success' && dismissed !== state;
  const err = (f: ContactField) => (state.status === 'invalid' ? state.errors?.[f] : undefined);
  const v = state.values;

  // Marca de tiempo de inicio (antispam) y selección de servicio desde los botones de "Servicios"
  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now());
  }, [state, dismissed]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.('[data-service]');
      const id = el?.getAttribute('data-service');
      if (id && isService(id)) setService(id);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Tras enviar: foco en el primer campo con error o en el mensaje de estado
  useEffect(() => {
    if (state.status === 'idle') return;
    if (state.status === 'invalid') {
      const first = (['name', 'email', 'company', 'message', 'consent'] as ContactField[]).find((f) => state.errors?.[f]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    } else {
      statusRef.current?.focus();
    }
  }, [state]);

  if (showSuccess) {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="rounded-[var(--radius-media)] border border-line bg-bg-2 p-8 outline-none md:p-12">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-ink">
          <Check width={20} height={20} />
        </span>
        <p className="mt-8 font-display text-3xl font-bold tracking-[-0.03em]">{c.success.title}</p>
        <p className="mt-3 text-fg-2">{c.success.text(v?.email || '')}</p>
        <button
          type="button"
          className="btn btn-ghost mt-10"
          onClick={() => {
            setDismissed(state);
            setService('');
          }}
        >
          {c.success.again}
        </button>
      </div>
    );
  }

  const subject = `${locale === 'es' ? 'Consulta desde la web' : 'Website enquiry'}${v?.name ? ` · ${v.name}` : ''}`;
  const fieldIds = (f: string) => ({ id: `cf-${f}`, 'aria-describedby': err(f as ContactField) ? `cf-${f}-err` : undefined });

  return (
    <form ref={formRef} action={formAction} noValidate className="grid gap-6" aria-describedby="cf-status">
      <input type="hidden" name="locale" value={locale} />
      <input ref={startedRef} type="hidden" name="t" defaultValue="" />
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="cf-website">{c.fields.website}</label>
        <input id="cf-website" type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="cf-name">
            {c.fields.name} <span aria-hidden="true" className="text-accent-2">*</span>
          </label>
          <input
            {...fieldIds('name')}
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={LIMITS.name}
            defaultValue={v?.name}
            aria-invalid={err('name') ? true : undefined}
            className="field"
          />
          <FieldError id="cf-name-err" msg={err('name')} />
        </div>
        <div>
          <label className="field-label" htmlFor="cf-email">
            {c.fields.email} <span aria-hidden="true" className="text-accent-2">*</span>
          </label>
          <input
            {...fieldIds('email')}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={LIMITS.email}
            defaultValue={v?.email}
            aria-invalid={err('email') ? true : undefined}
            className="field"
          />
          <FieldError id="cf-email-err" msg={err('email')} />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="cf-company">
          {c.fields.company} <span className="text-fg-3">({c.fields.optional})</span>
        </label>
        <input
          {...fieldIds('company')}
          name="company"
          type="text"
          autoComplete="organization"
          maxLength={LIMITS.company}
          defaultValue={v?.company}
          aria-invalid={err('company') ? true : undefined}
          className="field"
        />
        <FieldError id="cf-company-err" msg={err('company')} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="cf-service">
            {c.fields.service}
          </label>
          <select
            id="cf-service"
            name="service"
            className="field"
            value={service || v?.service || ''}
            onChange={(e) => setService(e.target.value)}
          >
            <option value="">—</option>
            {serviceIds.map((id) => (
              <option key={id} value={id}>
                {c.serviceOptions[id]}
              </option>
            ))}
            <option value="unknown">{c.serviceOptions.unknown}</option>
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="cf-budget">
            {c.fields.budget}
          </label>
          <select id="cf-budget" name="budget" className="field" defaultValue={v?.budget || ''} key={`budget-${v?.budget ?? ''}`}>
            <option value="">—</option>
            {budgetIds.map((id) => (
              <option key={id} value={id}>
                {c.budgetOptions[id]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="cf-message">
          {c.fields.message} <span aria-hidden="true" className="text-accent-2">*</span>
        </label>
        <textarea
          {...fieldIds('message')}
          name="message"
          required
          minLength={LIMITS.messageMin}
          maxLength={LIMITS.message}
          rows={6}
          placeholder={c.fields.messagePlaceholder}
          defaultValue={v?.message}
          aria-invalid={err('message') ? true : undefined}
          className="field"
        />
        <FieldError id="cf-message-err" msg={err('message')} />
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem] text-fg-2">
          <input
            id="cf-consent"
            name="consent"
            type="checkbox"
            required
            defaultChecked={v?.consent}
            aria-invalid={err('consent') ? true : undefined}
            aria-describedby={err('consent') ? 'cf-consent-err' : undefined}
            className="check"
          />
          <span>
            {c.fields.consentBefore}
            <Link href={privacyHref} className="link-u text-fg" target="_blank">
              {c.fields.consentLink}
            </Link>
            {c.fields.consentAfter}
          </span>
        </label>
        <FieldError id="cf-consent-err" msg={err('consent')} />
      </div>

      <div id="cf-status" ref={statusRef} tabIndex={-1} role="status" aria-live="polite" className="outline-none empty:hidden">
        {state.status === 'invalid' ? <p className="status-in text-danger">{c.errors.summary}</p> : null}
        {state.status === 'rate' ? <p className="status-in text-danger">{c.errors.rate}</p> : null}
        {state.status === 'error' || state.status === 'unavailable' ? (
          <div className="status-in rounded-xl border border-line-strong bg-bg-2 p-5">
            <p className="text-fg">{state.status === 'error' ? c.errors.server : c.errors.unavailable}</p>
            <a href={mailtoHref(site.email, v, subject)} className="btn btn-primary btn-sm mt-4">
              {c.errors.openMail}
              <ArrowRight />
            </a>
            <p className="mt-3 text-sm text-fg-2">{site.email}</p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        {/* Los dos estados comparten celda: el botón no cambia de tamaño y el desenfoque funde el cambio */}
        <button type="submit" className="btn btn-primary" disabled={pending} data-magnetic>
          <span className="swap gap-[0.625rem]">
            <span data-on={!pending} aria-hidden={pending}>
              {c.submit}
              <ArrowRight />
            </span>
            <span data-on={pending} aria-hidden={!pending}>
              <Spinner />
              {c.sending}
            </span>
          </span>
        </button>
        <p className="text-sm text-fg-3">
          <span aria-hidden="true" className="text-accent-2">
            *
          </span>{' '}
          {c.fields.required}
        </p>
      </div>
    </form>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="animate-spin [animation-duration:700ms]">
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FieldError({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return (
    <p id={id} className="mt-2 text-sm text-danger">
      {msg}
    </p>
  );
}
