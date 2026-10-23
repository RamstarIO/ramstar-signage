# Photo feature (`photo-feature` slide): design reference

Approved: canvas option "B — full-bleed photo, white panel". This is a reusable slide for a big photo with a thank-you or story: charity events, team photos and similar. The first use is our Carve 4 Cancer entry.
**This is a design reference only.** `photo-feature.html` is the layout spec, giving sizes, colours and fit rules. Its query options are `?long=1` and `?nologo=1`.

| Image | Shows |
|---|---|
| `photo-feature.jpg` | the Carve 4 Cancer entry (the real first slide) |
| `photo-feature-long.jpg` | fit rules: long headline (60 px floor), long body, long label (ellipsis) |
| `photo-feature-no-logos.jpg` | no event logo, no partner logos |

## Files in this package
- `slides/c4c/2026-pumpkins.jpg`: the photo, 1600×1200, about 330 KB. **The Quality Alert sheet on the left of the original photo is blurred out on purpose** (it named customers and an employee). Never replace it with the unblurred original.
- `slides/c4c/carve4cancer-logo.png`, `slides/c4c/wccf-logo.png`: event and foundation logos, cut from the event banner. They're low resolution, so swap in proper files from the foundation if they send them; the file names can stay the same.

## Data (`slides.json` entry)
```json
{
  "title": "Carve 4 Cancer - thank you Vanessa",
  "type": "photo-feature",
  "photo": "slides/c4c/2026-pumpkins.jpg",
  "photoPosition": "30% 50%",
  "label": "Our Carve 4 Cancer entry",
  "logo": "slides/c4c/carve4cancer-logo.png",
  "headline": "Thank you,\n*Vanessa!*",
  "body": "Vanessa painted our witch and her bubbling cauldron for the Windsor Cancer Centre Foundation's Carve 4 Cancer fundraiser.",
  "partners": ["slides/c4c/wccf-logo.png"],
  "until": "2026-10-31",
  "duration": 12
}
```
| Field | Rule |
|---|---|
| `photo` | Required. Loaded with `preload()`; if it fails, the slide is skipped. |
| `photoPosition` | Optional CSS `object-position` (default `"50% 50%"`). Picks the focus point when the photo is cropped to 1180×1080. |
| `label` | Optional. Navy tag on the photo, bottom left. One line, with an ellipsis if too long. |
| `logo` | Optional event logo at the top of the panel, at most 290×220, kept in proportion. |
| `headline` | Required. `\n` = line break, `*…*` = accent. This is the existing `withAccent` convention plus `white-space: pre-line`. The accent is navy text on an orange block. |
| `body` | Optional paragraph. |
| `partners` | Optional, 0–2 logo paths, bottom left of the panel, each at most 250×100. |
| `until` | Optional `YYYY-MM-DD`; `isActive()` hides the slide after it. |

## Layout (1920×1080)
- Grid: photo 1180 px | panel 740 px. Photo is `object-fit: cover` at 1180×1080.
- Label: Barlow Condensed 700, 40 px, letter-spacing .08em, uppercase, navy background, white text, padding 8/28, radius 6, at left 48 / bottom 48, max-width 1084.
- Panel: **white `#FFFFFF`**, so partner logos (usually supplied on white) sit cleanly without boxes. Padding 70 / 90 / 64, column, gap 24.
  - Event logo: width 290, max-height 220, `object-fit: contain`, margin-left −8.
  - Headline: Barlow Condensed 800, 104 px, line-height .9, uppercase, navy. Accent block: `#F7941D` with navy text, padding .04em .12em 0, radius 8, margin-top 10, nowrap.
  - Body: Barlow 500, 36 px, line-height 1.3, navy, `text-wrap: balance`.
  - Footer (pushed to the bottom): partners on the left (gap 24) and the **standard Ramstar logo** (`assets/ramstar-logo.png`, 220 px wide, no box) on the right, since this is a white panel.
- Never orange text on the white panel; orange only appears as the accent block.

## Fit rules (measure once after fonts and images load)
1. Headline: every line, including the accent block, fits the 560 px content width. Shrink from 104 px in 4 px steps to 60 px. If it is still too wide at 60, let the accent wrap.
2. Body: 36 → 32 → 30 px until the footer ends inside the bottom padding. If it still overflows, drop the event logo and log a `console.warn`.

## Motion
- Photo: fades in first. Then a **slow push-in** for the whole slide duration: `transform: scale(1) → scale(1.05)`, linear, `transform-origin` matching `photoPosition`. GPU-only. The image is ~1600 px, so this is light even on the Fire Stick.
- Panel: standard `t-in` entrances in order: event logo, headline, body, footer. Label on the photo rises with the panel's first item.
- **Mid-slide moment:** the existing **sheen** on the accent block text, using `makeHero` / `t-hero` on the accent span, as spotlight and birthdays do.
- Reduced motion: no push-in and no sheen; everything static.

## Privacy (public site)
- Check that people named or shown are OK with it (Vanessa is named here).
- Look over every photo for paperwork, screens or whiteboards before committing. Git history keeps old files even after you delete them.
