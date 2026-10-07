# Logo slide: "It's a great day at… RAMSTAR"

Approved replacement for the `logo` slide type. **All four intros go into rotation**, and the old intros
(`rise`, `wipe`, `words`, `assemble`, `glint`) and the slogan line are **removed**.
**Design reference**: `prototype.html` is the exact spec (open it via the local server as `prototype.html?v=A`
… `?v=D`); the PNGs are each version's final frame at 1920×1080.

## The sentence
The words "It's a great day at" arrive **one at a time**; the logo completes the sentence. There is no slogan
under the logo any more. "GREAT" is accented in every version:
- on navy (A, C, D): orange text
- on warm white (B): navy text on an orange block (orange text on a light background fails contrast)

Make the sentence and the accented word data, with these defaults:
`"lead": "It's a great day at"`, `"accent": "great"`.

## Timing (all versions), slide duration 10 s
1. Slide fades in (the player's normal crossfade).
2. **1.2 s pause** on the empty background before the first word.
3. Words arrive ~0.6 s apart (C: 0.7 s), logo arrives ~4.5–5 s after the pause starts.
4. Everything has landed by ~6.5 s; it holds.
5. Slide **fades out** cleanly: no `part-out` slip-up exit on this slide type.
6. Progress bar stays hidden on logo slides (as now).

## The four intros (`intro` values)
| `intro` | Background | Logo file | What happens |
|---|---|---|---|
| `answer` (A) | navy | `ramstar-logo-reverse.png` | Words rise in, centred, 150 px; the line lifts up; the logo pops in below (no box), then a short orange rule grows under it |
| `sweep` (B) | warm white `#F4F2EE` | `ramstar-logo.png` | Words build top-left, 132 px; the logo sweeps in from the left almost full width (moving window + counter-moving image, like the sheen); orange rule grows |
| `drumroll` (C) | navy | `ramstar-logo-reverse.png` | Each word flashes huge (380 px) centre stage while the sentence builds small at the top; the logo slams in (scale 1.35 → 0.97 → 1) with an orange ring bursting behind it |
| `curtain` (D) | navy, then white panel | `ramstar-logo.png` | Words rise in big (200 px); a white panel sweeps up from the bottom as the line lifts out of its way; the logo rises in on the white |

Exact sizes, positions, easings and delays: see the CSS in `prototype.html` (delays there include the 1.2 s pause).

## Logos
- `assets/ramstar-logo.png`: original colours, 1600 px wide, transparent. For light backgrounds.
- `assets/ramstar-logo-reverse.png`: same logo with the blue outline and star in **white**, for navy backgrounds.
  Brand rule change: on navy, use the reverse logo with no white box; on light backgrounds, the original.

## Rules
- Fire Stick: animate only `transform` and `opacity` (the prototype already does). Preload both logo images in `load()`.
- `prefers-reduced-motion`: show the final frame (sentence + logo), no word-by-word or slam.
- slides.json:
  `{ "title": "Logo", "type": "logo", "intro": ["answer", "sweep", "drumroll", "curtain"], "duration": 10 }`
  The intro list keeps cycling one per showing, as now.
