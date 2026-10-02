import manifest from './media.generated.json';

export type ImageAsset = {
  id: string;
  width: number;
  height: number;
  widths: number[];
  lqip: string;
};

export type VideoAsset = {
  id: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  poster: ImageAsset;
  sources: { full: string; small: string };
};

type Manifest = {
  images: Record<string, Omit<ImageAsset, 'id'>>;
  videos: Record<string, Omit<VideoAsset, 'id' | 'poster'> & { poster: string }>;
};

const data = manifest as Manifest;

export function image(id: string): ImageAsset {
  const entry = data.images[id];
  if (!entry) throw new Error(`Imagen desconocida: ${id}. Ejecuta "npm run media".`);
  return { id, ...entry };
}

export function video(id: string): VideoAsset {
  const entry = data.videos[id];
  if (!entry) throw new Error(`Vídeo desconocido: ${id}. Ejecuta "npm run media".`);
  return { id, ...entry, poster: image(entry.poster) };
}

export function imageSrc(asset: ImageAsset, width: number, format: 'avif' | 'jpg'): string {
  return `/media/img/${asset.id}-${width}.${format}`;
}

export function srcSet(asset: ImageAsset, format: 'avif' | 'jpg'): string {
  return asset.widths.map((w) => `${imageSrc(asset, w, format)} ${w}w`).join(', ');
}

export function largestSrc(asset: ImageAsset, format: 'avif' | 'jpg' = 'jpg'): string {
  return imageSrc(asset, asset.widths[asset.widths.length - 1] ?? asset.width, format);
}

/** "1080×1920 · 24 fps · 12 s": datos técnicos reales del archivo, para el HUD del visor. */
export function videoSpec(v: VideoAsset, locale: 'es' | 'en'): string {
  const seconds = locale === 'es' ? String(v.duration).replace('.', ',') : String(v.duration);
  return `${v.width}×${v.height} · ${v.fps} fps · ${seconds} s`;
}

export function imageSpec(asset: ImageAsset): string {
  return `${asset.width}×${asset.height}`;
}
