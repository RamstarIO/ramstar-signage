# Team shout-out (`shoutout` slide): design reference

Approved: canvas option "B on orange". This is a reusable slide type for any team achievement, with an optional streak.
**Design reference only.** `shoutout.html` is the layout spec, giving sizes, colours and fit rules. Its query options are `?theme=navy`, `?done=6`, `?nonext=1` and `?long=1`.

| PNG | Shows |
|---|---|
| `shoutout-orange.png` | the default look (orange theme), MFG on-time delivery, 2 weeks + "keep it going" |
| `shoutout-navy.png` | `"theme": "navy"` |
| `shoutout-week4.png` | 4 weeks done: the most individual chips (4 + next) |
| `shoutout-long-streak.png` | 5+ weeks collapse into one chip; long team name and achievement (fit rules) |

## Data (`slides.json` entry)
```json
{
  "title": "MFG on-time shout-out",
  "type": "shoutout",
  "theme": "orange",
  "tag": "Team shout-out",
  "team": "MFG Team",
  "cheer": "Way to go!",
  "achievement": "Our Manufacturing Team hit its *on-time delivery targets* two weeks in a row!",
  "streak": { "done": 2, "unit": "Week", "next": "keep it going" },
  "message": "Your hard work, teamwork, and commitment are paying off. This is terrific progress, and we're proud to see the team moving in the right direction!",
  "until": "2026-10-30"
}
```
| Field | Rule |
|---|---|
| `theme` | `"orange"` (default) or `"navy"`. |
| `tag` | Optional, default "Team shout-out". |
| `team` | Required. Headline line 1, shown as "`team` —". |
| `cheer` | Optional, default "Way to go!". Headline line 2: on orange it is white on a navy block; on navy it is orange text. |
| `achievement` | Required. Wrap one phrase in `*…*` for the accent, using the same convention as `withAccent()`. On orange the accent is bold and underlined; on navy it is orange. Hyphens inside the accent become non-breaking and the phrase never wraps. |
| `streak` | Optional. `done` (whole number ≥ 1), `unit` (default "Week"), `next` (optional; "" or missing hides the dashed chip). |
| `message` | Optional. The supporting paragraph at the bottom left. |
| `until` | Optional `YYYY-MM-DD`. Use `isActive()` so the slide stops showing after this date. Shout-outs go stale. |

**Streak chips:** for `done` 1–4, one ✓ chip per period ("Week 1" … "Week 4"). From 5 on, the completed periods collapse into a single chip, "✓ 6 Weeks in a row". If `next` is set, a dashed chip "Week {done+1} · {next}" follows. **Updating the streak is a one-number change:** set `done` to 3 next week.

## Layout (1920×1080)
- Frame: padding 84 / 120, column, gap 28. Star outline top-right (900 px, right −220 / top −200): `#FFAE4A` on orange, `#194B98` on navy.
- Tag: the usual tag. On orange it is navy with white text; on navy it is orange with navy text.
- Headline: Barlow Condensed 800, 150 px, line-height 0.9, uppercase. Both lines stay on one line each (fit rule 1). Cheer block on orange: navy `#0E2A56`, padding .06em .14em .02em, radius 10, margin-top 14.
- Achievement: Barlow 600, 54 px, line-height 1.2, max-width 1500, `text-wrap: balance`. On orange the accent is 800 weight with a 6 px underline, offset 10, `text-decoration-skip-ink: none`.
- Chips: gap 24, Barlow Condensed 800, 50 px, uppercase, radius 12, one line.
  - Done chip: orange theme navy background with white text and an orange ✓; navy theme orange background with navy text and a navy ✓. Padding 16 30 16 22, ✓ 44 px (stroke 3.2, round).
  - Next chip: 4 px dashed border, padding 12 28. Orange theme: navy border and text on `rgba(255,255,255,.22)`. Navy theme: `#5E7AA8` border, `#AFC0DA` text, weight 700.
- Footer (pushed to the bottom): message (Barlow 500, 40 px, line-height 1.3, max-width 1240, balanced; navy on orange, `#D6DDEA` on navy). Reverse logo on the right: on orange, 260 px inside a navy plate (padding 22/34, radius 14); on navy, 280 px with no plate.
- **No orange text on the orange theme, and no white text directly on orange.** Emphasis comes from navy blocks, weight and the underline.

## Fit rules (measure once after fonts load, like the value and photo-game slides)
1. Headline: shrink both lines together from 150 px in 4 px steps to 110 px until neither is wider than 1680 px.
2. Achievement: at most 2 lines, stepping 54 → 50 → 46 px.
3. Message: at most 3 lines, stepping 40 → 36 → 34 px.
4. If content still reaches into the bottom padding, drop the message rather than overlap, and log a `console.warn`.

## Motion
- Standard `t-in` entrances in order: tag, headline, achievement, streak row, message, logo; star last.
- On the orange theme the cheer block can rise as one piece with its line.
- **Mid-slide moment:** the existing **`m-beat` bump on each chip in turn**, using `--i`. This is the same beat as birthdays, values and photo-game. Include the dashed "next" chip as the last beat.
- Transform and opacity only. Reduced motion: static.
