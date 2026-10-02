import Link from 'next/link';
import { t } from '@/content/copy';
import { image, video } from '@/content/media';
import { nextProject, type GalleryItem, type Project } from '@/content/projects';
import { JsonLd } from '@/components/layout/JsonLd';
import { ArrowRight, ArrowUpRight } from '@/components/ui/Icons';
import { Media } from '@/components/ui/Media';
import { Picture } from '@/components/ui/Picture';
import { routes, sectionHref, type Locale } from '@/lib/routes';
import { projectJsonLd } from '@/lib/structured-data';

type Row = { kind: 'wide'; items: [GalleryItem] } | { kind: 'pair'; items: [GalleryItem, GalleryItem] } | { kind: 'tall'; items: GalleryItem[] };

/** Agrupa la galería en filas editoriales: panorámicas a todo el ancho, verticales de tres en tres. */
function toRows(items: GalleryItem[]): Row[] {
  const rows: Row[] = [];
  let i = 0;
  while (i < items.length) {
    const a = items[i] as GalleryItem;
    const b = items[i + 1];
    if (a.span === 'wide') {
      if (b && b.span !== 'wide' && rows.length > 0) {
        rows.push({ kind: 'pair', items: [a, b] });
        i += 2;
      } else {
        rows.push({ kind: 'wide', items: [a] });
        i += 1;
      }
      continue;
    }
    const group: GalleryItem[] = [];
    while (i < items.length && group.length < 3 && items[i]?.span !== 'wide') {
      group.push(items[i] as GalleryItem);
      i += 1;
    }
    rows.push({ kind: 'tall', items: group });
  }
  return rows;
}

function GalleryRow({ row, locale }: { row: Row; locale: Locale }) {
  if (row.kind === 'wide') {
    return <Media item={row.items[0]} locale={locale} sizes="(min-width: 1440px) 1344px, 94vw" showCaption />;
  }
  if (row.kind === 'pair') {
    return (
      <div className="grid items-start gap-6 md:grid-cols-12 md:gap-8">
        <Media item={row.items[0]} locale={locale} sizes="(min-width: 768px) 62vw, 94vw" showCaption className="md:col-span-8" />
        <Media item={row.items[1]} locale={locale} sizes="(min-width: 768px) 30vw, 94vw" showCaption className="md:col-span-4" parallax />
      </div>
    );
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 md:gap-8">
      {row.items.map((item, i) => (
        <Media
          key={item.id}
          item={item}
          locale={locale}
          sizes="(min-width: 768px) 30vw, (min-width: 640px) 46vw, 94vw"
          showCaption
          className={i === 1 ? 'md:mt-24' : ''}
        />
      ))}
    </div>
  );
}

export function ProjectPage({ locale, project }: { locale: Locale; project: Project }) {
  const c = t(locale).project;
  const next = nextProject(project.slug);
  const rows = toRows(project.gallery);
  const [lead, ...rest] = rows;
  const nextCover = next.cover.primary.kind === 'video' ? video(next.cover.primary.id).poster : image(next.cover.primary.id);

  const meta: Array<[string, string]> = [
    [c.type, project.kindLabel[locale]],
    [c.sector, project.sector[locale]],
    [c.deliverables, project.deliverables[locale]],
    [c.formats, project.formats[locale]],
    [c.tools, project.tools.join(', ')],
  ];

  return (
    <>
      <JsonLd data={projectJsonLd(locale, project)} />
      <article>
        <header className="container-x pt-[calc(var(--header-h)+3rem)] md:pt-[calc(var(--header-h)+5rem)]">
          <nav aria-label={locale === 'es' ? 'Ruta de navegación' : 'Breadcrumb'}>
            <ol className="label flex flex-wrap items-center gap-2">
              <li>
                <Link href={sectionHref(locale, 'work')} className="link-u hover:text-fg">
                  {c.breadcrumb}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-fg">
                {project.name}
              </li>
            </ol>
          </nav>
          <h1 className="wordmark mt-8 text-[clamp(3.5rem,13vw,11rem)]" data-reveal>
            {project.name}
          </h1>
          <div className="mt-12 grid gap-10 border-t border-line pt-10 md:grid-cols-12 md:gap-8">
            <p className="text-lead !text-fg/90 md:col-span-6" data-reveal>
              {project.intro[locale]}
            </p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 text-[0.9375rem] md:col-span-5 md:col-start-8" data-reveal>
              {meta.map(([term, value]) => (
                <div key={term}>
                  <dt className="label">{term}</dt>
                  <dd className={`mt-1.5 ${term === c.type && project.kind === 'client' ? 'text-accent-2' : ''}`}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </header>

        {lead ? (
          <div className="container-x mt-16 md:mt-24">
            <GalleryRow row={lead} locale={locale} />
          </div>
        ) : null}

        <section aria-labelledby="approach-title" className="container-x section-y grid gap-10 md:grid-cols-12 md:gap-8">
          <h2 id="approach-title" className="label md:col-span-3" data-reveal>
            {c.approach}
          </h2>
          <ol className="space-y-8 md:col-span-8 md:col-start-5">
            {project.approach[locale].map((p, i) => (
              <li key={p} className="grid grid-cols-[3rem_1fr] gap-4 border-t border-line pt-6" data-reveal>
                <span className="font-mono text-sm text-accent-2">{String(i + 1).padStart(2, '0')}</span>
                <p className="text-[clamp(1.125rem,1.6vw,1.375rem)] leading-snug">{p}</p>
              </li>
            ))}
          </ol>
        </section>

        {rest.length > 0 ? (
          <section aria-label={c.gallery} className="container-x flex flex-col gap-10 md:gap-16">
            {rest.map((row, i) => (
              <GalleryRow key={i} row={row} locale={locale} />
            ))}
          </section>
        ) : null}

        <section className="container-x section-y">
          <div className="grid gap-12 border-t border-line pt-12 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-6">
              <h2 className="h-section max-w-[14ch]">{c.ctaTitle}</h2>
              <p className="text-lead mt-6">{c.ctaText}</p>
              <Link href={sectionHref(locale, 'contact')} className="btn btn-primary mt-10" data-magnetic>
                {c.cta}
                <ArrowRight />
              </Link>
            </div>
            <Link
              href={routes[locale].project(next.slug)}
              className="vp-group group relative md:col-span-5 md:col-start-8"
              data-cursor={t(locale).work.cursor}
            >
              <span className="label">{c.next}</span>
              <span className="mt-4 flex items-center justify-between gap-4 font-display text-4xl font-bold tracking-[-0.03em]">
                {next.name}
                <ArrowUpRight width={24} height={24} className="transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1" />
              </span>
              <span className="vp-frame vp-interactive mt-6 block">
                <span className="vp-corners" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
                <span className="vp-media block" style={{ aspectRatio: '16 / 10' }}>
                  <Picture
                    id={nextCover.id}
                    alt=""
                    sizes="(min-width: 768px) 38vw, 94vw"
                    className="absolute inset-0 block h-full w-full"
                    imgClassName="vp-zoom h-full w-full object-cover"
                  />
                </span>
              </span>
            </Link>
          </div>
        </section>
      </article>
    </>
  );
}
