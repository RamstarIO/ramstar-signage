# Value slide with examples: design reference

Approved layout (option B, split panel) for the `value` slide type. **Design reference only**: not loaded by the player. Sample wording.

| File | Shows |
|---|---|
| `value-with-examples.html` / `.png` | Normal case: "We Partner", 5 examples at 50 px |
| `value-long-name.html` / `.png` | Long name "We Are Always Improving" auto-fitted to 150 px; long examples stepped down to 44 px |

Layout:
- Left: navy panel, 760 px wide, 80 px side padding (600 px for the name). "Our Values" tag (orange) + index ("1 of 5"), value name (Barlow Condensed 800, uppercase, line-height 0.88), orange rule, star watermark.
- Right: "What it looks like here" label, then 4–5 examples as a list with small orange star bullets (Barlow 500, 50 px, 34 px gap). Examples may run to two lines.
- Ramstar logo badge bottom right, as on the other templates (top edge at y = 868).
- The old `meaning` sentence and "In action" line are dropped.

Fit rules (measured with the real fonts; both are required):
1. **Value name fits its 600 px area.** Font size = largest that fits the widest single word in 600 px, max 180 px (min 96 px). Words never break mid-word. Measured at 180 px: "IMPROVING" = 712 px (→ 150 px), "PARTNER" = 603 px (→ 176 px), "ACCOUNTABILITY" = 1114 px (→ 96 px).
2. **Examples list ends above the logo badge** (bottom < 868 px, keep ~40 px clear) **and no example runs past two lines.** If either fails, step the font down 50 → 44 → 40 px (gap 34 → 30 → 26). Five examples with three two-line items need 44 px. 40 px is the floor: an example still three lines at 40 px must be shortened.

Measure once when the slide is built (before it fades in), never per frame.

Data: `{ "type": "value", "index": "1 of 5", "name": "We Partner", "examples": ["...", "..."] }`
