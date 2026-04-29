# DMO Kaiser's Lab — Design System

## Overview

**Brand:** DMO Dungeon Service – Kaiser's Laboratory  
**Thai:** บริการรับแบกดันเจี้ยนเกม Digimon Masters Online  
**Product type:** Gaming service brand / promotional material for a Digimon Masters Online (DMO) dungeon carry service  
**Theme:** Kaiser's Laboratory (พื้นที่ของไกเซอร์) — the dungeon of Ken Ichijouji (Digimon Emperor)

### Source Materials
- `assets/kaiser_anime.webp` — Ken Ichijouji (Digimon Emperor) anime screenshot (blue/yellow outfit, pink bg)
- `assets/kaiser_dark.jpg` — Ken/Kaiser dark digital art with Wormmon, neon blue outlines on black — primary key art
- `assets/kimeramon.webp` — Kimeramon full body on white, the dungeon boss creature

---

## CONTENT FUNDAMENTALS

### Language
- **Primary language:** Thai (ภาษาไทย) with English game terminology mixed in
- **Tone:** Confident, punchy, slightly hyped — like a pro gamer/service vendor
- **Casing:** Title case for service names; all-caps for emphasis labels ("BEST VALUE!", "PRO")
- **Emoji:** Minimal; used for emphasis in social copy (✅ ⚡ 🔥) but NOT in formal poster layouts
- **Copy style:** Short, direct, benefit-first. "บริการรวดเร็ว ปลอดภัย ได้ของครบแน่นอน" — fast, safe, guaranteed loot
- **I vs You:** Second-person / service-focused ("สนใจ" = "if interested") — approachable CTA
- **Numbers:** Thai baht (บาท), item counts in numerals + ชิ้น (pieces), rounds in numerals + รอบ
- **English terms kept as-is:** Kaiser's Laboratory, DMO, Starter / Pro / Ultimate, Single Run, Inbox

### Sample Headlines
- รับแบกดันเจี้ยน: พื้นที่ของไกเซอร์
- บริการรวดเร็ว ปลอดภัย ได้ของครบแน่นอน
- สนใจติดต่อสอบถามเพิ่มเติม คอมเม้นหรือ inbox ได้เลย

---

## VISUAL FOUNDATIONS

### Color System
| Role | Value | Notes |
|------|-------|-------|
| Background | `#000000` / `#050A05` | Pure/near-black |
| Surface | `#0D1A0D` | Dark green-tinted panel |
| Surface 2 | `#0A1A0A` | Slightly lighter panel |
| Neon Green Primary | `#00FF41` | Primary neon — HUD/highlights |
| Neon Green Dim | `#00C832` | Secondary neon — body text accents |
| Neon Cyan | `#00FFEE` | Tech accent, glows |
| Gold | `#FFD700` | Kaiser outfit color; "Best Value" badge |
| Text Primary | `#E8FFE8` | Off-white with green tint |
| Text Secondary | `#7FBF7F` | Dimmed green text |
| Danger/Alert | `#FF3A3A` | Warnings, rare item labels |
| Border Neon | `#00FF41` at 40% opacity | Card borders |

### Typography
- **Display / Title:** Orbitron (Google Fonts) — sci-fi, tech, all-caps gaming feel
- **Sub-headings / UI:** Share Tech Mono — monospace terminal aesthetic
- **Body / Thai text:** Kanit (Google Fonts) — clean Thai typeface with modern weight range
- **Fallbacks:** `'Courier New', monospace` for terminal; `sans-serif` for Thai

### Backgrounds
- **Deep black** base always — never white or light backgrounds
- **Scanline / grid overlays** at very low opacity (3–6%) — adds digital/tech texture
- **Radial green glow** from center or character focal point — `radial-gradient(ellipse, #003300 0%, #000 60%)`
- **Neon border lines** — 1–2px solid or glowing borders on cards
- **Character art** as large key visual, semi-transparent or with dark overlay blend

### Animation
- **Flicker effect** on neon text (subtle keyframe opacity oscillation ~5%)
- **Scan line** sweep animation on hover over cards
- **Glow pulse** on CTA buttons — box-shadow keyframe
- **Entrance:** fast fade-up (300ms ease-out); no bounces
- **Easing:** `ease-out` preferred; `cubic-bezier(0.25, 0.46, 0.45, 0.94)`

### Cards
- **Background:** `#0D1A0D` or `rgba(0,255,65,0.05)`
- **Border:** `1px solid rgba(0,255,65,0.4)` with `box-shadow: 0 0 12px rgba(0,255,65,0.15)`
- **Corner radius:** `4px` — sharp, tech; avoid pill/soft corners
- **Hover:** increase glow intensity + border opacity; slight scale `1.02`
- **Best Value / featured:** gold border `#FFD700`, gold glow

### Shadows & Glow
- **Text glow:** `text-shadow: 0 0 8px #00FF41, 0 0 20px #00FF41`
- **Box glow:** `box-shadow: 0 0 16px rgba(0,255,65,0.3), inset 0 0 8px rgba(0,255,65,0.05)`
- **Gold glow:** `box-shadow: 0 0 16px rgba(255,215,0,0.4)`

### Spacing
- Base unit: `8px`
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96px
- Sections: `48px` vertical padding minimum
- Card padding: `24px`

### Corner Radii
- Cards / panels: `4px`
- Badges / pills: `2px` (sharp)
- Buttons: `4px`
- Never > `8px` in this system

### Imagery
- **Color vibe:** Cool, dark, high-contrast; character art has neon blue/green rim lighting
- **Treatment:** Characters shown at large scale; Kimeramon as a threat/boss visual
- **Blend:** `mix-blend-mode: screen` or `luminosity` to integrate art on dark backgrounds

### Iconography
See ICONOGRAPHY section below.

---

## ICONOGRAPHY

- **No dedicated icon font** — this is a poster/service brand, not an app UI
- **Icons used:** minimal — checkmarks ✓, bullet diamonds ◆, separator lines
- **Style:** Drawn with CSS or Unicode — angular, tech-military aesthetic
- **No rounded icon sets** (Lucide etc.) — doesn't match the aesthetic
- **Decorative glyphs:** `◆` `►` `▸` `//` `[ ]` for tech/HUD aesthetic
- **Logo:** No formal logo exists; the brand is expressed via typography + character art

---

## File Index

```
README.md                    ← This file
SKILL.md                     ← Agent skill definition
colors_and_type.css          ← CSS design tokens (colors + typography)
assets/
  kaiser_anime.webp          ← Ken Ichijouji anime screenshot
  kaiser_dark.jpg            ← Kaiser dark digital art (primary key art)
  kimeramon.webp             ← Kimeramon boss art (transparent bg)
preview/
  colors_base.html           ← Base color swatches
  colors_semantic.html       ← Semantic color roles
  type_display.html          ← Display/title typography
  type_body.html             ← Body/UI typography
  spacing.html               ← Spacing + radius tokens
  shadows.html               ← Shadow/glow system
  cards.html                 ← Card component variants
  buttons.html               ← Button states
  badges.html                ← Tier badges (Starter/Pro/Ultimate)
  price_card.html            ← Price card component
ui_kits/
  poster/
    index.html               ← Full service poster (main deliverable)
```
