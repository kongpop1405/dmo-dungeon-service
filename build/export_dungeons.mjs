import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readdirSync, readFileSync, mkdirSync } from 'fs';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '..');

// serve repo root ที่ :8777 (python -m http.server 8777)
const PAGE = 'http://localhost:8777/src/dungeon.html';

// FB ชอบกว้าง 2048px พอดี. poster กว้าง 1080 -> scale = TARGET_W/1080
const TARGET_W = process.env.TARGET_W ? Number(process.env.TARGET_W) : 2048;
const SCALE = TARGET_W / 1080;

function findChromium() {
  const base = 'C:/Users/kongp/AppData/Local/ms-playwright';
  const dir = readdirSync(base).find(d => d.startsWith('chromium-') && !d.includes('headless'));
  return `${base}/${dir}/chrome-win64/chrome.exe`;
}

const data = JSON.parse(readFileSync(resolve(ROOT, 'src/data/poster.json'), 'utf8'));
const outDir = resolve(ROOT, 'dist');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage({ deviceScaleFactor: SCALE });
await page.setViewportSize({ width: 1160, height: 1180 });

// filter: ENV ONLY="kaiser,darkweb" -> export เฉพาะที่ระบุ
const only = process.env.ONLY ? process.env.ONLY.split(',').map(s=>s.trim()) : null;
const list = only ? data.dungeons.filter(d => only.includes(d.id)) : data.dungeons;

for (const dg of list) {
  await page.goto(`${PAGE}?id=${dg.id}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(450); // รอ font + boss image
  const poster = page.locator('#poster');
  const out = resolve(outDir, `dungeon-${dg.id}.png`);
  await poster.screenshot({ path: out });
  const box = await poster.boundingBox();
  console.log(`exported ${out} @ ${Math.round(box.width*SCALE)}x${Math.round(box.height*SCALE)}px`);
}

await browser.close();
console.log(`done — ${list.length} poster(s)`);
