/**
 * Comprueba que todas las páginas del sitemap y todos los recursos que enlazan
 * (imágenes, vídeos, fuentes, OG, scripts) responden 200, y que las rutas inexistentes dan 404.
 * Uso: con el servidor en marcha →  node scripts/check-routes.mjs [http://localhost:3000]
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const results = { pages: [], assets: [], notFound: [], errors: [] };

async function status(url) {
  try {
    const res = await fetch(url, { redirect: 'manual' });
    return res.status;
  } catch (e) {
    return `ERR ${e.message}`;
  }
}

const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, BASE));
const assets = new Set();

for (const url of pages) {
  const res = await fetch(url);
  const html = await res.text();
  results.pages.push({ url, status: res.status });
  const refs = [
    ...[...html.matchAll(/(?:src|href|poster|content)="([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/srcSet="([^"]+)"/gi)].flatMap((m) => m[1].split(',').map((s) => s.trim().split(' ')[0])),
  ];
  for (const r of refs) {
    const u = r.replace(/&amp;/g, '&');
    if (/^\/(media|og|_next\/static|icon|apple-icon|manifest)/.test(u)) assets.add(`${BASE}${u}`);
    else if (u.startsWith(BASE) && /\/(media|og)\//.test(u)) assets.add(u);
  }
}

for (const url of assets) results.assets.push({ url, status: await status(url) });
for (const path of ['/esta-pagina-no-existe', '/en/this-page-does-not-exist', '/proyectos/no-existe', '/en/projects/nope']) {
  results.notFound.push({ url: BASE + path, status: await status(BASE + path) });
}

const bad = [
  ...results.pages.filter((p) => p.status !== 200),
  ...results.assets.filter((a) => a.status !== 200),
  ...results.notFound.filter((n) => n.status !== 404),
];
mkdirSync('informes', { recursive: true });
writeFileSync('informes/rutas.json', JSON.stringify({ base: BASE, ok: bad.length === 0, bad, ...results }, null, 2));
console.log(`Páginas: ${results.pages.length} · Recursos: ${results.assets.length} · Fallos: ${bad.length}`);
for (const b of bad) console.log('  ✗', b.status, b.url);
process.exit(bad.length ? 1 : 0);
