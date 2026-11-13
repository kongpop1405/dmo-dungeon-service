import { resolve } from 'path';
import { readFileSync } from 'fs';
import { ROOT, withRenderer, scaleFor } from './lib/render.mjs';

// ONLY=<item id> -> ชิ้นเดียว (items.html?only=) · OUT=*.jpg -> jpeg q85
const ONLY = process.env.ONLY || '';
if (ONLY) {
  const items = JSON.parse(readFileSync(resolve(ROOT, 'src/data/poster.json'), 'utf8')).unlockItems.items;
  if (!items.some(it => it.id === ONLY)) {
    console.error(`no item ${ONLY} in poster.json unlockItems (have: ${items.map(it => it.id).join(', ')})`);
    process.exit(1);
  }
}

const OUT = process.env.OUT
  ? resolve(process.env.OUT)
  : resolve(ROOT, 'dist', 'posters', ONLY ? `item-${ONLY}.png` : 'unlock-items.png');

await withRenderer(shoot => shoot({
  page: `src/items.html${ONLY ? `?only=${encodeURIComponent(ONLY)}` : ''}`,
  out: OUT,
  // ชิ้นเดียวกว้าง 420 (.single) · ทั้งชุดกว้าง 1080
  scale: scaleFor(ONLY ? 420 : 1080),
  viewport: { width: 1160, height: 1180 },
}));
