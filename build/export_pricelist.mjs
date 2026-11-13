import { resolve } from 'path';
import { ROOT, withRenderer, scaleFor } from './lib/render.mjs';

// OUT=<path> (OUT=*.jpg -> jpeg q85) · TARGET_W=<px>
const OUT = process.env.OUT ? resolve(process.env.OUT) : resolve(ROOT, 'dist', 'posters', 'pricelist.png');

await withRenderer(shoot => shoot({
  page: 'src/pricelist.html',
  out: OUT,
  scale: scaleFor(1080),
  viewport: { width: 1160, height: 1400 },
}));
