import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve, extname } from 'path';
import { readdirSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { createServer } from 'http';
import { readFile } from 'fs/promises';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '..');

// slug ของดันเจี้ยน — ต้องมี src/data/cards/<slug>.json
const slug = (process.argv[2] || 'master2').replace(/[^a-z0-9-]/gi, '');
const dataFile = resolve(ROOT, 'src', 'data', 'cards', `${slug}.json`);
if (!existsSync(dataFile)) {
  console.error(`no card data: src/data/cards/${slug}.json`);
  console.error(`available: ${readdirSync(resolve(ROOT, 'src/data/cards')).map(f => f.replace('.json', '')).join(', ')}`);
  process.exit(1);
}

// แยกโฟลเดอร์ตามดันเจี้ยน: dist/cards/<dungeon>/<variant>.png
// เอาชื่อดันจาก dungeon.slug ใน json ไม่ใช่ split '-' ของ slug
// (ดันชื่อมี '-' เองได้ เช่น kaiser-dungeon → split แล้วแยกผิด)
const card = JSON.parse(readFileSync(dataFile, 'utf8'));
const dungeonSlug = card.dungeon?.slug || slug;
// slug 'neverland-facebook' + dungeon 'neverland' → variant 'facebook'
// slug 'neverland' ตรงกับ dungeon → variant 'default'
const variant = slug === dungeonSlug
  ? 'default'
  : (slug.startsWith(dungeonSlug + '-') ? slug.slice(dungeonSlug.length + 1) : slug);

const OUT = process.env.OUT
  ? resolve(process.env.OUT)
  : resolve(ROOT, 'dist', 'cards', dungeonSlug, `${variant}.png`);
mkdirSync(dirname(OUT), { recursive: true });

const TARGET_W = process.env.TARGET_W ? Number(process.env.TARGET_W) : 2048;
const POSTER_W = 1080;
const SCALE = TARGET_W / POSTER_W;
const PORT = 8788;

// หา chromium ของ playwright (เลี่ยง hardcode user/version)
function findChromium() {
  const base = `${process.env.LOCALAPPDATA}/ms-playwright`;
  const dir = readdirSync(base).find(d => d.startsWith('chromium-') && !d.includes('headless'));
  return `${base}/${dir}/chrome-win64/chrome.exe`;
}

const MIME = { '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css', '.js': 'text/javascript' };

// static server ครอบ ROOT (ไม่พึ่ง python)
const server = createServer(async (req, res) => {
  try {
    const fp = resolve(ROOT, '.' + decodeURIComponent(req.url.split('?')[0]));
    const buf = await readFile(fp);
    res.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'application/octet-stream' });
    res.end(buf);
  } catch { res.writeHead(404); res.end('404'); }
});
await new Promise(r => server.listen(PORT, r));

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage({ deviceScaleFactor: SCALE });
await page.setViewportSize({ width: 1160, height: 2400 });   // สูงเผื่อ poster ที่ยืดตามเนื้อ
await page.goto(`http://localhost:${PORT}/src/card-dungeon.html?d=${slug}`, { waitUntil: 'networkidle' });

// เพจต้องบอกว่า render ครบ — ไม่งั้น screenshot ได้ PNG เปล่าแล้ว exit 0
await page.waitForFunction(
  () => document.body.dataset.ready === '1' || document.body.dataset.error,
  { timeout: 15000 }
).catch(() => {});

const err = await page.getAttribute('body', 'data-error');
if (err) {
  console.error(`render failed: ${err}`);
  await browser.close(); server.close();
  process.exit(1);
}

await page.waitForTimeout(400);

const poster = page.locator('#poster');
const box = await poster.boundingBox();
await poster.screenshot({ path: OUT });
await browser.close();
server.close();
console.log(`exported ${OUT} @ ${Math.round(box.width * SCALE)}x${Math.round(box.height * SCALE)}px`);
