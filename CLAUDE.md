# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Office TV signage for Ramstar: a **static site** (no build step, no dependencies, no package manager) served by GitHub Pages (deployed by the `.github/workflows/pages.yml` Actions workflow, not from a branch) and opened full-screen by kiosk browsers on Amazon Fire TV Sticks. Pushing to `main` is deploying: TVs pick up `slides.json` changes within `refreshMinutes` (5) and code changes on their 6-hourly hard reload. README.md is the detailed user-facing spec for every `slides.json` field; keep it in sync when behaviour changes.

## Commands

```bash
python3 -m http.server 8000         # run locally at http://localhost:8000 (fetch() fails from file://)
python3 -m json.tool slides.json    # validate the playlist before pushing; invalid JSON freezes TVs on the last good playlist
node scripts/build-nfl.mjs nfl.json # build NFL data from ESPN locally (Node 20+); --now=<ISO> simulates a moment
```

There is no lint or automated test suite. To test the NFL slides offline, give them `"url": "tests/fixture-nfl.json"`. To test the weather slide offline, load `tests/fixture-on-94.json` (a saved ECCC response) in the browser console and pass it through `RamstarWeather.toModel(feature, slide, now)` then `RamstarWeather.render(model)`.

## Architecture

- **`index.html`** – the player (inline script + base CSS). Fetches `slides.json`, filters active slides, double-buffers two layers (`layer-a`/`layer-b`) and crossfades. Transition is three beats: outgoing `.is-leaving` (`EXIT_MS` 550), new layer fades in on top (`FADE_MS` 800, must match `--fade-ms` in CSS), old layer cleared. Slides that fail to load (missing image, `load()` rejects, unknown type) are skipped, never fatal. `moveTo` in `slides.json` redirects every TV (Phase 2 migration hook).
- **Slide type registry** – `templates.js` and `weather.js` register on `window.RamstarTypes[name] = { render(slide, data), load?(slide), isActive?(slide) }`. The player awaits `load()` *before* fading (so no half-drawn frames), passes its result to `render()`, and calls `isActive()` when filtering (e.g. events hide themselves the day after). A new type = a new `types.<name>` entry plus CSS; no changes to `index.html`. Slides without `type` are image slides (`src`, optional `overlay`/`effect`).
- **Layout scaling** – typed slides are authored in fixed 1920×1080 px; the player sets `--k = stageWidth / 1920` and the slide root applies `transform: scale(var(--k, 1))`. Write CSS sizes in plain design-canvas pixels.
- **Entrance & ambient conventions** (`templates.js` helpers, `ambient.css`): `sequencer()` tags parts with `.t-in` and a staggered `--d` delay; `starLast()` sets `--star-at` so the star fades in after the last part lands. The mid-slide moment is chosen by a class on the slide root, `m-sheen` / `m-beat` / `m-none` (per-type default, overridable via `slide.moment`). Global ambient switches become `amb-*` classes on `.stage`. The progress bar is driven by the player and hidden for `.no-progress` slides or `"progress": false`; `.t-slide--orange` gets a navy bar.
- **NFL slides** (`nfl.js`/`nfl.css`, types `nfl-scoreboard`, `nfl-standings`, `nfl-next`) read `nfl.json`, which `scripts/build-nfl.mjs` builds from ESPN's unofficial endpoints. The Pages workflow runs it every 15 min and ships it **inside the Pages deployment only**: `main` is protected, so the workflow must never commit, and `nfl.json` is gitignored. Week choice, Eastern-time formatting and games-behind-7th happen in the script; playoff seeds come from ESPN, never computed. `load()` rejects (slide skipped) in the off-season, when a section is empty, or when data is >36 h old (`"fixture": true` files are exempt). Multi-screen slides flip via CSS using `--slide-dur` (player sets duration + 1 s). Logos are hot-linked from the feed, never committed; `"logos": false` or a failed load draws a team-colour circle. Shared helpers come from `window.RamstarTemplates` (templates.js).
- **Welcome mode** (`welcome.js`/`welcome.css`, spec in `docs/design/welcome/`) is a mode, not a playlist slide: the player polls `welcome.json` every 30 s (cache-busted, separate from the playlist refresh) and, while `on` is true and the local time is inside the optional `from`/`until`, shows only the welcome screen (registered as type `welcome` to reuse `show()`); when it ends, it crossfades to the first playlist slide. A missing/invalid file or bad `from`/`until` keeps the current state. `advance()`/`refreshConfig()` must not resume the playlist while `welcomeOn`. Guest name is one line, shrunk 200→110 px in 4 px steps to fit 1600 px, measured once in `render()`.
- **`weather.js`** separates `load` (network, ECCC MSC GeoMet API, 15 min per-TV cache, stale data served up to 6 h) from pure `toModel`/`render`. Keep the ECCC attribution footer (licence requirement).

## Constraints that aren't obvious

- **Fire Stick performance:** animate only `transform` and `opacity`. No animating colours, backgrounds, text or SVG internals; colour flashes and sheens are done with a duplicate layer fading/sliding on top. Count-ups tick ~12×/s, not per frame. Honour `prefers-reduced-motion`.
- **Text from `slides.json` is set via `textContent`, never `innerHTML`** (`h()`/`el()` helpers); `innerHTML` is only for static SVG decorations. `*asterisks*` in titles/headlines become an accent span.
- **Dates:** `YYYY-MM-DD`, compared against the TV's *local* date. Use `parseDay()` (local midnight) rather than `new Date("YYYY-MM-DD")`, which parses as UTC and is off by one.
- **Phase 1 is public.** The site is publicly reachable and git history is permanent: don't commit employee names/birthdays, customer/supplier names or logos, or financial data except what's explicitly public-safe (see README "Content rules"). Placeholder/dummy data only.
- **Brand:** orange `#F7941D`, blue `#194B98`, navy `#0E2A56`, warm white `#F4F2EE`; Barlow Condensed / Barlow. Never orange text on a light background (poor contrast on TVs). On navy, use the reverse logo (`assets/ramstar-logo-reverse.png`, white outline and star) with no white box; on light backgrounds, the original `assets/ramstar-logo.png` (the corner badges on content slides keep their white badge).
- Paths are relative and case-sensitive on GitHub Pages.
