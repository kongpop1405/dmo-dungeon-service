// The dmo-decks checkout these exports write into and check against.
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
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
