# Takeover slides + Remembrance Day: design reference

**Needed live before 10:59 on Wed Nov 11, 2026.**

A new optional slide field, `takeover`, makes one slide the *only* thing on every TV for a set window. The first use is the two minutes of silence at 11:00 on Remembrance Day.

| File | What it is |
|---|---|
| `takeover-reference.diff` | **A working patch against the current `index.html`.** It was tested in Chromium with a 1-minute window: the slide stayed out of the rotation, took over within 5 s of `from`, held with no progress bar, and handed back to the playlist at `until`. There were no console errors. Apply it as is, or match it closely. |
| `rem-day.jpg` | The day slide, which plays in the normal rotation all day on Nov 11 |
| `rem-silence.jpg` | The takeover slide, held from 10:59 to 11:03 |
| `../../../slides/remembrance/remembrance-bg.png` | The background: flat navy `#0E2A56` with a large poppy (670 px) on the right, **no star and no Ramstar logo** (the poppy replaces them on purpose) |

## Data
```json
"takeover": { "from": "2026-11-11T10:59", "until": "2026-11-11T11:03" }
```
- `from` and `until` use local TV time in the same format as `welcome.json` (both are parsed with `parseLocal`). Both are required, and `until` must be after `from`. If either is bad, the slide is ignored and a `console.warn` is logged.
- A slide that has `takeover` **never plays in the normal rotation** (`isActive` returns false), so it doesn't need `start`/`end`.
- `"enabled": false` turns it off.

## Behaviour
- **The TV's clock is checked every 5 s** (`setInterval(applyTakeover, 5000)`), with no fetch, so the takeover starts on time even with a 5-minute `slides.json` refresh.
- During the window, the current slide is interrupted (`clearTimeout(timer)`) and the takeover slide crossfades in using the normal `show()` path. It is **held** for the rest of the window: no advancing, `progress: false`, and `effect` defaults to `"none"`.
- **Priority: takeover > welcome > playlist.** `applyWelcome()` does nothing during a takeover. When the takeover ends, welcome mode re-checks itself; if no visit is active, the playlist restarts from the first slide.
- **Load failure:** if the image can't be loaded, a warning is logged and the playlist keeps playing. The takeover is retried on the next 5-second check.
- **Reloads are deferred.** The code-version reload and the 6-hour hard reload both go through `reloadWhenFree()`, which waits until no takeover is running. This means a deploy can never blank a screen during the silence.
- `refreshConfig()` calls `applyTakeover()`, so a takeover that is added or edited is picked up on the next refresh.

## slides.json entries
```json
{
  "title": "Remembrance Day",
  "src": "slides/remembrance/remembrance-bg.png",
  "start": "2026-11-11",
  "end": "2026-11-11",
  "overlay": { "tag": "Remembrance Day", "title": "Lest we forget", "body": "Moment of silence at 11:00 AM" },
  "duration": 12
},
{
  "title": "Remembrance Day - silence",
  "src": "slides/remembrance/remembrance-bg.png",
  "takeover": { "from": "2026-11-11T10:59", "until": "2026-11-11T11:03" },
  "progress": false,
  "overlay": { "tag": "Remembrance Day", "title": "Lest we forget", "body": "Please observe 2 minutes of silence with us." }
}
```
**Placement:** put the day slide directly **after the `weather` slide** (it becomes the 3rd slide). Where the takeover entry goes doesn't matter, because it never plays in the rotation. Keep it right after the day slide so the two are easy to find.

## Docs
Add `takeover` to the slide-field reference in the `index.html` header comment, and to the README if it lists slide fields.
