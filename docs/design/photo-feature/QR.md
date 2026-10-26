# Photo feature: partner logos up top, optional QR code in the footer

This makes two changes to the `photo-feature` slide:
1. **Partner logos move to the top row**, beside the event logo. Previously they sat at the bottom left.
2. **A new optional `qr` field** puts a scannable code at the bottom left of the panel, next to the Ramstar logo, where the partner logos used to be.

`photo-feature-qr.jpg` shows the expected result. It was rendered with the live `templates.js`/`templates.css` plus the changes in `qr-reference.diff`. The diff is a working reference: follow its approach, but write it properly into the existing photo-feature code.

## Data
```json
"qr": { "src": "slides/c4c/vote-qr.svg", "caption": "Scan to vote" }
```
- `src`: required if `qr` is present. An SVG or PNG QR code that **already includes its white quiet zone**. `slides/c4c/vote-qr.svg` encodes `https://www.facebook.com/windsorccf` (version 3, error correction M).
- `caption`: optional; one line under the code.
- No `qr` field means an empty footer-left; the Ramstar logo stays bottom right.

## Layout
**Top row** (first item in the panel, replaces the lone event logo):
- Flex row, `align-items: center`, gap 36, margin-left −8.
- Event logo: width 215, max-height 165, `object-fit: contain`.
- Partner logos (0–2) follow it in the same row: each at most 250×110, `object-fit: contain`.
- If only partners or only the event logo are given, the row holds just those. If neither, there is no row.

**Footer** (pushed to the bottom, as before): `[QR block] … [Ramstar logo 220 px]`, `align-items: flex-end`, `justify-content: space-between`.
- QR block: column, centred, gap 2. Code image **290×290 px**, `display: block`. Don't go smaller: phones need to read it from a metre or two away.
- Caption: Barlow Condensed 700, 32 px, letter-spacing .06em, uppercase, navy `#0E2A56`, line-height 1, one line.
- No card or shadow is needed: the panel is already white, and the code's own quiet zone separates it.

## Fit rules (changes)
- The rule that dropped the "event logo" when content is too tall now drops the **whole top row**, logos and partners together.
- Checked: the Carve 4 Cancer content with the QR fits at 290 px without dropping anything (the body steps down to 30 px, as in `photo-feature-qr.jpg`). A 300 px code did **not** fit, so 290 is the size.

## Load and motion
- Load the QR in `load()` with `optionalImage`, like the logos. If it fails, the footer-left stays empty and a `console.warn` is logged; the slide still shows.
- Motion: the top row rises first, then headline, body and footer (the QR rises with the footer). After that the QR **stays perfectly still**: no sheen, bump or zoom, because movement makes phones fail to focus.
- Reduced motion: static.
