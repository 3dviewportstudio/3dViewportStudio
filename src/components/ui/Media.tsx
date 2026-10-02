import type { GalleryItem } from '@/content/projects';
import { image, video, videoSpec } from '@/content/media';
import type { Locale } from '@/lib/routes';
import { t } from '@/content/copy';
import { Picture } from './Picture';
import { VideoLoop } from './VideoLoop';
import { ViewportFrame } from './ViewportFrame';

type Props = {
  item: GalleryItem;
  locale: Locale;
  sizes: string;
  /** Relación de aspecto del visor; por defecto, la del archivo. */
  ratio?: string;
  parallax?: boolean;
  interactive?: boolean;
  showCaption?: boolean;
  className?: string;
};

/** Render o animación dentro del visor "Viewport", con sus datos técnicos reales. */
export function Media({ item, locale, sizes, ratio, parallax = false, interactive = false, showCaption = false, className = '' }: Props) {
  const c = t(locale);

  if (item.kind === 'video') {
    const asset = video(item.id);
    return (
      <ViewportFrame
        ratio={ratio ?? `${asset.width} / ${asset.height}`}
        interactive={interactive}
        className={className}
        hud={showCaption ? item.caption[locale] : undefined}
      >
        <VideoLoop
          asset={asset}
          label={item.alt[locale]}
          playLabel={c.a11y.play}
          pauseLabel={c.a11y.pause}
          hud={videoSpec(asset, locale)}
          poster={<Picture id={asset.poster.id} alt="" sizes={sizes} className="block h-full w-full" imgClassName="h-full w-full object-cover" />}
        />
      </ViewportFrame>
    );
  }

  const asset = image(item.id);
  const picture = (
    <Picture
      id={item.id}
      alt={item.alt[locale]}
      sizes={sizes}
      className="block h-full w-full"
      imgClassName="vp-zoom h-full w-full object-cover"
    />
  );

  return (
    <ViewportFrame
      ratio={ratio ?? `${asset.width} / ${asset.height}`}
      interactive={interactive}
      className={className}
      hud={showCaption ? item.caption[locale] : undefined}
    >
      {parallax ? (
        <div className="parallax-inner" data-parallax="5">
          {picture}
        </div>
      ) : (
        <div className="absolute inset-0">{picture}</div>
      )}
    </ViewportFrame>
  );
}
