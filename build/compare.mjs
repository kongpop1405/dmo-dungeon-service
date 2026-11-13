// Pixel-compare every png under two folders (same relative paths).
// Compares pixels, not bytes, so it also works on renders from different runs.
// Usage: node build/compare.mjs <baseDir> <newDir>   -> exit 1 on any difference
import { readdirSync, readFileSync, statSync } from 'fs';
import { resolve, relative, join, sep } from 'path';
import { launchChromium } from './lib/render.mjs';

const [baseArg, newArg] = process.argv.slice(2);
if (!baseArg || !newArg) {
  console.error('usage: node build/compare.mjs <baseDir> <newDir>');
  process.exit(2);
}
const baseDir = resolve(baseArg);
const newDir = resolve(newArg);

function pngs(dir) {
  const out = [];
  (function walk(d) {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.toLowerCase().endsWith('.png')) out.push(relative(dir, p).split(sep).join('/'));
    }
  })(dir);
  return out.sort();
}

const baseList = pngs(baseDir);
const newList = pngs(newDir);
const missing = baseList.filter(f => !newList.includes(f));
const extra = newList.filter(f => !baseList.includes(f));
const common = baseList.filter(f => newList.includes(f));

const browser = await launchChromium();
const page = await browser.newPage();
let bad = 0;
try {
  for (const f of common) {
    const a = readFileSync(join(baseDir, f));
    const b = readFileSync(join(newDir, f));
    if (a.equals(b)) { console.log(`same   ${f}`); continue; }
    const r = await page.evaluate(async ([ua, ub]) => {
      const load = async uri => { const i = new Image(); i.src = uri; await i.decode(); return i; };
      const [ia, ib] = await Promise.all([load(ua), load(ub)]);
      if (ia.width !== ib.width || ia.height !== ib.height) {
        return { size: `${ia.width}x${ia.height} vs ${ib.width}x${ib.height}` };
      }
      const px = img => {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const x = c.getContext('2d', { willReadFrequently: true });
        x.drawImage(img, 0, 0);
        return x.getImageData(0, 0, c.width, c.height).data;
      };
      const pa = px(ia), pb = px(ib);
      let diff = 0;
      for (let i = 0; i < pa.length; i += 4) {
        if (pa[i] !== pb[i] || pa[i + 1] !== pb[i + 1] || pa[i + 2] !== pb[i + 2] || pa[i + 3] !== pb[i + 3]) diff++;
      }
      return { diff, total: pa.length / 4 };
    }, [`data:image/png;base64,${a.toString('base64')}`, `data:image/png;base64,${b.toString('base64')}`]);
    if (r.size) { bad++; console.log(`SIZE   ${f}  ${r.size}`); }
    else if (r.diff) { bad++; console.log(`DIFF   ${f}  ${r.diff}/${r.total} px`); }
    else console.log(`same   ${f}  (pixels equal, bytes differ)`);
  }
} finally {
  await browser.close();
}
for (const f of missing) console.log(`MISSING ${f}`);
for (const f of extra) console.log(`EXTRA  ${f}`);
const failed = bad + missing.length + extra.length;
console.log(`${common.length - bad}/${baseList.length} equal · ${failed} problem(s)`);
process.exit(failed ? 1 : 0);
