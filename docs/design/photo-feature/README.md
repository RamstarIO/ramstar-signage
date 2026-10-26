# Photo feature (`photo-feature` slide): design reference

Approved: canvas option "B — full-bleed photo, white panel". This is a reusable slide for a big photo with a thank-you or story: charity events, team photos and similar. The first use is our Carve 4 Cancer entry.
**This is a design reference only.** `photo-feature.html` is the layout spec, giving sizes, colours and fit rules. Its query options are `?long=1` and `?nologo=1`.

| Image | Shows |
|---|---|
| `photo-feature.jpg` | the Carve 4 Cancer entry (the real first slide) |
| `photo-feature-long.jpg` | fit rules: long headline (60 px floor), long body, long label (ellipsis) |
| `photo-feature-no-logos.jpg` | no event logo, no partner logos |
| `photo-feature-qr.jpg` | the current Carve 4 Cancer entry: logos in the top row, QR code in the footer (see `QR.md`) |

The first three images predate the QR change (`QR.md`): they show the event logo alone at the top and the partner logos bottom left. Sizes and positions below are the current ones.

## Files in this package
- `slides/c4c/2026-pumpkins.jpg`: the photo, 1600×1200, about 330 KB. **The Quality Alert sheet on the left of the original photo is blurred out on purpose** (it named customers and an employee). Never replace it with the unblurred original.
- `slides/c4c/carve4cancer-logo.png`, `slides/c4c/wccf-logo.png`: event and foundation logos, cut from the event banner. They're low resolution, so swap in proper files from the foundation if they send them; the file names can stay the same.
- `slides/c4c/vote-qr.svg`: QR code for `https://www.facebook.com/windsorccf` (version 3, error correction M), with its quiet zone.

## Data (`slides.json` entry)
```json
{
  "title": "Carve 4 Cancer - vote for our pumpkin",
  "type": "photo-feature",
  "photo": "slides/c4c/2026-pumpkins.jpg",
  "photoPosition": "30% 50%",
  "label": "Painted by Vanessa. Thank you!",
  "logo": "slides/c4c/carve4cancer-logo.png",
  "headline": "Vote for\n*our pumpkin!*",
  "body": "Voting is open for Best Pumpkin! Vote in person, or online: like our witch in the Carve 4 Cancer gallery post on Facebook. 1 like = 1 vote.",
  "partners": ["slides/c4c/wccf-logo.png"],
  "qr": { "src": "slides/c4c/vote-qr.svg", "caption": "Scan to vote" },
  "until": "2026-10-31",
  "duration": 12
}
```
| Field | Rule |
|---|---|
| `photo` | Required. Loaded with `preload()`; if it fails, the slide is skipped. |
| `photoPosition` | Optional CSS `object-position` (default `"50% 50%"`). Picks the focus point when the photo is cropped to 1180×1080. |
| `label` | Optional. Navy tag on the photo, bottom left. One line, with an ellipsis if too long. |
| `logo` | Optional event logo, first in the top row of the panel, at most 215×165, kept in proportion. |
| `headline` | Required. `\n` = line break, `*…*` = accent. This is the existing `withAccent` convention plus `white-space: pre-line`. The accent is navy text on an orange block. |
| `body` | Optional paragraph. |
| `partners` | Optional, 0–2 logo paths, in the top row beside the event logo, each at most 250×110. |
| `qr` | Optional `{ "src": ..., "caption": ... }`. `src` (required if `qr` is set) is an SVG or PNG QR code that already includes its white quiet zone, shown 290×290 bottom left of the panel. `caption` is an optional one-line label under it. Loaded like the logos: if it fails, the space stays empty and a `console.warn` is logged; the slide still shows. |
| `until` | Optional `YYYY-MM-DD`; `isActive()` hides the slide after it. |

## Layout (1920×1080)
- Grid: photo 1180 px | panel 740 px. Photo is `object-fit: cover` at 1180×1080.
- Label: Barlow Condensed 700, 40 px, letter-spacing .08em, uppercase, navy background, white text, padding 8/28, radius 6, at left 48 / bottom 48, max-width 1084.
- Panel: **white `#FFFFFF`**, so partner logos (usually supplied on white) sit cleanly without boxes. Padding 70 / 90 / 64, column, gap 24.
  - Top row (first item; only if there is an event logo or a partner logo): flex row, `align-items: center`, gap 36, margin-left −8. Event logo width 215, max-height 165, `object-fit: contain`; then the partner logos, each at most 250×110.
  - Headline: Barlow Condensed 800, 104 px, line-height .9, uppercase, navy. Accent block: `#F7941D` with navy text, padding .04em .12em 0, radius 8, margin-top 10, nowrap.
  - Body: Barlow 500, 36 px, line-height 1.3, navy, `text-wrap: balance`.
  - Footer (pushed to the bottom, `align-items: flex-end`): the optional QR block on the left and the **standard Ramstar logo** (`assets/ramstar-logo.png`, 220 px wide, no box) on the right, since this is a white panel.
  - QR block: column, centred, gap 2. Code 290×290 (not smaller: 300 didn't fit the Carve 4 Cancer content, 290 does). Caption Barlow Condensed 700, 32 px, letter-spacing .06em, uppercase, navy, line-height 1, one line. No card or shadow: the code's own quiet zone separates it.
- Never orange text on the white panel; orange only appears as the accent block.

## Fit rules (measure once after fonts and images load)
1. Headline: every line, including the accent block, fits the 560 px content width. Shrink from 104 px in 4 px steps to 60 px. If it is still too wide at 60, let the accent wrap.
2. Body: 36 → 32 → 30 px until the footer ends inside the bottom padding. If it still overflows, drop the whole top row (event and partner logos) and log a `console.warn`.

## Motion
- Photo: fades in first. Then a **slow push-in** for the whole slide duration: `transform: scale(1) → scale(1.05)`, linear, `transform-origin` matching `photoPosition`. GPU-only. The image is ~1600 px, so this is light even on the Fire Stick.
- Panel: standard `t-in` entrances in order: top row, headline, body, footer. The QR code rises in with the footer and then **stays perfectly still** (no sheen, bump or zoom), because movement makes phones fail to focus. Label on the photo rises with the panel's first item.
- **Mid-slide moment:** the existing **sheen** on the accent block text, using `makeHero` / `t-hero` on the accent span, as spotlight and birthdays do.
- Reduced motion: no push-in and no sheen; everything static.

## Privacy (public site)
- Check that people named or shown are OK with it (Vanessa is named here).
- Look over every photo for paperwork, screens or whiteboards before committing. Git history keeps old files even after you delete them.
