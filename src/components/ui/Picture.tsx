/* Los renders se sirven pregenerados en AVIF/JPEG 4:4:4 (npm run media) para no perder calidad de color. */
import type { CSSProperties } from 'react';
import { image, imageSrc, srcSet } from '@/content/media';

type Props = {
  id: string;
  alt: string;
  /** Atributo `sizes`: ancho real que ocupará la imagen en cada breakpoint. */
  sizes: string;
  /** Imagen alternativa para pantallas estrechas (dirección de arte). */
  mobileId?: string;
  mobileMaxWidth?: number;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  position?: string;
  style?: CSSProperties;
};

export function Picture({ id, alt, sizes, mobileId, mobileMaxWidth = 767, priority = false, className, imgClassName, position, style }: Props) {
  const asset = image(id);
  const mobile = mobileId ? image(mobileId) : null;
  const fallbackWidth = asset.widths[Math.min(1, asset.widths.length - 1)] ?? asset.width;
  const media = `(max-width: ${mobileMaxWidth}px)`;

  return (
    <picture className={className}>
      {mobile ? (
        <>
          <source media={media} type="image/avif" srcSet={srcSet(mobile, 'avif')} sizes={sizes} width={mobile.width} height={mobile.height} />
          <source media={media} type="image/jpeg" srcSet={srcSet(mobile, 'jpg')} sizes={sizes} width={mobile.width} height={mobile.height} />
        </>
      ) : null}
      <source type="image/avif" srcSet={srcSet(asset, 'avif')} sizes={sizes} />
      <img
        src={imageSrc(asset, fallbackWidth, 'jpg')}
        srcSet={srcSet(asset, 'jpg')}
        sizes={sizes}
        width={asset.width}
        height={asset.height}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
        className={imgClassName}
        style={{
          backgroundImage: `url(${(mobile ?? asset).lqip})`,
          backgroundSize: 'cover',
          backgroundPosition: position ?? 'center',
          objectPosition: position,
          ...style,
        }}
      />
    </picture>
  );
}
