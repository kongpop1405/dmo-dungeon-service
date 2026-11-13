import { resolve } from 'path';
import { readdirSync, existsSync, readFileSync } from 'fs';
import { ROOT, withRenderer, scaleFor } from './lib/render.mjs';

// slug ของดันเจี้ยน — ต้องมี src/data/cards/<slug>.json
const args = process.argv.slice(2);
const slug = (args.find(a => !a.startsWith('--')) || 'master2').replace(/[^a-z0-9-]/gi, '');
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

await withRenderer(shoot => shoot({
  page: `src/card-dungeon.html?d=${slug}`,
  out: OUT,
  scale: scaleFor(1080),
  viewport: { width: 1160, height: 2400 },   // สูงเผื่อ poster ที่ยืดตามเนื้อ
}));
