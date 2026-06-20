import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readdirSync } from 'fs';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '..');

// serve repo root ที่ :8777 (python -m http.server 8777) แล้ว poster อยู่ src/
const URL = 'http://localhost:8777/src/poster.html';

// ENV override: OUT=<path> TARGET_W=<px>  (default: FB 2048px -> dist/)
const OUT = process.env.OUT
  ? resolve(process.env.OUT)
  : resolve(ROOT, 'dist', 'dmo-poster-fb.png');

// FB ชอบกว้าง 2048px พอดี (ใหญ่/เล็กกว่านี้ FB resize -> แตก).
// poster กว้าง 1080 -> scale = TARGET_W/1080
const TARGET_W = process.env.TARGET_W ? Number(process.env.TARGET_W) : 2048;
const POSTER_W = 1080;
const SCALE = TARGET_W / POSTER_W;

// หา chromium ของ playwright (เลี่ยง hardcode version)
function findChromium() {
  const base = 'C:/Users/kongp/AppData/Local/ms-playwright';
  const dir = readdirSync(base).find(d => d.startsWith('chromium-') && !d.includes('headless'));
  return `${base}/${dir}/chrome-win64/chrome.exe`;
}

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage({ deviceScaleFactor: SCALE });
await page.setViewportSize({ width: 1160, height: 1300 });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(500); // รอ font + boss image โหลด

const poster = page.locator('#poster');
await poster.screenshot({ path: OUT });

const box = await poster.boundingBox();
await browser.close();
console.log(`exported ${OUT} @ ${Math.round(box.width*SCALE)}x${Math.round(box.height*SCALE)}px`);
