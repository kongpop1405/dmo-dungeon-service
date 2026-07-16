import { resolve } from 'path';
import { launchPage, shootPoster, distDir } from './lib/export_util.mjs';

const PAGE = 'http://localhost:8777/src/pricelist.html';

const { browser, page } = await launchPage(1400);
await shootPoster(page, PAGE, resolve(distDir(), 'dmo-pricelist.png'));
await browser.close();
