import { resolve } from 'path';
import { ROOT, withRenderer, scaleFor } from './lib/render.mjs';

// NOPRICE=1 -> ซ่อนราคาในการ์ด (poster.html?noprice)
const NOPRICE = process.env.NOPRICE === '1';

// ENV override: OUT=<path> TARGET_W=<px>  (default: FB 2048px -> dist/posters/)
// OUT=*.jpg -> jpeg q85 (รูปลงเว็บ dmo-decks ให้โหลดเบา)
const OUT = process.env.OUT
  ? resolve(process.env.OUT)
  : resolve(ROOT, 'dist', 'posters', NOPRICE ? 'poster-fb-noprice.png' : 'poster-fb.png');

await withRenderer(shoot => shoot({
  page: `src/poster.html${NOPRICE ? '?noprice' : ''}`,
  out: OUT,
  scale: scaleFor(1080),
  viewport: { width: 1160, height: 1300 },
}));
