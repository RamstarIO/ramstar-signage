# Accountability chart (`accountability` slide): design reference

Approved: canvas options A (whole chart on one screen) and B (one department per slide), both shown.
**This is a design reference only.** `accountability.html` is the layout spec. It reads the real data file, so serve the repo root (`python3 -m http.server`) and open:
- `/docs/design/accountability/accountability.html?view=overview`
- `/docs/design/accountability/accountability.html?view=department&department=Manufacturing` (or Leadership, Sales %26 Marketing, Distribution, Finance)

| Image | Shows |
|---|---|
| `acct-overview.jpg` | A: every seat and name on one screen |
| `acct-leadership.jpg` | B, 1 of 5: Visionary + Integrator |
| `acct-sales-marketing.jpg`, `acct-distribution.jpg`, `acct-finance.jpg` | B, 2, 3 and 5 of 5 |
| `acct-manufacturing.jpg` | B, 4 of 5: the fullest slide (8 seats, so fit step 4 puts duties inline) |

## Data: `data/accountability.json` (one file feeds all six slides)
Source: `CURRENT_Accountability_Chart_260909_V2` (Visio), "Accountability Chart as of 09/30/2026".
```json
{
  "asOf": "2026-09-30",
  "leadership": [ { "seat": "Visionary", "people": ["Dino Bavetta"], "duties": ["Big ideas", "..."] }, ... ],
  "departments": [
    { "name": "Manufacturing", "people": ["Mike Dojcinovski"], "duties": ["Profitability & throughput", "..."],
      "seats": [
        { "seat": "Program Mgmt", "people": ["Adam Duguay"], "duties": ["..."] },
        { "seat": "Design", "under": "Program Mgmt", "people": ["John Winkfield Jr."], "duties": ["..."] },
        { "seat": "Maintenance", "under": "Manufacturing Manager", "people": [], "duties": ["..."] }
      ] }
  ]
}
```
| Field | Rule |
|---|---|
| `asOf` | Shown on the overview as "As of September 30, 2026". **Update it whenever the chart changes.** |
| `people` | List of names. **An empty list shows "Open seat"** in orange italics. |
| `duties` | The seat's responsibilities, as on the chart (lightly tidied: sentence case; "Kick Off's" → "Kick-offs"; "Developement" → "Development"; "SRED" kept; the chart's "LMA" markers are left out). |
| `under` | Optional: the `seat` name this seat reports to **within the same department**. It drives the overview indent and the "Reports to …" line. |

## `slides.json` entries (six slides, all from the same data)
```json
{ "title": "Accountability chart - overview", "type": "accountability", "view": "overview", "duration": 15 },
{ "title": "Accountability chart - Leadership", "type": "accountability", "view": "department", "department": "Leadership", "duration": 12 },
{ "title": "Accountability chart - Sales & Marketing", "type": "accountability", "view": "department", "department": "Sales & Marketing", "duration": 12 },
{ "title": "Accountability chart - Distribution", "type": "accountability", "view": "department", "department": "Distribution", "duration": 15 },
{ "title": "Accountability chart - Manufacturing", "type": "accountability", "view": "department", "department": "Manufacturing", "duration": 18 },
{ "title": "Accountability chart - Finance", "type": "accountability", "view": "department", "department": "Finance", "duration": 15 }
```
- `department` matches a `departments[].name`, or `"Leadership"` for the leadership seats.
- `load()` fetches `data/accountability.json` (cache-busted, cached for the refresh interval like `nfl.json`). If it fails, or the department isn't found, the slide is skipped with a `console.warn`.
- Optional `"url"` overrides the data path (for tests).

## Layout (1920×1080, navy `#0E2A56`)
Shared: **Ramstar reverse logo bottom right** (right 80, bottom 50, 220 px wide, no box), the same as every other slide. Nothing may overlap it.

**A: overview**
- Top left: tag "Accountability Chart" and "As of …" (24 px, `#AFC0DA`).
- Top centre: one orange card per leadership seat (seat label Barlow Condensed 700, 28 px; name Barlow 700, 36 px), joined by a 46×4 orange link. A 4 px `#3B5C93` stem and a bar from x 290 to 1630 lead to the columns.
- Four department columns (left/right 80, top 230, gap 28). Each has a header card (`#163A72`, 6 px orange top border, name Barlow Condensed 800, 38 px, uppercase; leader 26 px `#D6DDEA`), then its seats in reporting order.
- Seat: name Barlow 700, 27 px; people Barlow 500, 23 px, `#AFC0DA`. **More than 2 people shows a count ("8 people").**
- Seats with `under` are indented with a 3 px `#3B5C93` left rule (second level indented a further 18 px).
- Star outline bottom right (`#163A72`), behind everything.

**B: department**
- Tag "Accountability Chart · n of 5" (Leadership is 1, then departments in file order).
- Title: department name, Barlow Condensed 800, 110 px, uppercase, then "Led by …" (34 px).
- "ACCOUNTABLE FOR" line: the department leader's duties joined with " · " (26 px). None on Leadership.
- Card grid starts 30 px below the header and ends 150 px above the bottom, clear of the logo. Columns: 3 for up to 6 seats, 4 for 7 or more. Leadership uses 2 big cards, vertically centred.
- Card: `#163A72`, radius 12, padding 16 22 18. Seat name in Barlow Condensed 800, 32 px, orange, uppercase. Optional "Reports to …" (20 px, `#8EA3C6`). People in Barlow 700, 24 px. Duties as bullets, 22 px, `#D6DDEA`.

## Fit rules (measure once after fonts load)
- Overview: if a column would run past y 1040 or into the logo, step seat/people 27/23 → 25/21 → 23/20 px.
- Department: if the cards overflow the grid area, step 32/24/22 → 30/22/20 → 28/21/19 px. Still too tall: **step 4** switches duties from bullets to one inline run ("a · b · c") at 30/22/21, then 28/21/19. If it still doesn't fit, `console.warn`. Manufacturing uses step 4 today.

## Motion
- Standard `t-in` entrances: header first, then each card or column in order. Star last.
- **Mid-slide moment:** the existing `m-beat` bump on each card (department view) or each column (overview) in turn, using `--i`.
- Transform and opacity only. Reduced motion: static.

## Privacy (public site)
This publishes who holds which role, including open seats. Get a quick OK from leadership before it goes live.
