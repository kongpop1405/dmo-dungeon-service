# DMO Dungeon Service — FB Poster Generator

โปสเตอร์โปรโมตบริการรับเซอร์วิสดันเจี้ยน **Digimon Masters Online** สำหรับโพสต์ Facebook.
สร้างจาก HTML (data-driven) แล้ว export เป็น PNG ความละเอียดสูง.

## โครงสร้าง

```
dmo-dungeon-service/
├── src/
│   ├── poster.html          # โปสเตอร์ (อ่าน data/poster.json, inline CSS)
│   └── data/poster.json     # single source — 6 ดันเจี้ยน + brand/ราคา
├── assets/
│   └── boss/                # รูป boss 6 ตัว (removebg โปร่ง)
├── build/
│   └── export_poster.mjs    # render HTML -> PNG ผ่าน Playwright
├── dist/                    # output แยกตามชนิด
│   ├── cards/<dungeon>/     # การ์ดดันเจี้ยน แยกโฟลเดอร์ต่อดัน — <variant>.png
│   ├── posters/             # โปสเตอร์ (poster-fb · pricelist · unlock-items · master2-stitch)
│   ├── dungeons/            # โปสเตอร์รายดันเจี้ยน — <id>.png
│   └── docs/                # ไฟล์แจก (pptx)
├── assets/shots/            # รูปในการ์ด — <slug>-result|select|digimon.png
├── _src-images/             # รูป boss ต้นฉบับ + ภาพ Canva reference (1-4.png)
│   └── raw/                 # screenshot ดิบก่อนครอป — <slug>-*-raw.png
├── assets/icons/            # ไอคอนช่องทางติดต่อ (discord.png ฯลฯ)
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

# 4. export PNG (ออก dist/posters/poster-fb.png @ 2048px)
npm run export
```

## การ์ดดันเจี้ยนเดี่ยว (card-dungeon)

การ์ด 1 ดันเจี้ยน/1 ใบ (FB 4:5) — **template เดียว ใช้ซ้ำทุกดันเจี้ยน** เลือกด้วย slug.

```
src/card-dungeon.html          # template (ไม่ต้องแก้เวลาเพิ่มดันใหม่)
src/data/cards/<slug>.json     # ข้อมูล 1 ไฟล์ต่อ 1 ใบ
assets/shots/<dungeon>-*.png   # รูปในการ์ด (ใช้ร่วมทุก variant ของดันเดียวกัน)
```

### slug = `<dungeon>` หรือ `<dungeon>-<variant>`

ดันเดียวทำได้หลายใบ (คนละช่องทางติดต่อ) — output แยกโฟลเดอร์ตามดันให้เอง:

| slug | -> output |
|---|---|
| `neverland-discord` | `dist/cards/neverland/discord.png` |
| `neverland-facebook` | `dist/cards/neverland/facebook.png` |
| `master2` | `dist/cards/master2/default.png` |

ชื่อดันเอาจาก **`dungeon.slug` ใน json** ไม่ใช่ split `-` ของชื่อไฟล์ —
ดันที่ชื่อมี `-` เอง (`kaiser-dungeon`) จะได้ `cards/kaiser-dungeon/facebook.png` ถูกต้อง.

### เพิ่มดันเจี้ยนใหม่

```bash
# 1. crop รูป result ให้เหลือแถบสรุปบน (ตัดแผง teamer/EXP ล่างทิ้ง)
#    arg ที่ 3 = สัดส่วนความสูงที่เก็บ (0-1) — ปรับจนไม่ติดแผงล่าง
npm run crop -- <raw>.png assets/shots/<slug>-result.png 0.38

# 2. วางรูปที่เหลือ
#    assets/shots/<slug>-select.png    (บังคับ) หน้าเลือกดัน
#    assets/shots/<slug>-digimon.png   (ไม่บังคับ) แผงสเตตัสดิจิมอน — คอลัมน์ซ้าย

# 3. ก็อป json แล้วแก้ค่า
cp src/data/cards/neverland-discord.json src/data/cards/<slug>.json

# 4. export
node build/export_card.mjs <slug>          # -> dist/cards/<dungeon>/<variant>.png @ 2048px
```

ดูสดที่ `http://localhost:8777/src/card-dungeon.html?d=<slug>` (ต้อง `npm run serve` ก่อน).

### field ใน card json

| field | บังคับ | หมายเหตุ |
|---|---|---|
| `dungeon.title` / `titleTh` | ✅ | ชื่อ EN (ตัวใหญ่กลางการ์ด) / ชื่อไทย |
| `dungeon.tier` | — | ป้ายมุมขวาบน (NORMAL / HARD) |
| `dungeon.tone` | — | สีธีม 4 ค่า (`tone`/`tdim`/`tsoft`/`tacc`) ไม่ใส่ = ฟ้า default |
| `dungeon.grade` | — | แถบใต้ชื่อ — `rank` `time` `party` `wipe` ใส่เท่าที่มี |
| `dungeon.info[]` | — | เงื่อนไขดัน 2 คอลัมน์ — `{ic, k, v}` |
| `dungeon.shots.result` / `select` | ✅ | รูปหาย = export **ตาย exit 1** ไม่ใช่ได้ PNG กรอบว่าง |
| `dungeon.shots.digimon` | — | แผงสเตตัสดิจิมอน ซ้อนในช่องว่างคอลัมน์ซ้าย · ไม่ใส่ = ไม่แสดง |
| `brand.contact.id` | — | ช่องทางติดต่อใต้แผง digimon (เช่น `kong1412`) ไม่ใส่ = ไม่แสดงทั้งบล็อก |
| `brand.contact.icon` | — | ไอคอนคู่กับ id (เช่น `../assets/icons/discord.png`) |

> การ์ดนี้ **ไม่มีบล็อกราคา** โดยตั้งใจ — ราคาอยู่ที่ `poster.html` / `pricelist.html`.

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
