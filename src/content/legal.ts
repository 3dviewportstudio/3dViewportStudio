import type { Locale } from '@/lib/routes';
import { site } from '@/lib/site';

export type LegalDoc = { title: string; updated: string; intro?: string; sections: Array<{ heading: string; body: string[] }> };

const UPDATED = { es: '29 de septiembre de 2026', en: '29 September 2026' };

function holderLines(locale: Locale): string[] {
  const l = site.legal;
  const es = locale === 'es';
  return [
    `${es ? 'Titular' : 'Owner'}: ${l.holder}`,
    `${es ? 'Nombre comercial' : 'Trading name'}: ${site.name}`,
    ...(l.nif ? [`NIF: ${l.nif}`] : []),
    ...(l.address ? [`${es ? 'Domicilio' : 'Address'}: ${l.address}`] : [`${es ? 'País' : 'Country'}: ${es ? 'España' : 'Spain'}`]),
    `Email: ${site.email}`,
  ];
}

export function legalNotice(locale: Locale): LegalDoc {
  if (locale === 'en') {
    return {
      title: 'Legal notice',
      updated: UPDATED.en,
      intro: 'In accordance with Spanish Law 34/2002 on Information Society Services and Electronic Commerce (LSSI-CE), the following information is provided about the owner of this website.',
      sections: [
        { heading: 'Website owner', body: holderLines('en') },
        {
          heading: 'Purpose',
          body: ['This website presents the 3D product rendering and animation services of ViewportStudio3D and makes it easy to get in touch to request a quote.'],
        },
        {
          heading: 'Intellectual property',
          body: [
            'The renders, animations, texts and design of this website belong to Lucas Expósito unless stated otherwise. Reproducing, distributing or transforming them without written permission is not allowed.',
            'Client brands shown in the portfolio (such as Fine Nipona) belong to their respective owners and are displayed to illustrate work carried out for them. “pPhone” is a fictional brand created for a personal project.',
          ],
        },
        {
          heading: 'Liability',
          body: [
            'I take care to keep the information on this website accurate and up to date, but it may contain errors or be modified without notice. Timelines and service descriptions are indicative; the terms of each project are set in its quote.',
          ],
        },
        { heading: 'Applicable law', body: ['This legal notice is governed by Spanish law.'] },
      ],
    };
  }
  return {
    title: 'Aviso legal',
    updated: UPDATED.es,
    intro: 'En cumplimiento de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se facilitan los datos del titular de esta web.',
    sections: [
      { heading: 'Titular de la web', body: holderLines('es') },
      {
        heading: 'Objeto',
        body: ['Esta web presenta los servicios de render y animación 3D de producto de ViewportStudio3D y facilita el contacto para solicitar presupuesto.'],
      },
      {
        heading: 'Propiedad intelectual',
        body: [
          'Los renders, animaciones, textos y el diseño de esta web pertenecen a Lucas Expósito salvo que se indique lo contrario. No está permitida su reproducción, distribución o transformación sin autorización por escrito.',
          'Las marcas de clientes que aparecen en el portfolio (como Fine Nipona) pertenecen a sus respectivos titulares y se muestran para ilustrar el trabajo realizado para ellos. «pPhone» es una marca ficticia creada para un proyecto propio.',
        ],
      },
      {
        heading: 'Responsabilidad',
        body: [
          'Cuido que la información de esta web sea correcta y esté actualizada, pero puede contener errores o modificarse sin previo aviso. Los plazos y descripciones de servicios son orientativos; las condiciones de cada proyecto se fijan en su presupuesto.',
        ],
      },
      { heading: 'Legislación aplicable', body: ['Este aviso legal se rige por la legislación española.'] },
    ],
  };
}

