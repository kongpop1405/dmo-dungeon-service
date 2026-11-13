import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readdirSync, mkdirSync } from 'fs';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '..');

// ONLY=<item id> -> ชิ้นเดียว (items.html?only=) · OUT=*.jpg -> jpeg q85
const ONLY = process.env.ONLY || '';
const PAGE = `http://localhost:8777/src/items.html${ONLY ? `?only=${encodeURIComponent(ONLY)}` : ''}`;
const TARGET_W = process.env.TARGET_W ? Number(process.env.TARGET_W) : 2048;
const SCALE = TARGET_W / (ONLY ? 420 : 1080);

function findChromium() {
  const base = `${process.env.LOCALAPPDATA}/ms-playwright`;
  const dir = readdirSync(base).find(d => d.startsWith('chromium-') && !d.includes('headless'));
  return `${base}/${dir}/chrome-win64/chrome.exe`;
}

const outDir = resolve(ROOT, 'dist', 'posters');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage({ deviceScaleFactor: SCALE });
await page.setViewportSize({ width: 1160, height: 1180 });
await page.goto(PAGE, { waitUntil: 'networkidle' });
await page.waitForTimeout(450);

const poster = page.locator('#poster');
const out = process.env.OUT ? resolve(process.env.OUT) : resolve(outDir, ONLY ? `item-${ONLY}.png` : 'unlock-items.png');
if (!(await poster.locator('.it').count())) throw new Error(`no item ${ONLY} in poster.json unlockItems`);
const JPEG = /\.jpe?g$/i.test(out);
await poster.screenshot(JPEG ? { path: out, type: 'jpeg', quality: 85 } : { path: out });
const box = await poster.boundingBox();
await browser.close();
console.log(`exported ${out} @ ${Math.round(box.width*SCALE)}x${Math.round(box.height*SCALE)}px`);
