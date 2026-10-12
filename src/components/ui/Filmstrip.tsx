import type { GalleryItem } from '@/content/projects';
import { image, video } from '@/content/media';
import type { Locale } from '@/lib/routes';
import { Media } from './Media';

type Props = { items: GalleryItem[]; locale: Locale; label: string; hint: { scroll: string; swipe: string } };

/**
 * Galería horizontal. Cada pieza mantiene su proporción a la misma altura.
 * - Escritorio con movimiento: la sección se fija y el scroll vertical desplaza la tira (MotionProvider, [data-hscroll]).
 * - Táctil o movimiento reducido: desplazamiento horizontal nativo con imanes de ajuste.
 */
export function Filmstrip({ items, locale, label, hint }: Props) {
  return (
    <section aria-label={label} className="hscroll" data-hscroll>
      <div className="hscroll-viewport">
        <ul className="hscroll-track" data-hscroll-track>
          {items.map((item) => {
            const a = item.kind === 'video' ? video(item.id) : image(item.id);
            return (
              <li key={item.id} className="hscroll-item" style={{ ['--ar' as string]: `${a.width / a.height}` }}>
                <Media item={item} locale={locale} sizes="(min-width: 768px) 60vw, 86vw" showCaption />
              </li>
            );
          })}
        </ul>
      </div>
      {/* Solo se muestra si la tira no cabe entera (MotionProvider marca .is-static cuando cabe) */}
      <p className="hscroll-hint container-x label mt-6 flex items-center gap-3">
        <span className="hscroll-progress" aria-hidden="true">
          <span data-hscroll-progress />
        </span>
        <span className="hint-fine">{hint.scroll}</span>
        <span className="hint-touch">{hint.swipe}</span>
      </p>
    </section>
  );
}
