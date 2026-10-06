# Upcoming holidays slide: design reference

Approved layout (option A, navy countdown) for a new `holidays` slide type. **Design reference only**: not loaded by the player. Shown as it looks on Tue Oct 6, 2026, using Ramstar's 2026 holiday schedule.

Layout (1920×1080, same template conventions as the other slides):
- Top: "Upcoming Holidays" tag (orange), Ramstar logo badge top right, star watermark.
- Hero: days-to-go number (Barlow Condensed 800, 300 px, orange) + "days to go"; "Next holiday" label, holiday name (150 px, uppercase), full date, and a badge ("Paid holiday" by default, or the entry's own `note`).
- Shutdown line (only when a shutdown is upcoming within the window): "Winter shutdown · Thu, Dec 24 – Fri, Jan 1 · Office and manufacturing".
- Bottom: the next three holidays after the hero as cards (calendar tile, name, weekday + "in N days" or "observed …").

Behaviour:
- Dates come from data, entered once a year from HR's schedule (not calculated from Ontario rules: Ramstar's list differs).
- Weekend holidays are listed on their real date and also show the observed day, e.g. Boxing Day "Sat · observed Mon Dec 28". The countdown counts to the real date.
- On the day: hero shows "Today" instead of a number. The day after, it moves to the next holiday. Count days with local-midnight dates (`parseDay`), never `new Date("YYYY-MM-DD")`.
- Shutdowns show while upcoming or in progress, and disappear after their `to` date.
- No upcoming holidays in the data (e.g. next year not entered yet) → the slide hides itself (`isActive` false).
- Fit rule: holiday names never wrap in cards; the hero name shrinks to fit its column like the value name does.
- Mid-slide moment: beat. The countdown number pulses once (same as the milestone number), then the three cards bump in turn.

Data (slides.json):
```json
{ "type": "holidays",
  "holidays": [
    { "date": "2026-10-12", "name": "Thanksgiving" },
    { "date": "2026-12-24", "name": "Christmas Eve" },
    { "date": "2026-12-25", "name": "Christmas Day" },
    { "date": "2026-12-26", "name": "Boxing Day", "observed": "2026-12-28" }
  ],
  "shutdowns": [
    { "name": "Winter shutdown", "from": "2026-12-24", "to": "2027-01-01", "note": "Office and manufacturing" }
  ] }
```
Optional per holiday: `"note": "Vacation day"` replaces the "Paid holiday" badge (e.g. Family Day 2026).
