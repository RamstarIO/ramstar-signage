# Guess the baby (`photo-game` slide): design reference

Approved: option A (tilted photo frame on navy) plus the reveal state.
This is a **design reference only**. `baby-game.html` is the layout spec, giving sizes, colours and fit rules. Open it with `?reveal=1`, `?long=1` or `?photo=sample-photo.jpg`.

| PNG | Shows |
|---|---|
| `baby-game.png` | game state with a (synthetic) photo |
| `baby-game-long-rules.png` | fit rule: rules shrunk to the 34 px minimum, still-too-long rules end in "…" |
| `baby-reveal.png` | reveal state |

`sample-photo.jpg` is a generated test image (not a real person), used only by the design reference. Don't copy it into `slides/`.

## Data (`slides.json` entry)
```json
{
  "type": "photo-game",
  "title": "Guess the Baby",
  "photo": "slides/baby/2026-10.jpg",
  "rules": [
    "One guess per person",
    "Write your name and guess on a slip",
    "Drop it in the box at the front desk",
    "No hints from the baby in question",
    "First correct slip drawn wins a prize"
  ],
  "closes": "Guesses close Fri, Oct 16 · 12:00 PM",
  "reveal": false,
  "answer": "",
  "winner": ""
}
```
| Field | Rule |
|---|---|
| `title` | Rendered uppercase; the **last word** goes on its own line in orange ("GUESS THE / **BABY**"). |
| `photo` | Required. Loaded with the existing `preload()` before the slide shows; if it fails, skip the slide like any other load error. Frame is portrait 620×700, `object-fit: cover`, `object-position: center 30%` (faces sit high in most photos). |
| `rules` | 1–5 strings, numbered automatically. Extra rules beyond 5 are ignored (console warning). |
| `closes` | Optional footer line (free text). Omit and the footer shows only the logo. |
| `reveal` | `false` shows the game, and `true` shows the reveal. Flip it by hand when guessing is over. |
| `answer` | Shown on the reveal. **Leave it empty until reveal day** (see Privacy). If `reveal` is true but `answer` is empty, show the game state and log a warning. |
| `winner` | Optional, reveal only. Shown as "Winner: …"; line omitted when empty. |

## Layout (1920×1080, navy `#0E2A56`)
**Game state**
- Photo frame: white, padding 28 / 28 / 96, radius 6, `rotate(-4deg)`, shadow `0 24px 50px rgba(0,0,0,.35)`, at left 150 / top 110. Caption "WHO IS IT?" in the bottom strip (Barlow Condensed 800, 54 px, navy).
- Right column (left 960, right 110, top 90, bottom 80, gap 28): orange tag "GAME TIME" (same style as other tags) · title (Barlow Condensed 800, 130 px, line-height .88) · rules · spacer · footer.
- Rule: 64 px orange circle with navy number (Barlow Condensed 800, 42 px), gap 30, text Barlow 600 at 42 px, white, **one line**. Rules gap 16.
- Footer: `closes` (Barlow Condensed 700, 38 px, `#AFC0DA`, uppercase, one line), reverse logo 220 px on the right.
- Star outline top-right (`#194B98`, 900 px at right −220 / top −200).

**Reveal state**
- The same photo frame and position (so the swap from game to reveal feels like the same slide).
- Column centred vertically: "THE BABY WAS…" (Barlow Condensed 700, 48 px, letter-spacing .24em, orange) · answer (Barlow Condensed 800, 170 px, white, uppercase, one line) · orange bar 220×12 · "Winner: …" (Barlow 600, 50 px, `#D6DDEA`).
- Reverse logo 260 px bottom-right; star outline bottom-left instead of top-right.

**Fit rules** (measure once after fonts load, same approach as the value and welcome slides)
- Rules: shrink **all rules together** from 42 px in 2 px steps down to 34 px until the widest fits; anything still too long gets an ellipsis.
- Answer: shrink from 170 px in 4 px steps to 100 px until it fits the column.

## Motion
- Entrances: standard sequencer (`t-in`). Order: photo frame (rise and settle into its −4° tilt), tag, title, each rule, footer, star last.
- **Mid-slide moment (game):** the existing `m-beat` bump on each rule in turn, using `--i` (same as birthdays and values).
- **Mid-slide moment (reveal):** a single bump on the answer name.
- GPU-only (transform and opacity). Reduced motion: static.

## Photos: `scripts/resize_photo.py`
```
python3 -m pip install Pillow          # once
python3 scripts/resize_photo.py ~/Documents/ramstar-private/baby/jane.jpg slides/baby/2026-10.jpg
```
The script resizes to 1200 px on the long side as a progressive JPEG (quality 82). It applies the phone's rotation and **strips all metadata (including GPS)**. Keep the originals outside the repo. Name the files by date (`2026-10.jpg`), **not by the person**, or the filename gives the answer away.

## Privacy
Phase 1 is a public site, so anyone can read `slides.json` and browse `slides/baby/`:
- Get each person's OK before using their photo.
- Keep `answer` empty in `slides.json` until reveal day. Set `"reveal": true` and fill `answer` in the same commit.
- Git history keeps old photos after you delete them. Only commit photos the person is happy to have public.
