import { resolve } from 'path';
import { ROOT, withRenderer, scaleFor } from './lib/render.mjs';

// legacy template (card-master2.html) — ชื่อแยกจาก cards/master2/default.png ของ export_card.mjs
// ไม่งั้น 2 สคริปต์เขียนทับไฟล์เดียวกัน
const OUT = process.env.OUT
  ? resolve(process.env.OUT)
  : resolve(ROOT, 'dist', 'cards', 'master2-legacy.png');

await withRenderer(shoot => shoot({
  page: 'src/card-master2.html',
  out: OUT,
  scale: scaleFor(1080),
  viewport: { width: 1160, height: 1400 },
}));
