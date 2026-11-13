// Web images for dmo-decks, listed in src/data/web-images.json and written straight
// into <DECKS>/docs/img/<kind>/. Facebook posts (with prices) stay in dist/ via the
// other export_* scripts.
//   node build/export_web.mjs ads            every row of that kind
//   node build/export_web.mjs shop           product card pictures + each one's
//                                            in-game tooltip as <code>-tooltip.png
//   node build/export_web.mjs og             link-preview pictures, one per page stem:
//                                            <stem>-<YYYYMMDD>.jpg, a new name only
//                                            when the picture changed (old ones stay)
//   ONLY=pkg-arma node build/export_web.mjs ads
//   DECKS=<path> overrides ../dmo-decks
import { resolve, basename, extname } from 'path';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { ROOT, withRenderer } from './lib/render.mjs';
import { decksDir, unlockShopIdErrors, dungeonShopIdErrors } from './lib/decks.mjs';

// Output contract per kind (width in px, jpg q85 from the render core).
const KINDS = {
  ads: { dir: 'ads', width: 1024 },
  shop: { dir: 'shop', width: 480 },
  og: { dir: 'og', width: 1200 },
};

// CSS width each template lays #poster out at, and a viewport tall enough for it.
const TEMPLATES = {
  'poster.html': () => ({ base: 1080, viewport: { width: 1160, height: 1300 } }),
  'items.html': q => ({ base: 'only' in q ? 420 : 1080, viewport: { width: 1160, height: 1180 } }),
  'card-dungeon.html': () => ({ base: 1080, viewport: { width: 1160, height: 2400 } }),
  'shop-card.html': () => ({ base: 480, viewport: { width: 600, height: 400 } }),
  'og.html': () => ({ base: 1200, viewport: { width: 1280, height: 720 } }),
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

const decks = decksDir();
if (!decks) fail(`not a dmo-decks checkout (no docs/): ${resolve(ROOT, process.env.DECKS || '../dmo-decks')} (set DECKS)`);
if (todo.some(r => r.template === 'items.html' || r.template === 'shop-card.html')) {
  const errors = unlockShopIdErrors(decks);
  if (errors.length) fail(errors.join('\n'));
}
if (todo.some(r => r.template === 'poster.html' || r.template === 'card-dungeon.html')) {
  const errors = dungeonShopIdErrors(decks);
  if (errors.length) fail(errors.join('\n'));
}
const outDir = resolve(decks, 'docs', 'img', KINDS[kind].dir);

// Facebook caches a preview by its URL, so a changed og picture gets a new dated
// name and the old file stays for links already shared; decks validate accepts an
// unreferenced <stem>-<YYYYMMDD>.jpg only while a newer one of that stem is in use.
function today() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}
function ogTarget(r) {
  const stem = r.file.replace(/\.jpg$/, '');
  if (!/^[a-z0-9-]+$/.test(stem)) fail(`web-images.json og/${r.file}: name must be a dmo-decks page stem`);
  const dated = new RegExp(`^${stem}-\\d{8}\\.jpg$`);
  const have = existsSync(outDir) ? readdirSync(outDir).filter(f => dated.test(f)).sort() : [];
  const fresh = resolve(outDir, `${stem}-${today()}.jpg`);
  return {
    out: have.length ? resolve(outDir, have[have.length - 1]) : fresh,
    writeTo: fresh,
    key: `og/${stem}`,
  };
}

// decks shop.html opens <code>-tooltip.png from a product's "ดูสินค้า" button, and its
// validate fails on a product picture without one, so both are written together.
const unlockItems = JSON.parse(readFileSync(resolve(ROOT, 'src/data/poster.json'), 'utf8')).unlockItems.items;
const tooltips = [];
for (const r of todo.filter(r => r.template === 'shop-card.html')) {
  const code = r.file.replace(/\.jpg$/, '');
  const it = unlockItems.find(x => x.id === (r.query || {}).only);
  if (!it) fail(`web-images.json ${r.kind}/${r.file}: no unlock item ${(r.query || {}).only}`);
  if (it.shopId !== code) fail(`web-images.json ${r.kind}/${r.file}: unlock item ${it.id} has shopId ${it.shopId}`);
  tooltips.push({ from: resolve(ROOT, 'src', it.tooltip), out: resolve(outDir, `${code}-tooltip.png`) });
}
for (const t of tooltips) if (!existsSync(t.from)) fail(`tooltip not found: ${t.from}`);

await withRenderer(async shoot => {
  for (const r of todo) {
    const query = r.query || {};
    const { base, viewport } = TEMPLATES[r.template](query);
    const qs = new URLSearchParams(query).toString();
    await shoot({
      page: `src/${r.template}${qs ? `?${qs}` : ''}`,
      ...(kind === 'og' ? ogTarget(r) : { out: resolve(outDir, r.file) }),
      scale: KINDS[kind].width / base,
      viewport,
    });
  }
});

for (const t of tooltips) {
  const bytes = readFileSync(t.from);
  const same = existsSync(t.out) && readFileSync(t.out).equals(bytes);
  if (!same) writeFileSync(t.out, bytes);
  console.log(`${same ? 'unchanged' : 'copied'} ${t.out}`);
}
