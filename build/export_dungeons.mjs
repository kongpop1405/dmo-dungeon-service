import { resolve } from 'path';
import { readFileSync } from 'fs';
import { ROOT, launchPage, shootPoster, distDir } from './lib/export_util.mjs';

const PAGE = 'http://localhost:8777/src/dungeon.html';

const data = JSON.parse(readFileSync(resolve(ROOT, 'src/data/poster.json'), 'utf8'));
const outDir = distDir();

// filter: ENV ONLY="kaiser,darkweb" -> export เฉพาะที่ระบุ
const only = process.env.ONLY ? process.env.ONLY.split(',').map(s => s.trim()) : null;
const list = only ? data.dungeons.filter(d => only.includes(d.id)) : data.dungeons;

const { browser, page } = await launchPage(1180);
for (const dg of list) {
  await shootPoster(page, `${PAGE}?id=${dg.id}`, resolve(outDir, `dungeon-${dg.id}.png`));
}
await browser.close();
console.log(`done — ${list.length} poster(s)`);
