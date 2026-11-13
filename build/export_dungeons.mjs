import { resolve } from 'path';
import { readFileSync } from 'fs';
import { ROOT, withRenderer, scaleFor } from './lib/render.mjs';

const data = JSON.parse(readFileSync(resolve(ROOT, 'src/data/poster.json'), 'utf8'));

// ONLY="kaiser,darkweb" -> export เฉพาะที่ระบุ
const only = process.env.ONLY ? [...new Set(process.env.ONLY.split(',').map(s => s.trim()).filter(Boolean))] : null;
const list = only ? data.dungeons.filter(d => only.includes(d.id)) : data.dungeons;
if (only && list.length !== only.length) {
  const known = data.dungeons.map(d => d.id);
  console.error(`unknown dungeon id: ${only.filter(id => !known.includes(id)).join(', ')} (have: ${known.join(', ')})`);
  process.exit(1);
}

// OUT ใช้ได้เมื่อเลือกดันเดียว (OUT=*.jpg -> jpeg q85)
if (process.env.OUT && list.length !== 1) {
  console.error('OUT needs exactly one dungeon (ONLY=<id>)');
  process.exit(1);
}

await withRenderer(async shoot => {
  for (const dg of list) {
    await shoot({
      page: `src/dungeon.html?id=${encodeURIComponent(dg.id)}`,
      out: process.env.OUT ? resolve(process.env.OUT) : resolve(ROOT, 'dist', 'dungeons', `${dg.id}.png`),
      scale: scaleFor(1080),
      viewport: { width: 1160, height: 1180 },
    });
  }
});
console.log(`done — ${list.length} poster(s)`);
