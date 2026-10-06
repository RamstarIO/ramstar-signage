# Ramstar Signage

https://ramstario.github.io/ramstar-signage/

Office TV slideshow for Ramstar. Five TVs around the building show a rotating set of branded slides (company values, safety, events, milestones, birthdays, upcoming holidays and customer/supplier spotlights).

The whole system is a **static website**: one HTML page, one JSON playlist, and a folder of slide images. Each TV opens the page full-screen in a kiosk browser. Updating the screens means committing new images and editing the playlist; no one touches the TVs.

| | |
|---|---|
| **Owner** | Q (Data Analyst / Developer) |
| **Status** | Phase 1: public hosting, public-safe content only |
| **Hosting** | GitHub Pages (Phase 1) → Cloudflare Pages + Access (Phase 2) |
| **Players** | Amazon Fire TV Stick HD on the 4 non-smart TVs; 1 Roku TV (see [Hardware](#hardware)) |
| **Budget** | $0 software; hardware only |

---

## Contents

1. [How it works](#how-it-works)
2. [Repository layout](#repository-layout)
3. [Content rules (read before committing)](#content-rules-read-before-committing)
4. [Making a slide](#making-a-slide)
5. [The playlist: `slides.json`](#the-playlist-slidesjson)
6. [Publishing to GitHub Pages](#publishing-to-github-pages)
7. [Hardware](#hardware)
8. [Setting up a Fire TV Stick](#setting-up-a-fire-tv-stick)
9. [Phase 2: moving to private hosting](#phase-2-moving-to-private-hosting)
10. [Troubleshooting](#troubleshooting)
11. [Roadmap](#roadmap)

---

## How it works

```
  Mac (design + git)                GitHub Pages                    Each TV
 ┌────────────────────┐  git push  ┌──────────────────┐   HTTPS   ┌──────────────────────┐
 │ Export slide PNGs  │ ─────────▶ │ index.html       │ ◀──────── │ Fire TV Stick        │
 │ Edit slides.json   │            │ slides.json      │           │  └ kiosk browser      │
 └────────────────────┘            │ slides/*.png     │           │     (full-screen)     │
                                   └──────────────────┘           └──────────────────────┘
```

`index.html` is the **player**. On each TV it:

1. Downloads `slides.json` and filters out slides that are disabled or outside their date window.
2. Shows each slide full-screen, with a crossfade, for its duration (default 10 s).
3. Preloads the next image before fading, so there is never a blank frame.
4. Skips any slide whose image is missing instead of stopping.
5. Re-reads `slides.json` every `refreshMinutes` (default 5), so pushed changes appear on every TV within minutes.
6. Does a full page reload every `hardReloadHours` (default 6), which picks up changes to `index.html` itself and clears any browser memory build-up.
7. Keeps playing the last good playlist if the network drops.

All paths are relative, so the same files work on GitHub Pages, Cloudflare Pages, or a local test server.

---

## Repository layout

```
ramstar-signage/
├── index.html          # The player. Rarely changes.
├── templates.js        # Template slide types: birthdays, anniversaries, spotlight, milestone, value, event, safety, holidays
├── templates.css       # Their layouts (match the design canvas, 1920×1080)
├── weather.js          # Live weather slide: fetches ECCC data, builds the slide
├── weather.css         # Live weather slide layout (Design A, 1920×1080)
├── nfl.js              # NFL slides: scoreboard, standings, up next (reads nfl.json)
├── nfl.css             # NFL slide layouts (1920×1080)
├── ambient.css         # Ambient motion: star, progress bar, sheen, beats, party decorations, weather icons
├── slides.json         # The playlist. Changes whenever content changes.
├── slides/             # Slide images, 1920×1080 PNG
│   ├── 00-test.png     # "Signage is working" test slide
│   ├── bg-navy.png     # Text-free dark background for overlays
│   └── bg-light.png    # Text-free light background for overlays
├── assets/
│   └── ramstar-logo.png
├── scripts/
│   ├── build-nfl.mjs   # Builds nfl.json from ESPN (run by the workflow, not on the TVs)
│   └── people_month.py # Prints a month's birthdays + anniversaries entries from HR's spreadsheet
├── tests/              # Saved data for testing slides offline (weather, NFL)
├── .github/workflows/
│   └── pages.yml       # Deploys the site to GitHub Pages; rebuilds nfl.json every 15 min
├── .gitignore
└── README.md
```

**Separation of concerns:** code (`index.html`), data (`slides.json`) and content (`slides/`) live in different files. Routine content updates never touch the code.

---

## Content rules (read before committing)

> **Phase 1 is public.** A GitHub Pages site can be opened by anyone with the URL, whether or not the repository is private.
> **Git history is permanent.** A file that is committed and then deleted can still be recovered from the history, forks and caches.

Until Phase 2 is live, only commit content you would be comfortable putting on the company website.

| ✅ OK in Phase 1 | ❌ Wait for Phase 2 |
|---|---|
| Company values | Employee names, birthdays and work anniversaries |
| Safety reminders and tips | Customer or supplier names and logos |
| Company-wide events (no personal details) | Sales figures, margins, pricing |
| Milestones stated generally ("100,000th cut!") | Anything from P21 or internal reports |
| Holidays and general announcements | Photos of identifiable people |

This applies to the words in `slides.json` exactly as much as to images: names typed into a `birthdays`, `anniversaries` or `spotlight` slide are just as public.

If something sensitive is committed by mistake, deleting it is **not** enough. Treat it as already public, and ask for help cleaning the history before doing anything else.

---

## Making a slide

**Most slides don't need an image at all.** The eight Ramstar templates (Birthdays, Work Anniversaries, Spotlight, Milestone, Company Value, Event Countdown, Safety, Upcoming Holidays) are built into the player as [template slide types](#template-slide-types): you write the words in `slides.json`, and each part of the slide rises in one after another. Use an exported image only for a one-off design the templates don't cover. The rest of this section applies to those images.

### Specification

| Property | Value |
|---|---|
| Size | **1920 × 1080 px** (16:9) |
| Format | PNG |
| File size | Under ~1 MB each (large files slow the Fire Sticks) |
| On screen | 8–12 s per slide |
| Full loop | Under ~3 minutes, so people see new content often |

### Brand

| Token | Hex | Use |
|---|---|---|
| Ramstar Orange | `#F7941D` | Category tags, big numbers, accents |
| Ramstar Blue | `#194B98` | Secondary text, star watermark |
| Navy (ground) | `#0E2A56` | Dark slide backgrounds |
| Warm white | `#F4F2EE` | Light slide backgrounds |

- **Type:** Barlow Condensed (headlines) and Barlow (body), both free on Google Fonts.
- **Never put orange text on white.** It has about 2:1 contrast and washes out on a TV. Use orange as a fill with navy text, or as text on navy.
- **One message per slide**, readable in about 3 seconds from 3 m (10 ft) away. Headlines ≥ 100 px; nothing smaller than about 40 px.
- The logo always sits on its white badge, never directly on a dark background (its blue outline disappears).

### File naming

`NN-topic.png`, where `NN` is a two-digit number that sorts the files sensibly, for example `10-safety-ppe.png`, `20-event-fall-bbq.png`. Playback order comes from `slides.json`, not from the file names; the numbers only keep the folder tidy.

---

## The playlist: `slides.json`

```json
{
  "defaultDuration": 10,
  "refreshMinutes": 5,
  "hardReloadHours": 6,
  "moveTo": null,
  "slides": [
    { "title": "Safety - PPE", "src": "slides/10-safety-ppe.png" },
    { "title": "Fall BBQ", "src": "slides/20-event-fall-bbq.png",
      "start": "2026-10-01", "end": "2026-10-17", "duration": 12 },
    { "title": "Old slide", "src": "slides/30-old.png", "enabled": false }
  ]
}
```

### Top-level settings

| Key | Type | Default | Meaning |
|---|---|---|---|
| `defaultDuration` | number | `10` | Seconds per slide when a slide has no `duration`. |
| `defaultEffect` | string | `"none"` | `"zoom"` gives every slide a slow push-in unless the slide sets its own `effect`. |
| `refreshMinutes` | number | `5` | How often each TV re-reads this file. |
| `hardReloadHours` | number | `6` | How often each TV fully reloads the page. |
| `moveTo` | string or `null` | `null` | If set to a URL, every TV navigates there on its next refresh. Used once, for the [Phase 2](#phase-2-moving-to-private-hosting) switch. |
| `ambient` | object | all `true` | Switches for each ambient effect: `star`, `progress`, `sheen`, `beat`, `weatherIcons`. See [Ambient motion](#ambient-motion). |
| `slides` | array | `[]` | The playlist, in playback order. |

### Slide fields

| Key | Required | Meaning |
|---|---|---|
| `src` | ✅ | Path to the image, relative to the site root. |
| `title` | | Your label. Not shown on screen; used as alt text. |
| `duration` | | Seconds on screen. Overrides `defaultDuration`. |
| `start` | | First day to show, `YYYY-MM-DD`, inclusive. |
| `end` | | Last day to show, `YYYY-MM-DD`, inclusive. |
| `enabled` | | `false` hides the slide without deleting it. |
| `moment` | | Typed slides only: `"sheen"`, `"beat"` or `"none"`. Overrides the slide type's mid-slide moment. See [Ambient motion](#ambient-motion). |
| `progress` | | `false` hides the progress bar while this slide is on screen (logo slides do this automatically). |
| `effect` | | `"zoom"` (slow push-in) or `"none"`. Overrides `defaultEffect`. |
| `overlay` | | Animated text on top of the image. See [Animation](#animation). |

Date windows use each TV's local date, so an event slide can be scheduled weeks ahead and it removes itself after the event.

### Animation

Two optional ways to add motion. Both are per slide, and slides without them play exactly as before.

**1. Whole-slide zoom** works on any PNG, including ones with the text baked in. The image slowly pushes in (about 6%) for the whole time it's on screen:

```json
{ "src": "slides/10-safety-ppe.png", "effect": "zoom" }
```

**2. Text overlay (entrance animation).** The tag, title and body are real text on top of a **text-free background image**, and they rise in one after another: the tag at 0.5 s, the title at 0.85 s, the body at 1.25 s.

```json
{
  "src": "slides/bg-navy.png",
  "effect": "zoom",
  "overlay": {
    "tag": "Safety First",
    "title": "Lift with your *legs*",
    "body": "Ask for help or use the hoist for heavy loads."
  }
}
```

| Overlay key | Meaning |
|---|---|
| `tag` | The small orange category label. |
| `title` | The big headline. Wrap one phrase in `*asterisks*` to highlight it (orange on dark, blue on light). |
| `body` | One supporting line. |
| `theme` | `"light"` for navy text on a light background. Leave it out for white text on a dark background. |
| `align` | `"top"` to pin the text to the top instead of centring it vertically. |

Two ready-made backgrounds are included: `slides/bg-navy.png` (dark) and `slides/bg-light.png` (light, use with `"theme": "light"`). Both have the star watermark and logo badge, and no text.

Overlays are the fastest way to make simple slides: no design tool needed, just edit `slides.json`. Use a designed PNG when the slide needs a custom layout (big numbers, photos, lists of names).

Keep motion subtle. The screens are seen from the corner of people's eyes all day, and constant large movement becomes irritating fast. The player also honours a device's "reduce motion" setting.

### Template slide types

Each template from the design canvas is a slide type. The player builds it in HTML at 1920×1080, so the text is crisp on any screen and every part animates in: tag first, then the headline, then the details, about 0.3 s apart. Big numbers (milestone, safety) count up from zero.

```json
{ "type": "birthdays", "month": "October",
  "people": [ { "day": "3", "name": "Jane Doe" }, { "day": "14", "name": "Chris Martin" } ] }

{ "type": "anniversaries", "month": "October",
  "people": [ { "day": "Mon 5",  "name": "Pat Example",          "years": 12 },
              { "day": "Fri 9",  "name": "Jordan Sample",        "years": 10 },
              { "day": "Wed 14", "name": "Casey Placeholder",    "years": 1 },
              { "day": "Thu 15", "name": "Riley Demo",           "years": 3 },
              { "day": "Tue 20", "name": "Morgan Test",          "years": 20 },
              { "day": "Fri 23", "name": "Sam Fictional",        "years": 7 },
              { "day": "Mon 26", "name": "Taylor Mockup",        "years": 30 },
              { "day": "Fri 30", "name": "Alexandra Montgomery", "years": 2 } ] }

{ "type": "spotlight", "kind": "Customer", "name": "Acme Fabrication", "since": "2012",
  "blurb": "Laser-cut brackets and plate, delivered every week.", "logo": "slides/logos/acme.png" }

{ "type": "milestone", "number": "100,000", "label": "Cuts completed", "note": "This year. Thank you, team." }

{ "type": "value", "index": "1 of 5", "name": "We Partner",
  "examples": ["We bring the right people into a job early",
               "We share what we know, so nobody works alone",
               "We treat suppliers as part of the team",
               "We ask for help, and we offer it"] }

{ "type": "event", "name": "Fall BBQ", "date": "2026-10-17", "time": "12:00 PM",
  "location": "Shop floor", "note": "Burgers on us. RSVP to the front office." }

{ "type": "safety", "since": "2026-05-21", "tip": "Gloves on for every cut, even the quick ones." }

{ "type": "holidays",
  "holidays": [ { "date": "2026-10-12", "name": "Thanksgiving" },
                { "date": "2026-12-26", "name": "Boxing Day", "observed": "2026-12-28" } ],
  "shutdowns": [ { "name": "Winter shutdown", "from": "2026-12-24", "to": "2027-01-01",
                   "note": "Office and manufacturing" } ] }

{ "type": "logo", "intro": ["rise", "wipe", "words", "assemble", "glint"] }
```

| Type | Fields (✅ = required) | Notes |
|---|---|---|
| `birthdays` | `people` ✅ (list of `day` + `name`), `month`, `decor` | `month` defaults to the current month. Up to 8 people; more than 4 switches to a tighter layout. `day` can be `"9"` or `"Sat 9"`. Each person stays on one line; a very long name is cut short with "…". `decor` is the background decoration (below). |
| `anniversaries` | `people` ✅ (list of `day` + `name` + `years`), `month`, `decor` | Work Anniversaries: the birthdays layout with "12 YEARS" / "1 YEAR" in orange under each name, and a small orange star after it on decade anniversaries only (10, 20, 30…). A person with no `years` just gets the name. Same rules as birthdays: up to 8 people, more than 4 switches to a tighter layout, names stay on one line and are cut short with "…". `decor` defaults to `"confetti"`. Typed in each month, like birthdays (or generated with `scripts/people_month.py`, below); no start dates needed. See `docs/design/anniversaries/README.md`. |
| `spotlight` | `name` ✅, `kind`, `since`, `blurb`, `logo` | `kind` is `"Customer"` (default) or `"Supplier"`. `logo` is an image path; without one, the company name fills the white box. |
| `milestone` | `number` ✅, `label` ✅, `note` | A plain number like `"100,000"` counts up; anything else shows as typed. |
| `value` | `name` ✅, `examples`, `index` | Split panel: the value on navy at the left, its examples listed under "What it looks like here" on the right. The name sizes itself so its longest word fits the panel (up to 180 px, down to 96 px; words never break mid-word), so "We Are Always Improving" comes out at about 150 px. `examples` is a list of 4–5 short strings (up to 5 are shown); each may run to two lines, and if the list would come within 40 px of the logo the text steps down (50 → 44 → 40 px) to fit. Both are measured once as the slide is built (see `docs/design/value/README.md`). With no `examples` the right side stays empty; note the key is `examples`, plural. `index` is the small "1 of 5" label. The old `meaning` and `example` fields are no longer shown. |
| `event` | `name` ✅, `date`, `time`, `location`, `note` | `date` is `YYYY-MM-DD`. The countdown calculates itself, shows **Today** on the day, and the slide **hides itself the day after**. With no date it shows "Save the date". |
| `safety` | `since` or `days`, `tip`, `label` | Set `since` to the date of the last lost-time incident and the count keeps itself up to date. `days` is a fixed number instead. |
| `holidays` | `holidays` ✅ (list of `date` ✅ + `name` ✅, optional `observed`, `note`), `shutdowns` (list of `name`, `from` ✅, `to` ✅, `note`) | Upcoming Holidays: a countdown to the next holiday, the next shutdown, and cards for the three holidays after it. Type the dates in once a year from HR's schedule (they aren't calculated, because Ramstar's list differs from Ontario's); all dates are `YYYY-MM-DD`. A weekend holiday goes on its real `date` with the day off as `observed`: the countdown counts to the real date, the card reads "Sat · observed Mon Dec 28", and the holiday stays up until the observed day has passed. On the day the countdown reads **Today**; the next day it moves on to the next holiday. The badge says "Paid holiday" unless the holiday has its own `note` (e.g. `"Vacation day"` for Family Day). A shutdown shows once it starts within 120 days, reads "Until Fri, Jan 1" while it's on, and disappears after `to`. When the list runs out, the slide **hides itself**, so add next year's dates before the last holiday passes. Fit: the hero name shrinks to fit its column (150 px down to 96 px; words never break mid-word) and card names never wrap (40 → 34 → 30 px, then cut short with "…"). See `docs/design/holidays/README.md`. |
| `logo` | `intro`, `slogan`, `logo` | A clean brand break: the logo with the slogan between two orange rules. `slogan` defaults to "Unmatched Service & Technology". `intro` is one of `rise`, `wipe`, `words`, `assemble`, `glint` (below), **or a list of them**, in which case the slide uses the next intro each time it comes round. The progress bar is hidden on logo slides. |

All types also accept `tag` (the orange label, e.g. `"Supplier Spotlight"`) and the usual `duration`, `start`, `end`, `enabled`. Birthdays and anniversaries also accept `headline`; wrap a word in `*asterisks*` to colour it. Note that `title` is only your own label for the entry and is never shown on screen.

**Birthday and anniversary decorations** (`"decor"`, default `"balloons"` on birthdays, `"confetti"` on anniversaries):

| `decor` | What it looks like |
|---|---|
| `balloons` | Faded blue and white balloons rise slowly behind the names, each swaying on its own timing. (Kept to blues and white on purpose: see-through orange over navy mixes to a muddy brown.) |
| `confetti` | About 30 pieces of orange, white and light-blue confetti tumble slowly down. |
| `cake` | A line-drawn cake on the right with flickering candles, a soft glow and twinkling sparkles. |
| `none` | No decoration. |

```json
{ "type": "birthdays", "month": "October", "decor": "cake", "people": [ ... ] }
```

**Making the monthly people entries.** `scripts/people_month.py` reads HR's Active Employees spreadsheet and prints that month's `birthdays` and `anniversaries` entries to paste over last month's (it needs `python3 -m pip install openpyxl`):

```bash
python3 scripts/people_month.py ~/path/to/Active_Employees.xlsx 2026-10
```

It prints only what the slides show (day, display name, years of service), never birth years, and warns on stderr about unreadable or missing dates and months with more than 8 people. Keep the spreadsheet **outside** the repo (`*.xlsx` is gitignored as a backstop). Awkward names in the file are fixed in its `NAME_OVERRIDES` table.

**Logo slide intros:**

| `intro` | How it arrives |
|---|---|
| `rise` | Logo rises in, the rules grow outward, the slogan rises. Matches the other slides. |
| `wipe` | Logo settles into place, then the slogan is uncovered left to right. |
| `words` | Logo pops in, then the slogan arrives word by word. |
| `assemble` | Logo drops in from above; the slogan's two halves slide in from opposite sides and meet. |
| `glint` | Logo fades in and a band of light sweeps across it, then the slogan follows. |

Use **one** logo entry with a list, rather than several logo entries, so the brand break takes one slot per loop and varies each time:

```json
{ "type": "logo", "intro": ["rise", "wipe", "words", "assemble", "glint"] }
```

Each TV keeps its own place in the list, and starts again from the first intro after its 6-hourly reload. The logo image is only 600 px wide, so a larger or vector version of the logo would look sharper on this slide; save it in `assets/` and set `"logo": "assets/<file>"`.

**Give these slides at least 8–10 seconds.** The entrance takes about 2 seconds, and people need time to read after it.

To change a layout, edit `templates.css` (sizes, colours) or the matching function in `templates.js` (what appears). New types follow the same pattern: add a `types.<name> = { render(slide) { ... } }` entry.

### Ambient motion

A slide that sits perfectly still for 10 seconds looks frozen. The player adds slow, background-level motion so the screens always look live, without pulling eyes off the words. Everything here runs automatically on typed slides (templates and weather); image slides get the progress bar only.

**What happens on every slide**

| Effect | What it does | Switch |
|---|---|---|
| **Star** | The star watermark is the **last thing to fade in**, once the text has landed (about 2 s in), then slowly turns ~7° and drifts. It fades out with the text when the slide leaves. It sits in a different place on each template, so it fades rather than jumps. | `star` (turns off the drift; the fade in and out always happens) |
| **Progress bar** | A thin line (4 px on a 1080p TV) along the bottom. It **alternates**: fills left to right on one slide, drains left to right on the next, so it never snaps back to empty. It's orange, or navy on the orange Safety slide. It fades out on logo slides (and any slide with `"progress": false`) but keeps running underneath, so the alternation stays in step. | `progress` |
| **Mid-slide moment** | Just before halfway through, one attention-catching moment so the slide doesn't go stale. Either a sheen or a beat (below). | `sheen`, `beat` |
| **Living weather icons** | The sun's rays turn, clouds drift, rain and snow fall, lightning flickers. The forecast cards are offset so they don't move in lockstep. | `weatherIcons` |

**The mid-slide moment, per slide type**

| Slide | Default | What happens |
|---|---|---|
| Birthdays | beat | Each person bumps up in turn: the line above them flashes white and their name flashes orange |
| Anniversaries | beat | Same as birthdays |
| Spotlight | sheen | A glint of light sweeps across the company name |
| Company value | beat | Each example bumps up in turn |
| Milestone | beat | The big number pulses once |
| Event | beat | Two navy rings ripple out from the countdown number |
| Safety | beat | The tip-of-the-week box nudges right and its label flashes white |
| Weather | beat | The four stats light up one after another |
| Holidays | beat | The countdown number pulses once (like the milestone), then the three cards bump up in turn |
| Logo | sheen | A glint of light sweeps across the logo itself |

Override it for one slide with `"moment"`:

```json
{ "type": "milestone", "number": "250,000", "label": "Cuts completed", "moment": "sheen" }
```

`"sheen"` works on every type; `"beat"` only does something on birthdays, anniversaries, value, milestone, event, safety, weather and holidays; `"none"` turns the moment off for that slide.

**Turning effects off everywhere** (at the top of `slides.json`; leave out any you want to keep on):

```json
"ambient": { "star": true, "progress": true, "sheen": true, "beat": true, "weatherIcons": true }
```

All ambient motion also switches off automatically on a device set to "reduce motion".

**Performance (built for the Fire Stick):** every effect animates only *movement and fading* (`transform` and `opacity`), which the graphics chip does on its own at no cost to the processor. Nothing animates colours, backgrounds, text or shapes inside an SVG, because those make the browser repaint on the processor every frame, which is what stutters on a Fire Stick. How the trickier effects stay GPU-only:
- **Sheen:** a copy of the text in the highlight colour sits in a narrow, soft-edged window that slides across while the copy slides back the other way, so it stays exactly over the real text.
- **Colour flashes** (safety label, weather stats, birthday and anniversary names): a second copy in the new colour fades in and out on top.
- **Weather icons:** each moving part (rays, cloud, raindrops) is its own layer and moves as a whole.
- **Balloons and confetti (birthdays, anniversaries):** each piece is two small layers, one travelling in a straight line and one swaying or tumbling, and they only run while the slide is on screen. Measured with the processor slowed 4×: a few extra paints when the slide appears (about 10 ms in total), nothing per frame.
- **Count-up numbers:** tick about 12 times a second, like a mechanical counter, instead of every frame.
- **Layer hints** (`will-change`) prepare the next slide's moving parts while the previous one is still leaving.

Measured on a 44-second, six-slide run with the processor slowed 4×: repaints went from 1,321 to 194 (−85%) and layout passes from 677 to 54 (−92%), with zero per-frame work between moments. **If you add an effect, keep to transform and opacity.**

**Tuning:** the timings live in `ambient.css` and are commented. The most useful knobs: the star's fade-in (`star-in 1400ms`), how far it turns (`rotate(7deg)` in `amb-drift`), when the moment fires (`0.42` for the sheen, `0.45` for beats, as fractions of the slide's duration), and the bar's thickness (`* 4` in `.progress`).

### Live weather slide

A slide with `"type": "weather"` needs no image. Each TV builds it from live Environment Canada data:

```json
{ "type": "weather", "station": "on-94", "label": "Oldcastle, ON", "duration": 12 }
```

| Key | Meaning |
|---|---|
| `type` | `"weather"` |
| `station` | ECCC city page ID. `on-94` is Windsor (observations from Windsor Airport), the closest to Oldcastle. |
| `label` | The place name shown next to the date. |
| `duration` | Seconds on screen. 12 is a good length for this slide; it has more to read. |

What it shows: the date; the current temperature, conditions and icon; "feels like" (wind chill below 10 °C, humidex above 20 °C, only when it differs); today's high and low, or tonight's low after the daytime forecast ends; wind (with gusts when they're notable), humidity, UV index and the next sunrise or sunset; a 5-day strip with a chance-of-precipitation % when ECCC gives one; and an **orange alert banner** whenever ECCC has a warning, watch or statement in effect.

How it behaves:
- **Source:** MSC GeoMet (`api.weather.gc.ca`), Environment and Climate Change Canada's open-data API. It's free, needs no account or key, and allows commercial use with attribution, which the slide shows in its footer. Don't remove that footer line.
- **Refresh:** each TV fetches at most every 15 minutes and reuses the data in between. Five TVs make about 500 requests a day, far below any fair-use concern.
- **Outages:** if a fetch fails, the TV keeps showing the last good data for up to 6 hours; after that the weather slide is skipped until the feed returns. The rest of the playlist carries on either way.
- **Why not Open-Meteo?** Its free tier is for non-commercial use only, and a company's office signage is at best a grey area under its terms.

To change the design, edit `weather.css` (layout and sizes) or the `render` function in `weather.js` (what appears). Test changes locally with the saved sample response in `tests/fixture-on-94.json` before pushing.

### NFL slides

Three slide types, built live from `nfl.json`. No images and nothing to update by hand:

```json
{ "type": "nfl-scoreboard", "duration": 16 },
{ "type": "nfl-standings",  "duration": 20 },
{ "type": "nfl-next",       "duration": 16 }
```

| Type | Shows |
|---|---|
| `nfl-scoreboard` | Every game of the current week, 8 per screen: final scores, live score with quarter and clock, or kick-off day and time (Eastern). Teams on bye are listed on the last screen. |
| `nfl-standings` | One screen per conference (AFC, then NFC). Left: "In the playoffs today", seeds 1–7 (`Bye` = first-round bye for the 1 seed, division name for division leaders, `WC` = wild card). Right: "In the hunt", seeds 8–16 with games behind the 7th seed (`—` when level). Clinched spots get an orange ✓; eliminated teams are dimmed. Seeds are ESPN's official playoff seeds; nothing is calculated here. |
| `nfl-next` | The week after the scoreboard's week: each matchup with day and time, 8 per screen, byes on the last screen. |

| Key | Meaning |
|---|---|
| `duration` | Seconds on screen, shared by all its screens. A slide with two screens flips halfway through, so 16 gives 8 seconds per screen. |
| `logos` | `false` shows a circle in the team colour with its abbreviation instead of the team logo. |
| `conference` | Standings only: `"AFC"` or `"NFC"` to show just that conference. |
| `url` | A different data file, e.g. `"tests/fixture-nfl.json"` for testing. |

**Which week:** the scoreboard shows a week from its Thursday game through the following Wednesday, so on Monday morning it still shows the week just played, including Monday night's game. It moves on early Thursday morning (about 3 AM Eastern). "Up next" is always the week after.

**When they hide:** all three hide themselves from after the Super Bowl until Week 1 (the off-season). Standings also hide during the playoffs. A slide with nothing to show (e.g. "Up next" in Week 18, before the wild-card matchups are set) is skipped, as is any NFL slide whose data is more than 36 hours old.

**Where the data comes from:** `scripts/build-nfl.mjs` reads ESPN's public NFL scoreboard, standings and teams endpoints and boils them down to a ~20 KB `nfl.json`. The [Deploy site](#publishing-to-github-pages) workflow runs it every 15 minutes and publishes the result with the site. `nfl.json` is never committed (it's in `.gitignore`), so nothing touches `main`. Team logos are loaded straight from ESPN's image server by each TV and are never stored in this repo; if a logo can't load, that team gets the coloured circle.

- ESPN's endpoints are free but **unofficial and undocumented**: they can change without notice. The script checks the shape of what it gets (e.g. that every team has a playoff seed) and, if anything looks wrong, the last good `nfl.json` stays published.
- GitHub runs scheduled jobs on a best-effort basis, often 5–30 minutes late, so live scores can trail the real game by roughly 15–45 minutes. Finals appear within the hour.
- To test locally, add `"url": "tests/fixture-nfl.json"` to the slides (a saved Week 4 file; its Monday night game was edited to look live). To build real data on your Mac: `node scripts/build-nfl.mjs nfl.json` (Node 20+); add `--now=2026-10-08T12:00:00Z` to see what a given moment would show.

### JSON gotchas

JSON is strict. These all break the file, and a broken file means the TVs keep showing the last good playlist until it's fixed:

- A trailing comma after the last item in a list or object.
- Single quotes instead of double quotes.
- Comments (`//`); JSON does not allow them.

Paste the file into a JSON validator, or run `python3 -m json.tool slides.json` in Terminal, before pushing.

---

## Publishing to GitHub Pages

One-time setup:

1. Create a **public** repository on GitHub named `ramstar-signage`.
2. Push this folder to it:
   ```bash
   cd ramstar-signage
   git init
   git add .
   git commit -m "Initial signage player"
   git branch -M main
   git remote add origin https://github.com/<your-account>/ramstar-signage.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**. The site is deployed by the **Deploy site** workflow (`.github/workflows/pages.yml`) on every push to `main`, and every 15 minutes to refresh the NFL data (see [NFL slides](#nfl-slides)). The workflow never commits anything, so it works with `main` protected. To deploy by hand: **Actions → Deploy site → Run workflow**.
4. After a minute or two the site is live at `https://<your-account>.github.io/ramstar-signage/`. Open it on your Mac; you should see the test slide.

Routine update:

```bash
# 1. Copy the new PNG into slides/
# 2. Add it to slides.json
python3 -m json.tool slides.json > /dev/null && echo "JSON OK"
git add slides/ slides.json
git commit -m "Add October safety slide"
git push
```

The Deploy site workflow redeploys in about a minute. The TVs pick up the change on their next refresh (within `refreshMinutes`, plus up to about 10 minutes of GitHub's own caching).

### Testing locally before pushing

`index.html` loads `slides.json` with `fetch`, which does not work from a double-clicked file. Run a local web server instead:

```bash
cd ramstar-signage
python3 -m http.server 8000
# then open http://localhost:8000 in a browser
```

---

## Hardware

| Screen | Player | Notes |
|---|---|---|
| Roku smart TV (×1) | Built-in Roku, or a Fire TV Stick for consistency | Roku has no general-purpose browser. Adding a Fire Stick here keeps all five screens on one platform. |
| Non-smart TVs (×4) | Amazon Fire TV Stick HD | One per TV, on HDMI. |

Per Fire Stick you also need a **USB wall power adapter**. The Stick HD can draw power from the TV's USB port, but on older TVs that port may be too weak, or may switch off when the TV sleeps, which reboots the stick.

A Raspberry Pi is the upgrade path if we later need live data the Fire Sticks can't handle. See [Roadmap](#roadmap).

---

## Setting up a Fire TV Stick

1. Plug the stick into the TV's HDMI port and into the **wall adapter**. Connect it to the office Wi-Fi.
2. **Stop the screen from going dark or showing screensavers:** in Settings, set the screensaver start time to **Never**, and turn off any sleep or idle timer. Menu names vary between Fire OS versions; look under *Display & Sounds / Display & Audio → Screensaver*.
3. **Install a kiosk browser.** Amazon's Silk browser can open the page, but it shows browser controls, doesn't start on boot, and gets covered by the screensaver. A kiosk browser such as **Fully Kiosk Browser** is designed for this:
   - Start URL: `https://<your-account>.github.io/ramstar-signage/`
   - Launch on boot: **on**
   - Keep screen on: **on**
   - Reload on network reconnect / on error: **on**

   Check which of these the free version covers before relying on it.
4. Reboot the stick and confirm it comes back to the slideshow **with no remote input**. That is the real test.
5. Label the stick with its location (e.g. "Front Office") so you know which screen is which.

---

## Phase 2: moving to private hosting

**Goal:** show people and customer content without it being public.

**Design:** this public repo becomes a permanent **front door**. It keeps the player and public-safe slides only, and never receives sensitive content. A **new private repo** holds the full content and is served by Cloudflare Pages behind Cloudflare Access.

```
TV start URL (unchanged) ──▶ github.io/ramstar-signage  ──moveTo──▶  signage.<domain>  (Cloudflare Access)
                              public, no sensitive data              private repo, all content
```

### Prerequisites

- [ ] Confirm Ramstar has a **static public IP** (ask the ISP or check the router).
- [ ] Confirm which **domain** to use (a subdomain of an existing company domain, e.g. `signage.<domain>`).
- [ ] Free Cloudflare account. Cloudflare Zero Trust's free plan covers up to 50 users with no credit card.

### Steps

1. Create a **private** repo, `ramstar-signage-private`, with a copy of this repo's contents.
2. In Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**, pick the private repo, no build command, output directory `/`.
3. Attach the custom domain (e.g. `signage.<domain>`).
4. In **Zero Trust → Access → Applications**, add a self-hosted application for that domain with a policy that allows **only the office's public IP**. The TVs need no login; anyone outside the building is blocked.
5. From a phone on **mobile data** (outside the office), open the URL and confirm it is **blocked**. From the office, confirm it loads.
6. In **this public repo's** `slides.json`, set:
   ```json
   "moveTo": "https://signage.<domain>/"
   ```
   and push. Within `refreshMinutes` every TV moves to the private site. The kiosk start URLs never need to change: a rebooted TV loads the public page, which forwards it again.
7. From now on, sensitive slides go **only** into the private repo.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| "No slides are scheduled right now." | Every slide is disabled or outside its date window. | Check `enabled`, `start`, `end`. Dates are `YYYY-MM-DD`. |
| "Waiting for network…" | TV has no internet, or `slides.json` is invalid. | Check Wi-Fi, then validate the JSON. |
| One slide never appears | Wrong `src` path or file name case. | Paths are case-sensitive on GitHub Pages: `Safety.png` ≠ `safety.png`. |
| Change pushed but TV still shows old content | Caching. | Wait up to ~15 minutes, or reload the kiosk browser once. |
| Works on the Mac, blank on the TV | Kiosk start URL typo. | Compare it character by character, including the trailing `/`. |
| Screen goes dark after a while | Fire TV screensaver or sleep, or the TV's own power-saving setting. | Re-check step 2 of the Fire Stick setup, and the TV's eco settings. |
| Stick reboots randomly | Underpowered from the TV's USB. | Use the wall adapter. |
| Page works locally only via `python3 -m http.server` | Expected. | `fetch` needs a web server; opening the file directly won't work. |
| NFL slides never appear | Off-season, or `nfl.json` is missing or over 36 hours old. | Check the latest **Deploy site** run under **Actions**. Locally there is no `nfl.json` unless you build one or point the slides at `tests/fixture-nfl.json`. |
| Pushed changes don't appear at all | The Deploy site workflow failed, or Pages isn't set to deploy from GitHub Actions. | Check **Actions**, and **Settings → Pages → Source: GitHub Actions**. |

---

## Roadmap

- **Phase 1:** public site, public-safe slides, all five TVs running from one URL. *(current)*
- **Phase 2:** private hosting via Cloudflare Access; add birthdays and customer spotlights.
- **Content calendar:** who supplies birthdays, milestones and events, and how often each slide type changes, so the screens don't go stale.
- **Live weather slide:** done (`"type": "weather"`).
- **NFL slides:** done (`"type": "nfl-scoreboard"`, `"nfl-standings"`, `"nfl-next"`).
- **Live P21 slide:** a daily figure from P21 (e.g. orders shipped today), written to a JSON file by a scheduled job and drawn by the player the same way the weather slide is. Requires Phase 2 first.
