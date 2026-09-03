import { chromium } from 'playwright';
import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

// crop result-strip ให้เหลือแถบสรุปบน (ตัดแผง teamer/EXP ล่างทิ้ง)
const [src, out, ratioStr] = process.argv.slice(2);
const ratio = Number(ratioStr);              // ส่วนสูงที่เก็บ (0-1)

function dim(f){ const b=readFileSync(f); return {w:b.readUInt32BE(16), h:b.readUInt32BE(20)}; }
function findChromium(){
  const base=`${process.env.LOCALAPPDATA}/ms-playwright`;
  const d=readdirSync(base).find(x=>x.startsWith('chromium-')&&!x.includes('headless'));
  return `${base}/${d}/chrome-win64/chrome.exe`;
}
const {w,h}=dim(src);
const ch=Math.round(h*ratio);
const uri='data:image/png;base64,'+readFileSync(src).toString('base64');
const html=`<!DOCTYPE html><html><head><style>*{margin:0;padding:0}
 body{background:#020912}
 #c{width:${w}px;height:${ch}px;overflow:hidden}
 #c img{width:${w}px;display:block}</style></head>
 <body><div id="c"><img src="${uri}"></div></body></html>`;

const browser=await chromium.launch({executablePath:findChromium()});
const page=await browser.newPage({deviceScaleFactor:1});
await page.setViewportSize({width:w,height:ch});
await page.setContent(html,{waitUntil:'networkidle'});
await page.locator('#c').screenshot({path:out});
await browser.close();
console.log(`cropped ${src} -> ${out} @ ${w}x${ch} (kept ${Math.round(ratio*100)}%)`);
