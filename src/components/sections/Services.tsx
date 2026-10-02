import { serviceIds, t, type ServiceId } from '@/content/copy';
import type { GalleryItem } from '@/content/projects';
import { video, videoSpec } from '@/content/media';
import { Media } from '@/components/ui/Media';
import { Picture } from '@/components/ui/Picture';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { VideoLoop } from '@/components/ui/VideoLoop';
import { ViewportFrame } from '@/components/ui/ViewportFrame';
import { ArrowRight } from '@/components/ui/Icons';
import { sectionIds, type Locale } from '@/lib/routes';

/** Cada servicio se ilustra con una pieza real del mismo producto: el mismo envase, presentado de tres formas. */
const SERVICE_MEDIA: Record<ServiceId, { kind: 'image' | 'video'; id: string }> = {
  packshots: { kind: 'image', id: 'fine-nipona-matcha' },
  lifestyle: { kind: 'image', id: 'fine-nipona-escena' },
  animation: { kind: 'video', id: 'fine-nipona-gama-film' },
};

function serviceMedia(id: ServiceId, alt: string): GalleryItem {
  const { kind, id: mediaId } = SERVICE_MEDIA[id];
  return { kind, id: mediaId, alt: { es: alt, en: alt }, caption: { es: '', en: '' } };
}

/** Pieza de un servicio dentro del visor fijo de escritorio. `story-shot` recibe el reenfoque al cambiar de plano. */
function StageShot({ id, alt, locale }: { id: ServiceId; alt: string; locale: Locale }) {
  const { kind, id: mediaId } = SERVICE_MEDIA[id];
  const sizes = '(min-width: 1024px) 40vw, 100vw';
  if (kind === 'video') {
    const a11y = t(locale).a11y;
    const asset = video(mediaId);
    return (
      <VideoLoop
        asset={asset}
        label={alt}
        playLabel={a11y.play}
        pauseLabel={a11y.pause}
        hud={videoSpec(asset, locale)}
        className="story-shot"
        poster={<Picture id={asset.poster.id} alt="" sizes={sizes} className="block h-full w-full" imgClassName="h-full w-full object-cover" />}
      />
    );
  }
  return <Picture id={mediaId} alt={alt} sizes={sizes} className="story-shot absolute inset-0 block h-full w-full" imgClassName="h-full w-full object-cover" />;
}

/**
 * Tres servicios contados sobre un mismo producto.
 * Escritorio (con JS): un visor fijo a la izquierda cambia de plano según el servicio que se está leyendo
 * (el paso que cruza el centro de la pantalla; lo gestiona MotionProvider). En móvil o sin JS, cada servicio
 * muestra su propia pieza encima del texto. Las dos variantes nunca se ven a la vez (display: none).
 */
export function Services({ locale }: { locale: Locale }) {
  const c = t(locale).services;
  const contact = `#${sectionIds[locale].contact}`;

  return (
    <section id={sectionIds[locale].services} aria-labelledby="services-title" className="theme-light sheet section-y">
      <div className="container-x">
        <SectionLabel>{c.label}</SectionLabel>
        <h2 id="services-title" className="h-section mt-6 max-w-[22ch]" data-reveal>
          {c.title}
        </h2>

        <div data-story className="mt-16 md:mt-24 lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="story-stage lg:col-span-6">
            <div className="story-stage-inner">
              <ViewportFrame ratio="4 / 5">
                {serviceIds.map((id, i) => (
                  <div key={id} className="story-layer" data-story-layer={i} data-on={i === 0}>
                    <StageShot id={id} alt={c.items[id].mediaAlt} locale={locale} />
                    <p className="vp-hud pointer-events-none absolute left-4 top-4 z-[2]" aria-hidden="true">
                      {c.items[id].name}
                    </p>
                  </div>
                ))}
              </ViewportFrame>
            </div>
          </div>

          <ul className="lg:col-span-5 lg:col-start-8">
            {serviceIds.map((id, i) => {
              const s = c.items[id];
              return (
                <li
                  key={id}
                  className="story-step border-t border-line py-14 first:border-t-0 first:pt-0 last:pb-0"
                  data-story-step={i}
                  data-on={i === 0}
                >
                  <div className="story-inline mb-10">
                    <Media item={serviceMedia(id, s.mediaAlt)} locale={locale} ratio="4 / 5" sizes="(min-width: 640px) 80vw, 92vw" />
                  </div>
                  <h3 className="font-display text-[clamp(2rem,3.4vw,3.25rem)] font-medium leading-[0.96] tracking-[-0.05em]">{s.name}</h3>
                  <p className="text-lead mt-5 max-w-[40ch]">{s.text}</p>
                  <dl className="mt-10 grid gap-8 border-t border-line pt-6 sm:grid-cols-[1fr_auto] sm:gap-12">
                    <div>
                      <dt className="label">{c.includes}</dt>
                      <dd>
                        <ul className="mt-3 space-y-2 text-[0.9375rem]">
                          {s.includes.map((inc) => (
                            <li key={inc} className="flex gap-3">
                              <span aria-hidden="true" className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-accent" />
                              {inc}
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                    <div>
                      <dt className="label">{c.timing}</dt>
                      <dd className="mt-3 text-[0.9375rem] font-medium">{s.timing}</dd>
                    </div>
                  </dl>
                  <a href={contact} data-service={id} className="btn btn-ghost mt-10 self-start" aria-label={`${c.cta}: ${s.name}`}>
                    {c.cta}
                    <ArrowRight />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
