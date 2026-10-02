/**
 * Genera las versiones web de los renders y vídeos.
 *
 * Uso:  npm run media            (lee los originales de la carpeta padre del proyecto)
 *       MEDIA_SOURCE_DIR="C:/ruta/a/web" npm run media
 *
 * Requisitos: sharp (devDependency) y ffmpeg/ffprobe instalados en el sistema.
 * Salida:
 *   public/media/img/<id>-<ancho>.avif|jpg   (AVIF 4:4:4 + JPEG 4:4:4 de respaldo)
 *   public/media/video/<id>-<alto>.mp4       (H.264 sin audio, faststart)
 *   src/content/media.generated.json         (dimensiones, anchos, LQIP y metadatos de vídeo)
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import os from 'node:os';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const SRC = process.env.MEDIA_SOURCE_DIR ? path.resolve(process.env.MEDIA_SOURCE_DIR) : path.resolve(ROOT, '..');
const OUT_IMG = path.join(ROOT, 'public/media/img');
const OUT_VID = path.join(ROOT, 'public/media/video');
const MANIFEST = path.join(ROOT, 'src/content/media.generated.json');

/** Renders fijos. `file` es relativo a la carpeta de originales. */
const IMAGES = [
  { id: 'fine-nipona-escena', file: 'Imágenes para la web/0039.png' },
  { id: 'fine-nipona-matcha', file: 'Imágenes para la web/blanco.png' },
  { id: 'fine-nipona-mulberry', file: 'Imágenes para la web/negro.png' },
  { id: 'fine-nipona-gama', file: 'Imágenes para la web/matcha pack.png' },
  { id: 'pphone-lila', file: 'Imágenes para la web/iphone lila fondo negro.png' },
  { id: 'pphone-verde', file: 'Imágenes para la web/iphone verde.png' },
];

/** Animaciones. `posterAt` = segundo del fotograma usado como póster. */
const VIDEOS = [
  { id: 'fine-nipona-matcha-film', file: 'Videos/0001-0287.mp4', posterAt: 8.0 },
  { id: 'fine-nipona-gama-film', file: 'Videos/final.mp4', posterAt: 0.2 },
  { id: 'pphone-17-film', file: 'Videos/final vid pPhone 17.mp4', posterAt: 8.6 },
];

const AVIF = { quality: 78, chromaSubsampling: '4:4:4', effort: 6 };
const JPEG = { quality: 88, chromaSubsampling: '4:4:4', mozjpeg: true };

function widthsFor(w, h) {
  const portrait = h > w;
  const set = portrait ? [480, 720, 1080] : [960, 1440, 1920];
  const widths = set.filter((x) => x < (portrait ? w : w));
  return widths.includes(w) ? widths : [...widths.filter((x) => x < w), w];
}

async function processImage(id, input) {
  const base = sharp(input).flatten({ background: '#000000' });
  const { width, height } = await base.metadata();
  const widths = widthsFor(width, height);
  for (const w of widths) {
    const resized = sharp(input).flatten({ background: '#000000' }).resize({ width: w, withoutEnlargement: true });
    await resized.clone().avif(AVIF).toFile(path.join(OUT_IMG, `${id}-${w}.avif`));
    await resized.clone().jpeg(JPEG).toFile(path.join(OUT_IMG, `${id}-${w}.jpg`));
  }
  const lqipBuf = await sharp(input).flatten({ background: '#000000' }).resize({ width: 24 }).blur(1.2).jpeg({ quality: 60 }).toBuffer();
  return { width, height, widths, lqip: `data:image/jpeg;base64,${lqipBuf.toString('base64')}` };
}

function probe(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate:format=duration', '-of', 'json', file]);
  const j = JSON.parse(out.toString());
  const s = j.streams[0];
  const [n, d] = s.r_frame_rate.split('/').map(Number);
  return { width: s.width, height: s.height, fps: Math.round(n / d), duration: Math.round(Number(j.format.duration) * 10) / 10 };
}

function encode(input, output, scale) {
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', input, '-an', '-vf', scale, '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-tune', 'film', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', output]);
}

async function main() {
  if (!existsSync(SRC)) throw new Error(`No existe la carpeta de originales: ${SRC}`);
  for (const d of [OUT_IMG, OUT_VID]) { rmSync(d, { recursive: true, force: true }); mkdirSync(d, { recursive: true }); }

  const manifest = { images: {}, videos: {} };
  for (const img of IMAGES) {
    const input = path.join(SRC, img.file);
    if (!existsSync(input)) throw new Error(`Falta el render ${input}`);
    manifest.images[img.id] = await processImage(img.id, input);
    console.log('✓ imagen', img.id);
  }

  const tmp = path.join(os.tmpdir(), 'vs3d-posters');
  mkdirSync(tmp, { recursive: true });
  for (const v of VIDEOS) {
    const input = path.join(SRC, v.file);
    if (!existsSync(input)) throw new Error(`Falta el vídeo ${input}`);
    const meta = probe(input);
    const portrait = meta.height > meta.width;
    const full = `${v.id}-${portrait ? meta.width : meta.height}.mp4`;
    const small = `${v.id}-720.mp4`;
    encode(input, path.join(OUT_VID, full), 'scale=trunc(iw/2)*2:trunc(ih/2)*2');
    encode(input, path.join(OUT_VID, small), portrait ? 'scale=720:-2' : 'scale=-2:720');
    const posterPng = path.join(tmp, `${v.id}.png`);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(v.posterAt), '-i', input, '-frames:v', '1', posterPng]);
    const posterId = `${v.id}-poster`;
    manifest.images[posterId] = await processImage(posterId, posterPng);
    manifest.videos[v.id] = {
      ...meta,
      poster: posterId,
      sources: { full: `/media/video/${full}`, small: `/media/video/${small}` },
    };
    console.log('✓ vídeo', v.id, meta);
  }

  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log('Manifiesto escrito en', path.relative(ROOT, MANIFEST));
}

main().catch((e) => { console.error(e); process.exit(1); });
