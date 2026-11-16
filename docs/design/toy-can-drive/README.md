# Toy & Can Drive slide (photo-feature)

`toy-can-drive-slide.jpg` shows the approved look, rendered with the live code plus the one-line CSS change below.

## Photo
`slides/toydrive/toy-can-drive-2026.jpg` is already prepared: 1180×1080, exactly the photo-feature panel size. It is the Integrity Cares poster cropped from the top down to just below the two cards, with the poster's snowy blue extended down each side. **Use it as is**: no `photoPosition`, and no `label` (a label would cover the red card).

## Code: line breaks in photo-feature `body`
`pf-body-linebreak.diff` adds `white-space: pre-line;` to `.t-pf-body` in `templates.css`, so `\n` in `body` starts a new line (`\n\n` leaves a gap).
- Existing slides are unaffected, because none use `\n` in `body`. `pre-line` still collapses repeated spaces.
- Update the photo-feature comment at the top of `templates.js`: `"\n" breaks the headline` → `"\n" breaks the headline and the body`.

## slides.json entry
Place it right after the `"Christmas party"` event entry.
```json
{
  "title": "Toy & Can Drive",
  "type": "photo-feature",
  "photo": "slides/toydrive/toy-can-drive-2026.jpg",
  "headline": "Toy & Can\n*Drive*",
  "body": "Donations accepted through Friday, November 20. Toys must be new and unused. Canned and non-perishable food goes to Project HOPE Windsor Essex.\n\nInterested? See Kristen.",
  "until": "2026-11-20",
  "duration": 12
}
```
`until` hides the slide automatically after Friday, Nov 20.
