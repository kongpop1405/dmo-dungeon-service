import { resolve } from 'path';
import { launchPage, shootPoster, distDir } from './lib/export_util.mjs';

const PAGE = 'http://localhost:8777/src/items.html';

const { browser, page } = await launchPage(1180);
await shootPoster(page, PAGE, resolve(distDir(), 'dmo-unlock-items.png'));
await browser.close();
