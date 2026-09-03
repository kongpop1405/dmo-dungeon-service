import { chromium } from 'playwright';
import { readdirSync, readFileSync } from 'fs';

// ตัดขอบขาว + ทำพื้นโปร่งใส ผ่าน canvas ในเบราว์เซอร์
const [src, out] = process.argv.slice(2);

function findChromium(){
  const base = `${process.env.LOCALAPPDATA}/ms-playwright`;
  const d = readdirSync(base).find(x => x.startsWith('chromium-') && !x.includes('headless'));
  return `${base}/${d}/chrome-win64/chrome.exe`;
}

const uri = 'data:image/png;base64,' + readFileSync(src).toString('base64');
const browser = await chromium.launch({ executablePath: findChromium() });
const page = await browser.newPage();

const b64 = await page.evaluate(async (uri) => {
  const img = new Image();
  img.src = uri;
  await img.decode();

  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0);

  const d = x.getImageData(0, 0, c.width, c.height);
  const p = d.data;
  // พิกเซลสว่างเกือบขาว -> โปร่งใส  + หาขอบเนื้อจริง
  let minX = c.width, minY = c.height, maxX = -1, maxY = -1;
  for (let i = 0; i < p.length; i += 4) {
    // โปร่งใสอยู่แล้ว = ไม่ใช่เนื้อ ข้ามเลย (เช็ค alpha ก่อน RGB)
    if (p[i+3] < 16) continue;
    // ขาวทึบ -> ทำโปร่งใส แล้วไม่นับเป็นเนื้อ
    if (p[i] > 232 && p[i+1] > 232 && p[i+2] > 232) { p[i+3] = 0; continue; }
    const idx = i / 4, px = idx % c.width, py = (idx / c.width) | 0;
    if (px < minX) minX = px;  if (px > maxX) maxX = px;
    if (py < minY) minY = py;  if (py > maxY) maxY = py;
  }
  x.putImageData(d, 0, 0);

  const w = maxX - minX + 1, h = maxY - minY + 1;
  const o = document.createElement('canvas');
  o.width = w; o.height = h;
  o.getContext('2d').drawImage(c, minX, minY, w, h, 0, 0, w, h);
  return { data: o.toDataURL('image/png').split(',')[1], w, h };
}, uri);

const { writeFileSync } = await import('fs');
writeFileSync(out, Buffer.from(b64.data, 'base64'));
await browser.close();
console.log(`trimmed ${src} -> ${out} @ ${b64.w}x${b64.h} (โปร่งใส)`);
