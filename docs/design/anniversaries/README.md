# Work anniversaries slide: design reference

New `anniversaries` slide type in the **same style as the birthdays slide** (navy, orange tag, two-column list, orange row rules). **Design reference only**: not loaded by the player. Sample names.

| File | Shows |
|---|---|
| `anniversaries-4.html` / `.png` | Up to 4 people: normal rows |
| `anniversaries-8.html` / `.png` | 5–8 people: tighter rows (same switch as birthdays' `t-names--many`) |

Layout:
- Tag "Work Anniversaries"; headline "Happy Anniversary" + month in orange (`month` defaults to the current month; `headline` override with `*accent*` like birthdays).
- Each row: day (orange Barlow Condensed, nowrap, 130 px min column, same as birthdays) · name (white, one line, ellipsis guard) with a second line in orange: "12 YEARS" / "1 YEAR".
- **Star** (small filled orange star after the years) **only when years is divisible by 10** (10, 20, 30, 40…). Ramstar only celebrates decade anniversaries.
- Grid max-width 1440 px (4 people) / 1360 px (5–8 people, stays clear of the logo badge). Up to 8 people.

Motion (reuse the birthdays code, don't duplicate it):
- Background decoration: the birthday slide's **`confetti`** decor (falling, tumbling pieces). Default decor for this type is `"confetti"`; `decor` override works as on birthdays.
- Entrance as birthdays; mid-slide moment: **beat**, each row bumps in turn (`--i`), line flashes white, name flashes orange.

Data (entered manually, same as birthdays, no start dates needed):
```json
{ "type": "anniversaries", "month": "October",
  "people": [ { "day": "Mon 5", "name": "Pat Example", "years": 12 },
              { "day": "Fri 9", "name": "Jordan Sample", "years": 10 } ] }
```
