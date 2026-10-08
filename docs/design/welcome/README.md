# Welcome screen ("welcome mode"): design reference

Approved: option A, centred on navy. **Design reference only**: `welcome.html` is the layout spec (sizes, colours, fit rule).
PNGs: `welcome-guest` (normal), `welcome-long-name` (fit rule in action), `welcome-generic` (no guest given).

## What it is
A mode, not a slide in the playlist. While welcome mode is on, **every TV shows only the welcome screen**.
When it turns off, the TVs fade back to the normal playlist, starting from the first slide.

## Control file: `welcome.json` (separate from slides.json)
```json
{ "on": false,
  "guest": "Acme Fabrication",
  "people": "Jane Doe & Sam Patel",
  "from": "2026-10-09T09:00",
  "until": "2026-10-09T15:00" }
```
- Welcome mode is active when `on` is true **and** (if given) the TV's local time is between `from` and `until`.
  `from` / `until` are local times (`YYYY-MM-DDTHH:MM`), optional, so visits can be scheduled ahead.
- `guest` empty or missing → generic headline **"Our Guests"**. `people` empty or missing → that line is omitted.
- Missing file, invalid JSON or a network error → **keep the current state** (never drop out of a visit or into one by accident).
- The player re-reads `welcome.json` every **30 s** (cache-busted), independent of the 5-minute playlist refresh, so a change shows up within ~1–2 min of merging (GitHub Pages publish time + one poll).

## Layout (1920×1080, navy `#0E2A56`)
- Centred column: "WELCOME" (Barlow Condensed 700, 44 px, letter-spacing .3em, orange) · guest name (Barlow Condensed 800, 200 px, white, uppercase, **one line**) · orange rule 220×12 · people (Barlow 500, 54 px, `#D6DDEA`) · "We're glad you're here." (44 px, `#AFC0DA`).
- Ramstar **reverse logo** (`assets/ramstar-logo-reverse.png`, no box), 420 px wide, centred near the bottom.
- Two star outlines (top right `#194B98`, bottom left `#163A72`) as on the other templates.
- **Fit rule:** guest name never wraps; shrink from 200 px in 4 px steps until it fits 1600 px (minimum 110 px). Measure once when built.

## Motion
- Enter with the player's crossfade, then the parts rise in one after another (`t-in` sequencer), star last.
- It may stay up for hours: keep the star's slow drift running (loop it rather than stopping at the end), no progress bar, no mid-slide moment. GPU-only (transform/opacity).
- Leaving welcome mode: crossfade to the first playlist slide.
- Reduced motion: static.

## Privacy
Phase 1 is a public site: `welcome.json` (and its git history) shows who is visiting and when. Prefer a generic welcome
(`"guest": ""`) until hosting is private, or clear the guest details right after each visit.
