# Ramstar Signage

Office TV slideshow for Ramstar. Five TVs around the building show a rotating set of branded slides (company values, safety, events, milestones, birthdays and customer/supplier spotlights).

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
├── slides.json         # The playlist. Changes whenever content changes.
├── slides/             # Slide images, 1920×1080 PNG
│   ├── 00-test.png     # "Signage is working" test slide
│   ├── bg-navy.png     # Text-free dark background for overlays
│   └── bg-light.png    # Text-free light background for overlays
├── assets/
│   └── ramstar-logo.png
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
| Company values | Employee names and birthdays |
| Safety reminders and tips | Customer or supplier names and logos |
| Company-wide events (no personal details) | Sales figures, margins, pricing |
| Milestones stated generally ("100,000th cut!") | Anything from P21 or internal reports |
| Holidays and general announcements | Photos of identifiable people |

If something sensitive is committed by mistake, deleting it is **not** enough. Treat it as already public, and ask for help cleaning the history before doing anything else.

---

## Making a slide

Slides are designed from the Ramstar template set (Birthdays, Spotlight, Milestone, Company Value, Event Countdown, Safety) and exported as images.

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
3. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`, then **Save**.
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

GitHub Pages redeploys in about a minute. The TVs pick up the change on their next refresh (within `refreshMinutes`, plus up to about 10 minutes of GitHub's own caching).

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

---

## Roadmap

- **Phase 1:** public site, public-safe slides, all five TVs running from one URL. *(current)*
- **Phase 2:** private hosting via Cloudflare Access; add birthdays and customer spotlights.
- **Content calendar:** who supplies birthdays, milestones and events, and how often each slide type changes, so the screens don't go stale.
- **Live data slide:** a web-page slide showing a daily figure from P21 (e.g. orders shipped today), generated by a scheduled job. Would require Phase 2 first, and possibly a Raspberry Pi player for full browser support.