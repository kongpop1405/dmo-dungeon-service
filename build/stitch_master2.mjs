import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readdirSync, readFileSync } from 'fs';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '..');
const OUT = resolve(ROOT, 'dist', 'dmo-master2-stitch.png');

// รูปที่ user ให้ — ผล A (บน) + เลือกดัน (ล่าง)
const IMGS = ['imagie.png', 'image.png'];

function dim(f) {
  const b = readFileSync(resolve(ROOT, f));
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
function dataURI(f) {
  return 'data:image/png;base64,' + readFileSync(resolve(ROOT, f)).toString('base64');
}
function findChromium() {
  const base = `${process.env.LOCALAPPDATA}/ms-playwright`;
  const d = readdirSync(base).find(x => x.startsWith('chromium-') && !x.includes('headless'));
  return `${base}/${d}/chrome-win64/chrome.exe`;
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

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage({ deviceScaleFactor: 1 });
await page.setViewportSize({ width: W, height: totalH });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.locator('#stack').screenshot({ path: OUT });
await browser.close();
console.log(`exported ${OUT} @ ${W}x${totalH}px`);
