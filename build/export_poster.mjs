import { resolve } from 'path';
import { launchPage, shootPoster, distDir } from './lib/export_util.mjs';

// serve repo root ที่ :8777 (python -m http.server 8777) แล้ว poster อยู่ src/
const URL = 'http://localhost:8777/src/poster.html';

// ENV override: OUT=<path>  (default: dist/dmo-poster-fb.png)
const OUT = process.env.OUT ? resolve(process.env.OUT) : resolve(distDir(), 'dmo-poster-fb.png');

const { browser, page } = await launchPage(1300);
await shootPoster(page, URL, OUT, 500); // รอ font + boss image โหลด
await browser.close();
