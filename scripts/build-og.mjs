/**
 * Genera las imágenes para compartir en redes (Open Graph, 1200×630) en public/og.
 *
 * Uso:  OG_FONT_DIR="ruta/a/la/carpeta/con/Satoshi-*.otf" npm run og
 * Requiere los archivos de media ya generados (npm run media) y las fuentes Satoshi en OTF/TTF
 * (descarga de fontshare.com). Crea: home-es.jpg, home-en.jpg, <slug>-es.jpg, <slug>-en.jpg.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const FONT_DIR = path.resolve(process.env.OG_FONT_DIR || path.join(ROOT, '..', 'fuentes'));
const BLACK = path.join(FONT_DIR, 'Satoshi-Black.otf');
const BOLD = path.join(FONT_DIR, 'Satoshi-Bold.otf');
const MEDIA = path.join(ROOT, 'public/media/img');
const OUT = path.join(ROOT, 'public/og');
const W = 1200;
const H = 630;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function text(markup, fontfile, font, width) {
  return sharp({ text: { text: markup, fontfile, font, width, rgba: true, dpi: 72, wrap: 'word', spacing: 0 } }).png().toBuffer();
}

/** Esquinas del visor "Viewport" + punto azul, como en el logotipo. */
function corners() {
  const m = 36;
  const l = 34;
  const s = 'stroke="#f2f2ef" stroke-width="3" fill="none" stroke-linecap="round" stroke-opacity="0.8"';
  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <path d="M${m} ${m + l}V${m}H${m + l}" ${s}/><path d="M${W - m - l} ${m}H${W - m}V${m + l}" ${s}/>
  <path d="M${W - m} ${H - m - l}V${H - m}H${W - m - l}" ${s}/><path d="M${m + l} ${H - m}H${m}V${H - m - l}" ${s}/>
</svg>`);
}

function shade(kind) {
  const grad =
    kind === 'left'
      ? '<linearGradient id="g" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity="1"/><stop offset="0.5" stop-color="#000" stop-opacity="0.75"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>'
      : '<linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.2"/><stop offset="0.55" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0.95"/></linearGradient>';
  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><defs>${grad}</defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`);
}

async function card({ file, bg, bgLeft = 0, bgWidth = W, shadeKind, title, subtitle, eyebrow, titleSize, textTop }) {
  const layers = [];
  const bgImg = await sharp(path.join(MEDIA, bg)).resize({ width: bgWidth, height: H, fit: 'cover', position: 'centre' }).toBuffer();
  layers.push({ input: bgImg, left: bgLeft, top: 0 });
  layers.push({ input: shade(shadeKind), left: 0, top: 0 });
  layers.push({ input: corners(), left: 0, top: 0 });

  const eyebrowImg = await text(`<span foreground="#a0a8b5" letter_spacing="1800" size="${17 * 1024}">${esc(eyebrow.toUpperCase())}</span>`, BOLD, 'Satoshi Bold', 900);
  const titleImg = await text(`<span foreground="#f2f2ef" letter_spacing="-${Math.round(titleSize * 45)}" size="${titleSize * 1024}">${title}</span>`, BLACK, 'Satoshi Black', 1080);
  const subImg = await text(`<span foreground="#f2f2ef" size="${36 * 1024}">${esc(subtitle)}</span>`, BOLD, 'Satoshi Bold', 640);
  const titleMeta = await sharp(titleImg).metadata();
  let y = textTop;
  layers.push({ input: eyebrowImg, left: 84, top: y });
  y += 48;
  layers.push({ input: titleImg, left: 80, top: y });
  y += (titleMeta.height ?? titleSize) + 18;
  layers.push({ input: subImg, left: 84, top: y });
  const dot = Buffer.from(`<svg width="22" height="22" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="9" fill="#0066ff"/></svg>`);
  layers.push({ input: dot, left: W - 84 - 22, top: H - 84 - 22 });

  await sharp({ create: { width: W, height: H, channels: 3, background: '#000000' } })
    .composite(layers)
    .jpeg({ quality: 86, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toFile(path.join(OUT, file));
  console.log('✓', file);
}

const wordmark = 'Viewport<span foreground="#a0a8b5">Studio3D</span>';

const CARDS = [
  { file: 'home-es.jpg', eyebrow: 'Estudio de render 3D de producto', subtitle: 'Renders 3D de producto para marcas que venden online.' },
  { file: 'home-en.jpg', eyebrow: '3D product rendering studio', subtitle: '3D product renders for brands that sell online.' },
].map((c) => ({ ...c, bg: 'pphone-verde-1440.jpg', bgLeft: 260, bgWidth: 1120, shadeKind: 'left', title: wordmark, titleSize: 96, textTop: 150 }));

CARDS.push(
  { file: 'fine-nipona-es.jpg', eyebrow: 'Caso · Cliente · ViewportStudio3D', subtitle: 'Packshots, escena y animaciones para una gama de matcha premium.', bg: 'fine-nipona-escena-1080.jpg', bgLeft: 740, bgWidth: 460, shadeKind: 'left', title: 'Fine Nipona', titleSize: 110, textTop: 170 },
  { file: 'fine-nipona-en.jpg', eyebrow: 'Case study · Client · ViewportStudio3D', subtitle: 'Packshots, a scene and animations for a premium matcha range.', bg: 'fine-nipona-escena-1080.jpg', bgLeft: 740, bgWidth: 460, shadeKind: 'left', title: 'Fine Nipona', titleSize: 110, textTop: 170 },
  { file: 'pphone-17-es.jpg', eyebrow: 'Proyecto propio · ViewportStudio3D', subtitle: 'Película de lanzamiento de un smartphone en cinco colores.', bg: 'pphone-17-film-poster-1440.jpg', shadeKind: 'bottom', title: 'pPhone 17', titleSize: 110, textTop: 300 },
  { file: 'pphone-17-en.jpg', eyebrow: 'Personal project · ViewportStudio3D', subtitle: 'A launch film for a smartphone in five colours.', bg: 'pphone-17-film-poster-1440.jpg', shadeKind: 'bottom', title: 'pPhone 17', titleSize: 110, textTop: 300 },
);

async function main() {
  for (const f of [BLACK, BOLD]) if (!existsSync(f)) throw new Error(`Falta la fuente ${f}. Define OG_FONT_DIR.`);
  mkdirSync(OUT, { recursive: true });
  for (const c of CARDS) await card(c);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
