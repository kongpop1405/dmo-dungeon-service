import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readdirSync, mkdirSync } from 'fs';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '..');

const PAGE = 'http://localhost:8777/src/items.html';
const TARGET_W = process.env.TARGET_W ? Number(process.env.TARGET_W) : 2048;
const SCALE = TARGET_W / 1080;

function findChromium() {
  const base = 'C:/Users/kongp/AppData/Local/ms-playwright';
  const dir = readdirSync(base).find(d => d.startsWith('chromium-') && !d.includes('headless'));
  return `${base}/${dir}/chrome-win64/chrome.exe`;
}

const outDir = resolve(ROOT, 'dist');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage({ deviceScaleFactor: SCALE });
await page.setViewportSize({ width: 1160, height: 1180 });
await page.goto(PAGE, { waitUntil: 'networkidle' });
await page.waitForTimeout(450);

const poster = page.locator('#poster');
const out = resolve(outDir, 'dmo-unlock-items.png');
await poster.screenshot({ path: out });
const box = await poster.boundingBox();
await browser.close();
console.log(`exported ${out} @ ${Math.round(box.width*SCALE)}x${Math.round(box.height*SCALE)}px`);
