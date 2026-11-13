// The dmo-decks checkout these exports write into and check against.
import { resolve } from 'path';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { ROOT } from './render.mjs';

// DECKS=<path> overrides ../dmo-decks. Returns null when it is not a decks checkout.
export function decksDir() {
  const dir = resolve(ROOT, process.env.DECKS || '../dmo-decks');
  return existsSync(resolve(dir, 'docs')) ? dir : null;
}

// Every unlock item must carry a shopId that exists in decks' fallback price file, so
// a picture never advertises an item the shop cannot sell. Returns error lines (empty = ok).
export function unlockShopIdErrors(decks) {
  const items = JSON.parse(readFileSync(resolve(ROOT, 'src/data/poster.json'), 'utf8')).unlockItems.items;
  const pricesPath = resolve(decks, 'docs', 'shop_prices.json');
  const known = new Set(JSON.parse(readFileSync(pricesPath, 'utf8')).items.map(row => row['รหัส']));
  const errors = [];
  for (const it of items) {
    if (typeof it.shopId !== 'string' || !it.shopId) errors.push(`poster.json unlockItems ${it.id}: no shopId`);
    else if (!known.has(it.shopId)) errors.push(`poster.json unlockItems ${it.id}: shopId ${it.shopId} not in ${pricesPath}`);
  }
  return errors;
}

// Dungeon packs name their sheet rows per service mode (packages[].shopId = { carry, login })
// in poster.json and in each card's dungeon.packages. Every named row must exist in decks'
// fallback price file, and every dungeon row there (รหัส dg-*) must be named by some pack,
// so the shop never sells a pack the pictures do not show. Returns error lines (empty = ok).
export const SERVICE_MODES = ['carry', 'login'];

export function dungeonShopIdErrors(decks) {
  const poster = JSON.parse(readFileSync(resolve(ROOT, 'src/data/poster.json'), 'utf8'));
  const sources = poster.dungeons.map(d => ({ where: `poster.json dungeons ${d.id}`, packages: d.packages || [] }));
  const cardsDir = resolve(ROOT, 'src/data/cards');
  for (const f of existsSync(cardsDir) ? readdirSync(cardsDir).filter(f => f.endsWith('.json')).sort() : []) {
    const card = JSON.parse(readFileSync(resolve(cardsDir, f), 'utf8'));
    sources.push({ where: `cards/${f}`, packages: (card.dungeon && card.dungeon.packages) || [] });
  }

  const pricesPath = resolve(decks, 'docs', 'shop_prices.json');
  const known = new Set(JSON.parse(readFileSync(pricesPath, 'utf8')).items.map(row => row['รหัส']));
  const errors = [];
  const named = new Set();
  for (const { where, packages } of sources) {
    for (const p of packages) {
      if (p.shopId === undefined) continue;
      for (const mode of SERVICE_MODES) {
        const id = p.shopId && p.shopId[mode];
        if (typeof id !== 'string' || !id) errors.push(`${where} pack "${p.name}": no shopId.${mode}`);
        else if (!known.has(id)) errors.push(`${where} pack "${p.name}": shopId.${mode} ${id} not in ${pricesPath}`);
        else named.add(id);
      }
    }
  }
  for (const id of [...known].filter(id => /^dg-/.test(id)).sort()) {
    if (!named.has(id)) errors.push(`${pricesPath}: dungeon row ${id} is not named by any pack's shopId`);
  }
  return errors;
}
