import { launchChromium } from './lib/render.mjs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync, mkdirSync } from 'fs';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '..');
const OUT = resolve(ROOT, 'dist', 'posters', 'master2-stitch.png');
mkdirSync(dirname(OUT), { recursive: true });

// รูปที่ user ให้ — ผล A (บน) + เลือกดัน (ล่าง)
const IMGS = ['_src-images/raw/master2-result-raw.png', '_src-images/raw/master2-select-full.png'];

function dim(f) {
  const b = readFileSync(resolve(ROOT, f));
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
function dataURI(f) {
  return 'data:image/png;base64,' + readFileSync(resolve(ROOT, f)).toString('base64');
}

const W = Math.max(...IMGS.map(f => dim(f).w));            // กว้างสุด = canvas width
const rows = IMGS.map(f => { const { w, h } = dim(f); return { uri: dataURI(f), h: Math.round(h * W / w) }; });
const totalH = rows.reduce((s, r) => s + r.h, 0);

const html = `<!DOCTYPE html><html><head><style>
  *{margin:0;padding:0} body{background:#020912}
  .stack{width:${W}px;display:flex;flex-direction:column}
  .stack img{width:100%;display:block}
</style></head><body>
  <div class="stack" id="stack">
    ${rows.map(r => `<img src="${r.uri}">`).join('')}
  </div>
</body></html>`;

const browser = await launchChromium();
const page = await browser.newPage({ deviceScaleFactor: 1 });
await page.setViewportSize({ width: W, height: totalH });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.locator('#stack').screenshot({ path: OUT });
await browser.close();
console.log(`exported ${OUT} @ ${W}x${totalH}px`);
