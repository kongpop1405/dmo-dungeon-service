// Shared render core for every export script: one static server, one chromium,
// pages signal completion through body[data-ready] / body[data-error].
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve, extname, relative, sep } from 'path';
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { readFile } from 'fs/promises';
import { createServer } from 'http';
import { createHash } from 'crypto';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// jpg bytes differ on every encode even when the pixels do not, so a jpg is
// rewritten only when the png hash of the same shot changes.
const HASH_FILE = resolve(ROOT, 'build', 'render-hashes.json');

const READY_TIMEOUT = 15000;
const JPEG_QUALITY = 85;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.js': 'text/javascript',
  '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml',
};

export function findChromium() {
  const base = `${process.env.LOCALAPPDATA}/ms-playwright`;
  const dir = readdirSync(base).find(d => d.startsWith('chromium-') && !d.includes('headless'));
  return `${base}/${dir}/chrome-win64/chrome.exe`;
}

export function launchChromium() {
  return chromium.launch({ executablePath: findChromium() });
}

function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const fp = resolve(ROOT, '.' + decodeURIComponent(req.url.split('?')[0]));
      if (fp !== ROOT && !fp.startsWith(ROOT + sep)) { res.writeHead(403); res.end(); return; }
      const buf = await readFile(fp);
      res.writeHead(200, { 'Content-Type': MIME[extname(fp).toLowerCase()] || 'application/octet-stream' });
      res.end(buf);
    } catch { res.writeHead(404); res.end('404'); }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

function hashKey(out) {
  return relative(ROOT, out).split(sep).join('/');
}

function loadHashes() {
  return existsSync(HASH_FILE) ? JSON.parse(readFileSync(HASH_FILE, 'utf8')) : {};
}

function saveHashes(hashes) {
  const sorted = Object.fromEntries(Object.entries(hashes).sort(([a], [b]) => a.localeCompare(b)));
  const text = JSON.stringify(sorted, null, 2) + '\n';
  if (!existsSync(HASH_FILE) || readFileSync(HASH_FILE, 'utf8') !== text) writeFileSync(HASH_FILE, text);
}

// Large scaled images can still be mid-raster right after data-ready, and the
// first shot then differs from every later one; take shots until two in a row match.
const STABLE_TRIES = 10;
const STABLE_GAP_MS = 100;

async function stableShot(el, path) {
  let prev = await el.screenshot({ type: 'png' });
  for (let i = 1; i < STABLE_TRIES; i++) {
    await el.page().waitForTimeout(STABLE_GAP_MS);
    const next = await el.screenshot({ type: 'png' });
    if (next.equals(prev)) return next;
    prev = next;
  }
  throw new Error(`render never settled: ${path} (${STABLE_TRIES} shots all differ)`);
}

// Opens the server + browser once, runs fn(shoot), always cleans up.
// shoot({ page, out, scale, viewport, selector }) -> 'written' | 'unchanged'
export async function withRenderer(fn) {
  const server = await startServer();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await launchChromium();
  const hashes = loadHashes();
  let hashesDirty = false;

  async function shoot({ page: path, out, scale = 1, viewport = { width: 1160, height: 1300 }, selector = '#poster' }) {
    const tab = await browser.newPage({ deviceScaleFactor: scale, viewport });
    try {
      await tab.goto(`${origin}/${path}`, { waitUntil: 'networkidle' });
      await tab.waitForFunction(
        () => document.body.dataset.ready === '1' || document.body.dataset.error,
        null, { timeout: READY_TIMEOUT },
      ).catch(() => { throw new Error(`render timeout: ${path} never set data-ready`); });
      const err = await tab.getAttribute('body', 'data-error');
      if (err) throw new Error(`render failed: ${path}: ${err}`);
      await tab.evaluate(() => document.fonts.ready);

      const el = tab.locator(selector);
      const png = await stableShot(el, path);
      const box = await el.boundingBox();
      const size = `${Math.round(box.width * scale)}x${Math.round(box.height * scale)}px`;
      const outPath = resolve(out);
      mkdirSync(dirname(outPath), { recursive: true });

      let status;
      if (/\.jpe?g$/i.test(outPath)) {
        const key = hashKey(outPath);
        // quality is part of the hash so changing it forces a rewrite
        const hash = createHash('sha256').update(png).update(`q${JPEG_QUALITY}`).digest('hex');
        if (hashes[key] === hash && existsSync(outPath)) status = 'unchanged';
        else {
          const jpg = await el.screenshot({ type: 'jpeg', quality: JPEG_QUALITY });
          // the jpg is a separate capture; prove it came from the same frame as the hashed png
          if (!(await el.screenshot({ type: 'png' })).equals(png)) {
            throw new Error(`render changed between png and jpg capture: ${path}`);
          }
          writeFileSync(outPath, jpg);
          hashes[key] = hash;
          hashesDirty = true;
          status = 'written';
        }
      } else if (existsSync(outPath) && readFileSync(outPath).equals(png)) status = 'unchanged';
      else { writeFileSync(outPath, png); status = 'written'; }

      console.log(`${status === 'written' ? 'exported' : 'unchanged'} ${outPath} @ ${size}`);
      return status;
    } finally {
      await tab.close();
    }
  }

  try {
    return await fn(shoot);
  } finally {
    if (hashesDirty) saveHashes(hashes);
    await browser.close();
    server.close();
  }
}

// FB likes exactly 2048px wide; templates are laid out at `baseWidth` CSS px.
export function scaleFor(baseWidth, defaultTarget = 2048) {
  const target = process.env.TARGET_W ? Number(process.env.TARGET_W) : defaultTarget;
  return target / baseWidth;
}