export function privacyPolicy(locale: Locale): LegalDoc {
  const l = site.legal;
  if (locale === 'en') {
    return {
      title: 'Privacy policy',
      updated: UPDATED.en,
      intro: 'This policy explains what personal data this website processes, why, and what rights you have, in accordance with the EU General Data Protection Regulation (GDPR) and Spanish Organic Law 3/2018 (LOPDGDD).',
      sections: [
        {
          heading: 'Data controller',
          body: [`${l.holder} (${site.name})${l.nif ? ` · NIF ${l.nif}` : ''}`, `Contact: ${site.email}`],
        },
        {
          heading: 'What data I process',
          body: ['The data you send through the contact form (name, email, brand or company, service, indicative budget and message) or in the emails you write to me.'],
        },
        {
          heading: 'Purpose and legal basis',
          body: [
            'I use your data only to reply to your enquiry and, if you ask for it, to prepare a quote. The legal basis is your consent when you submit the form (art. 6.1.a GDPR) and taking steps at your request before entering into a contract (art. 6.1.b GDPR). I don’t use your data to send advertising.',
          ],
        },
        {
          heading: 'How long I keep it',
          body: ['For as long as needed to handle your enquiry and, if no project goes ahead, for a maximum of one year from our last contact. If we work together, for the periods required by tax and commercial law.'],
        },
        {
          heading: 'Service providers',
          body: [
            'To run this website and receive your messages I rely on providers that act as data processors: Vercel Inc. (website hosting), Resend (delivery of contact form messages) and Google (email service where messages are received). Some of them may process data outside the European Economic Area; those transfers are covered by the EU–US Data Privacy Framework and/or the European Commission’s standard contractual clauses.',
          ],
        },
        {
          heading: 'Your rights',
          body: [
            `You can access, rectify or erase your data, object to or restrict its processing, request its portability and withdraw your consent at any time by writing to ${site.email}. You can also file a complaint with the Spanish Data Protection Agency (www.aepd.es).`,
          ],
        },
        {
          heading: 'Cookies',
          body: ['This website does not use its own or third-party cookies for analytics or advertising, so no cookie consent is required.'],
        },
      ],
    };
  }
  return {
    title: 'Política de privacidad',
    updated: UPDATED.es,
    intro: 'Esta política explica qué datos personales trata esta web, para qué y qué derechos tienes, conforme al Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).',
    sections: [
      {
        heading: 'Responsable del tratamiento',
        body: [`${l.holder} (${site.name})${l.nif ? ` · NIF ${l.nif}` : ''}`, `Contacto: ${site.email}`],
      },
      {
        heading: 'Qué datos trato',
        body: ['Los datos que envías en el formulario de contacto (nombre, email, marca o empresa, servicio, presupuesto orientativo y mensaje) o en los correos que me escribes.'],
      },
      {
        heading: 'Finalidad y base legal',
        body: [
          'Uso tus datos únicamente para responder a tu consulta y, si lo pides, preparar un presupuesto. La base legal es tu consentimiento al enviar el formulario (art. 6.1.a RGPD) y la aplicación, a petición tuya, de medidas precontractuales (art. 6.1.b RGPD). No uso tus datos para enviarte publicidad.',
        ],
      },
      {
        heading: 'Cuánto tiempo los conservo',
        body: ['El tiempo necesario para atender tu consulta y, si no llega a haber proyecto, un máximo de un año desde el último contacto. Si trabajamos juntos, durante los plazos que exige la normativa fiscal y mercantil.'],
      },
      {
        heading: 'Proveedores',
        body: [
          'Para que la web funcione y recibir tus mensajes cuento con proveedores que actúan como encargados del tratamiento: Vercel Inc. (alojamiento de la web), Resend (envío de los mensajes del formulario) y Google (servicio de correo donde se reciben). Algunos pueden tratar datos fuera del Espacio Económico Europeo; esas transferencias están amparadas en el Marco de Privacidad de Datos UE-EE. UU. o en las cláusulas contractuales tipo de la Comisión Europea.',
        ],
      },
      {
        heading: 'Tus derechos',
        body: [
          `Puedes acceder a tus datos, rectificarlos o suprimirlos, oponerte a su tratamiento o limitarlo, pedir su portabilidad y retirar tu consentimiento en cualquier momento escribiendo a ${site.email}. También puedes presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).`,
        ],
      },
      {
        heading: 'Cookies',
        body: ['Esta web no utiliza cookies propias ni de terceros con fines analíticos o publicitarios, por lo que no necesita tu consentimiento de cookies.'],
      },
    ],
  };
}
