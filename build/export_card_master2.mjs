import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readdirSync, existsSync } from 'fs';
import { spawn } from 'child_process';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '..');

const OUT = process.env.OUT
  ? resolve(process.env.OUT)
  : resolve(ROOT, 'dist', 'dmo-card-master2.png');

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
await page.setViewportSize({ width: 1160, height: 1400 });
await page.goto(`http://localhost:${PORT}/src/card-master2.html`, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

const poster = page.locator('#poster');
const box = await poster.boundingBox();
await poster.screenshot({ path: OUT });
await browser.close();
server.close();
console.log(`exported ${OUT} @ ${Math.round(box.width * SCALE)}x${Math.round(box.height * SCALE)}px`);
