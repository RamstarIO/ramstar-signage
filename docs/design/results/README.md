# Results (`results` slide): design reference

Approved: canvas option "Results B — navy, big total, four category cards". This is a reusable slide for the outcome of a fundraiser, contest or similar: a photo, one big number, and 1–4 categories with a winner and a runner-up. The first use is the Carve 4 Cancer results.
**This is a design reference only.** `results.html` is the layout spec, giving sizes, colours and fit rules. Its query options are `?long=1`, `?three=1` and `?nophoto=1`.

| Image | Shows |
|---|---|
| `results.jpg` | the real Carve 4 Cancer results (the first slide) |
| `results-long.jpg` | fit rules: a 7-figure number, a 3-line winner, a long runner-up (sizes step down) |
| `results-three-no-photo.jpg` | 3 categories (3 columns) and no photo (the headline block moves left) |

No new image files: it reuses `slides/c4c/2026-pumpkins.jpg` and `slides/c4c/wccf-logo.png`, which are already in the repo.

## Data (`slides.json` entry)
```json
{
  "title": "Carve 4 Cancer results",
  "type": "results",
  "tag": "Carve 4 Cancer results",
  "photo": "slides/c4c/2026-pumpkins.jpg",
  "photoCaption": "Our entry · by Vanessa",
  "number": "$15,072",
  "caption": "raised for the Windsor Cancer Centre Foundation",
  "note": "Thank you to everyone who voted and donated!",
  "categories": [
    { "name": "Best Pumpkin · Online vote", "winner": "KPMG", "runnerUp": "Vollmer Group" },
    { "name": "Best Pumpkin · In-person vote", "winner": "Sunsetters Tanning Leamington", "runnerUp": "Vollmer Group" },
    { "name": "Highest Fundraiser", "winner": "CenterLine", "winnerNote": "Over $1,000 in extra donations!", "runnerUp": "Cavalier Tool" },
    { "name": "Judges' Award", "winner": "MTE Controls Corp.", "runnerUp": "“Bank Robber” pumpkin by the Bareich family & friends" }
  ],
  "partners": ["slides/c4c/wccf-logo.png"],
  "until": "2026-11-13",
  "duration": 15
}
```
| Field | Rule |
|---|---|
| `tag` | Optional, default "Results". |
| `photo`, `photoCaption` | Optional. Shown in the tilted white frame. With no photo, the headline block starts at the left margin. A photo that fails to load is left out (`console.warn`); it never skips the slide. |
| `number` | Required. The hero, e.g. `"$15,072"`, `"98%"`, `"1,200+"`. |
| `caption`, `note` | Optional lines under the number. |
| `categories` | Required, 1–4 items (extras ignored with a `console.warn`). `name` and `winner` are required; `winnerNote` and `runnerUp` are optional. |
| `partners` | Optional, 0–2 logos, each on a small white card bottom left. |
| `until` | Optional `YYYY-MM-DD`; `isActive()` hides the slide after it. |
| `duration` | 15 s is suggested: there's a lot to read. |

## Layout (1920×1080, navy `#0E2A56`)
- Star outline top right (`#194B98`, 860 px at right −200 / top −220).
- **Photo frame:** left 100 / top 70, white, padding 16 16 58, radius 6, `rotate(-3deg)`, shadow `0 20px 44px rgba(0,0,0,.35)`. Image 520×390 `object-fit: cover`. Caption: Barlow Condensed 800, 32 px, navy, uppercase, centred in the bottom strip, one line with ellipsis.
- **Headline block:** left 740 (100 with no photo), right 110, top 84, column, gap 18.
  - Tag: the usual orange tag with navy text, 36 px.
  - Number: Barlow Condensed 800, **210 px**, line-height .85, orange `#F7941D`, one line.
  - Caption: Barlow 600, 44 px, white. Note: Barlow 500, 32 px, `#D6DDEA`.
- **Cards:** left/right 100, top 590, one row of equal columns (`repeat(n, 1fr)`), gap 22.
  - Card: `#163A72`, radius 14, padding 22 28 24, column, gap 10.
  - Category: Barlow Condensed 700, 30 px, letter-spacing .06em, uppercase, orange, line-height 1.1 (wraps to 2 lines if needed).
  - Winner: a filled orange star (34 px, the brand star) then the name in Barlow 700, **38 px**, white, line-height 1.15 (wraps).
  - Winner note: Barlow 600, 26 px, orange, indented 46 px to line up with the name.
  - Runner-up: a "RUNNER-UP" label in Barlow Condensed 700, 24 px, uppercase, then the name in Barlow 500, **28 px**, `#AFC0DA`.
- **Footer:** left/right 100, bottom 50. Partner logos on white cards (radius 10, padding 8 14, max 190×84) on the left; **reverse** Ramstar logo, 220 px, no box, on the right.

## Fit rules (measure once after fonts and images load, like the other types)
1. Number: one line. Shrink 210 → 140 px in 10 px steps until it fits the headline column.
2. Cards: the card row must end at least 24 px above the footer. Step winner/runner-up sizes together: 38/28 → 34/26 → 30/24 px. If it still overflows, clamp every runner-up to 2 lines with an ellipsis and log a `console.warn`.

## Motion
- Standard `t-in` entrances: photo frame, tag, number, caption, note, then each card, then the footer. Star last.
- **The number counts up** using the existing `countUp`. It currently only accepts plain digits (with commas), so `"$15,072"` would be skipped. **Extend `countUp`** to keep any non-digit prefix and suffix (`$`, `%`, `+`) fixed while the digits count, without changing how existing slides behave.
- **Mid-slide moment:** the existing `m-beat` bump on each card in turn, using `--i`.
- Transform and opacity only. Reduced motion: static, with the final number shown.
