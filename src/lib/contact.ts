import { budgetIds, serviceIds, type BudgetId, type ServiceId } from '@/content/copy';

export type ContactField = 'name' | 'email' | 'company' | 'service' | 'budget' | 'message' | 'consent';

export type ContactValues = {
  name: string;
  email: string;
  company: string;
  service: string;
  budget: string;
  message: string;
  consent?: boolean;
};

export type ContactState = {
  status: 'idle' | 'success' | 'invalid' | 'error' | 'unavailable' | 'rate';
  errors?: Partial<Record<ContactField, string>>;
  values?: ContactValues;
};

export const initialContactState: ContactState = { status: 'idle' };

export const LIMITS = { name: 100, email: 200, company: 120, message: 5000, messageMin: 10 } as const;

export function isService(v: string): v is ServiceId {
  return (serviceIds as readonly string[]).includes(v);
}

export function isBudget(v: string): v is BudgetId {
  return (budgetIds as readonly string[]).includes(v);
}

export function isEmail(v: string): boolean {
  return v.length <= LIMITS.email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

/** Enlace mailto con el mensaje ya escrito, para cuando el envío automático no es posible. */
export function mailtoHref(to: string, v: ContactValues | undefined, subject: string): string {
  const lines = v
    ? [v.message, '', '—', v.name, v.company, v.email].filter((l, i) => i < 3 || l).join('\n')
    : '';
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines)}`;
}
