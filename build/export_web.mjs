// Web images for dmo-decks, listed in src/data/web-images.json and written straight
// into <DECKS>/docs/img/<kind>/. Facebook posts (with prices) stay in dist/ via the
// other export_* scripts.
//   node build/export_web.mjs ads            every row of that kind
//   ONLY=pkg-arma node build/export_web.mjs ads
//   DECKS=<path> overrides ../dmo-decks
import { resolve, basename, extname } from 'path';
import { readFileSync, existsSync } from 'fs';
import { ROOT, withRenderer } from './lib/render.mjs';

// Output contract per kind (width in px, jpg q85 from the render core).
const KINDS = {
  ads: { dir: 'ads', width: 1024 },
};

// CSS width each template lays #poster out at, and a viewport tall enough for it.
const TEMPLATES = {
  'poster.html': () => ({ base: 1080, viewport: { width: 1160, height: 1300 } }),
  'items.html': q => ({ base: 'only' in q ? 420 : 1080, viewport: { width: 1160, height: 1180 } }),
  'card-dungeon.html': () => ({ base: 1080, viewport: { width: 1160, height: 2400 } }),
};

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

const kind = process.argv[2];
if (!KINDS[kind]) fail(`usage: export_web.mjs <${Object.keys(KINDS).join('|')}>`);

const rows = JSON.parse(readFileSync(resolve(ROOT, 'src/data/web-images.json'), 'utf8')).images;
const seen = new Set();
for (const r of rows) {
  const where = `web-images.json ${r.kind}/${r.file}`;
  if (!KINDS[r.kind]) fail(`${where}: unknown kind`);
  if (!TEMPLATES[r.template]) fail(`${where}: unknown template ${r.template}`);
  if (extname(r.file) !== '.jpg' || basename(r.file) !== r.file) fail(`${where}: file must be a bare .jpg name`);
  if (seen.has(`${r.kind}/${r.file}`)) fail(`${where}: listed twice`);
  seen.add(`${r.kind}/${r.file}`);
}

let todo = rows.filter(r => r.kind === kind);
const only = (process.env.ONLY || '').split(',').map(s => s.trim()).filter(Boolean);
if (only.length) {
  const names = new Set(todo.map(r => r.file.replace(/\.jpg$/, '')));
  const missing = only.filter(id => !names.has(id));
  if (missing.length) fail(`no ${kind} image ${missing.join(', ')} (have: ${[...names].join(', ')})`);
  todo = todo.filter(r => only.includes(r.file.replace(/\.jpg$/, '')));
}

const decks = resolve(ROOT, process.env.DECKS || '../dmo-decks');
if (!existsSync(resolve(decks, 'docs'))) fail(`not a dmo-decks checkout (no docs/): ${decks} (set DECKS)`);
const outDir = resolve(decks, 'docs', 'img', KINDS[kind].dir);

await withRenderer(async shoot => {
  for (const r of todo) {
    const query = r.query || {};
    const { base, viewport } = TEMPLATES[r.template](query);
    const qs = new URLSearchParams(query).toString();
    await shoot({
      page: `src/${r.template}${qs ? `?${qs}` : ''}`,
      out: resolve(outDir, r.file),
      scale: KINDS[kind].width / base,
      viewport,
    });
  }
});
