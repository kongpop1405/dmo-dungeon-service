# DMO Poster Studio — FB Poster Generator

โปสเตอร์โปรโมตบริการรับเซอร์วิสดันเจี้ยน **Digimon Masters Online** สำหรับโพสต์ Facebook.
สร้างจาก HTML (data-driven) แล้ว export เป็น PNG ความละเอียดสูง.

## โครงสร้าง

```
dmo-poster-studio/
├── src/
│   ├── poster.html          # โปสเตอร์ (อ่าน data/poster.json, inline CSS)
│   └── data/poster.json     # single source — 6 ดันเจี้ยน + brand/ราคา
├── assets/
│   └── boss/                # รูป boss 6 ตัว (removebg โปร่ง)
├── build/
│   └── export_poster.mjs    # render HTML -> PNG ผ่าน Playwright
├── dist/                    # output (dmo-poster-fb.png ฯลฯ)
├── _src-images/             # รูป boss ต้นฉบับ + ภาพ Canva reference (1-4.png)
├── docs/plans/              # HTML plan specs
├── package.json
└── .gitignore
```

## ใช้งาน

```bash
# 1. ติดตั้ง dep (ครั้งแรก)
npm install

# 2. start static server (terminal แยก)
npm run serve            # python -m http.server 8777

# 3. แก้ข้อมูล/ดีไซน์
#    - ราคา/ชื่อ/boss     -> src/data/poster.json
#    - layout/สี/ขนาด     -> src/poster.html
#    ดูสดที่ http://localhost:8777/src/poster.html

# 4. export PNG (ออก dist/dmo-poster-fb.png @ 2048px)
npm run export
```

## field-map — poster.json key → ใช้ในไฟล์ไหน

| JSON key | ใช้ใน | หมายเหตุ |
|---|---|---|
| `brand` | `poster.html`, `dungeon.html`, `pricelist.html` | subhead/status/tagline/contactNote — ชื่อ+ติดต่อ+โปรโมชันของร้าน |
| `unlockItems` | `items.html` | แต่ละ item มี `image` (boss ตัวใหญ่) + `tooltip` (รูป info ในเกม, path `../assets/tooltips/`) |
| `dungeons` | `poster.html` (overview การ์ดรวม), `dungeon.html` (โปสเตอร์เดี่ยวต่อดัน ผ่าน `?id=<id>`), `pricelist.html` (ตารางราคารวม) | `theme` = key จับคู่สี CSS var ใน `.poster[data-t="..."]`, `image` = path `../assets/boss/` |
| `trate.html` | — ไม่อ่าน `poster.json` | เครื่องมือคำนวณเรทแยก ไม่ใช่ poster template — ไม่มี `export_trate.mjs` คู่กัน (by design) |

`src/theme.css` = reset + palette กลางของ 4 poster template (poster/dungeon/pricelist/items) — layout เฉพาะ (gradient/frame-c/padding) ยังอยู่ inline ในแต่ละไฟล์เพราะต่างกันจริงต่อ template

## หมายเหตุ

- **poster.json = single source.** แก้ที่เดียว reflect ทั้งโปสเตอร์.
- **boss image** ใน json ใช้ path `../assets/boss/<name>.png` (relative จาก src/).
- **export 2048px พอดี** — FB ชอบกว้าง 2048 (ใหญ่/เล็กกว่าโดน FB resize -> แตก).
- **FB บีบอัด JPEG** ทุกรูปที่อัป หนีไม่พ้น. ลดแตก: พื้น flat (ไม่ใส่ noise/dither),
  glow น้อย, ตัวอักษรมี dark shadow. อยากคมเต็ม -> อัปไฟล์ขึ้น postimages/Drive
  แล้วแปะลิงก์ใน **คอมเมนต์** (ไม่ใช่แปะลิงก์ในโพสต์ — FB ทำ link-card บีบหนักสุด).

## ชื่อดันเจี้ยน (อ้างอิงทางการ)

| # | EN | TH (vplay.in.th) | Boss |
|---|----|----|----|
| 1 | Kaiser's Lab | ฐานทัพของไกเซอร์ | Kimeramon |
| 2 | Dark Web | ดาร์กเว็บ | Armageddemon |
| 3 | Digimon Kaiser | ดิจิมอนไกเซอร์ | BlackMetalGreymon |
| 4 | Destruction & Revival | การทำลายล้างและการฟื้นฟู | Susanoomon |
| 5 | Royal Base | รอยัลเบส (ระดับยาก) | Death-X-mon |
| 6 | Marketplace | แหล่งร้านค้า | GulusGammamon |

> ข้อมูลเกมเพื่อการศึกษา/อ้างอิงเท่านั้น
