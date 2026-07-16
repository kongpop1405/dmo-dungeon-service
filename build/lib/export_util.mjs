import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readdirSync, mkdirSync } from 'fs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// FB ชอบกว้าง 2048px พอดี (ใหญ่/เล็กกว่านี้ FB resize -> แตก).
// poster กว้าง 1080 -> scale = TARGET_W/1080. ENV override: TARGET_W=<px>
export const TARGET_W = process.env.TARGET_W ? Number(process.env.TARGET_W) : 2048;
export const SCALE = TARGET_W / 1080;

// หา chromium ของ playwright (เลี่ยง hardcode version)
function findChromium() {
  const base = 'C:/Users/kongp/AppData/Local/ms-playwright';
  const dir = readdirSync(base).find(d => d.startsWith('chromium-') && !d.includes('headless'));
  return `${base}/${dir}/chrome-win64/chrome.exe`;
}

export function distDir() {
  const d = resolve(ROOT, 'dist');
  mkdirSync(d, { recursive: true });
  return d;
}

export async function launchPage(viewportHeight) {
  const browser = await chromium.launch({ executablePath: findChromium() });
  const page = await browser.newPage({ deviceScaleFactor: SCALE });
  await page.setViewportSize({ width: 1160, height: viewportHeight });
  return { browser, page };
}

// เปิด url -> รอ font/รูป settle -> screenshot #poster -> log ขนาดจริง
export async function shootPoster(page, url, out, settle = 450) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(settle);
  const poster = page.locator('#poster');
  await poster.screenshot({ path: out });
  const box = await poster.boundingBox();
  console.log(`exported ${out} @ ${Math.round(box.width * SCALE)}x${Math.round(box.height * SCALE)}px`);
}
