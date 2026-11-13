// Uso: node render.js datos.json carpeta_salida
// Genera tarjeta-ancha.png (ordenador) y tarjeta-cuadrada.png (móvil).
const { chromium } = require('playwright');
const fs = require('fs');
const [dataFile, outDir] = process.argv.slice(2);
const d = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
const COL = ['#3b82f6', '#a78bfa', '#34d399', '#f59e0b', '#f472b6', '#94a3b8'];

function html(sq) {
  const cols = sq ? 18 : 36, rows = 6, total = cols * rows;
  const f = sq ? { w: 900, pad: 44, tab: 30, lab: 26, num: 54, gap: 18, cell: 30, cg: 6, foot: 26, leg: 26 }
               : { w: 640, pad: 20, tab: 13, lab: 12, num: 22, gap: 10, cell: 14, cg: 3, foot: 12, leg: 12 };
  // Celdas: una por cada (100/total)% del contexto, coloreadas por categoría.
  const cells = []; let acc = 0;
  d.segments.forEach((s, i) => { acc += s.pct; while (cells.length < Math.round(acc / 100 * total)) cells.push(s.label === 'Libre' ? -1 : i); });
  while (cells.length < total) cells.push(-1);
  const heat = cells.map(c => `<i style="${c >= 0 ? 'background:' + COL[c % COL.length] : ''}"></i>`).join('');
  const tiles = d.tiles.map(([l, v]) => `<div class="t"><small>${l}</small><b>${v}</b></div>`).join('');
  const leg = d.segments.map((s, i) => `<span><u style="background:${s.label === 'Libre' ? '#3b3b38' : COL[i % COL.length]}"></u>${s.label} ${s.pct}%</span>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#262624;font-family:system-ui,-apple-system,sans-serif}
.card{width:${f.w}px;${sq ? 'height:900px;' : ''}box-sizing:border-box;background:#30302e;border:1px solid #444441;border-radius:16px;padding:${f.pad}px;color:#f5f4ee}
.top{display:flex;justify-content:space-between;margin-bottom:${f.pad * .8}px}
.top span{font-size:${f.tab}px;padding:${f.tab * .35}px ${f.tab * .8}px;border-radius:8px;color:#b8b6ad}
.top .on{background:#4a4a46;color:#fff}.tabs{display:flex;gap:4px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:${f.gap}px}
.t{background:#3b3b38;border-radius:10px;padding:${f.gap * 1.1}px ${f.gap * 1.2}px}
.t small{display:block;color:#b8b6ad;font-size:${f.lab}px;margin-bottom:4px}.t b{font-size:${f.num}px;font-weight:600}
.heat{display:grid;grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},${f.cell}px);gap:${f.cg}px;margin-top:${f.pad * .8}px}
.heat i{background:#3b3b38;border-radius:3px}
.leg{display:flex;flex-wrap:wrap;gap:${f.leg * .4}px ${f.leg * .8}px;margin-top:${f.pad * .5}px;font-size:${f.leg}px;color:#d6d4ca}
.leg u{display:inline-block;width:${f.leg * .6}px;height:${f.leg * .6}px;border-radius:3px;margin-right:6px}
.foot{margin-top:${f.pad * .5}px;font-size:${f.foot}px;color:#b8b6ad}
</style></head><body><div class="card">
<div class="top"><div class="tabs"><span class="on">${d.tabs[0]}</span><span>${d.tabs[1]}</span></div><span class="on">${d.range}</span></div>
<div class="grid">${tiles}</div><div class="heat">${heat}</div><div class="leg">${leg}</div><div class="foot">${d.foot}</div>
</div></body></html>`;
}

(async () => {
  const b = await chromium.launch();
  for (const [sq, name] of [[false, 'tarjeta-ancha.png'], [true, 'tarjeta-cuadrada.png']]) {
    const p = await b.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: sq ? 1 : 2 });
    await p.setContent(html(sq));
    await p.locator('.card').screenshot({ path: `${outDir}/${name}` });
  }
  await b.close();
})();
