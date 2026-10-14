# Site A "Saturn on the Mat" — design notes

**The idea.** Her work table seen from above, with Saturn turning over it. The ground of every page is option 1's green cutting
mat; her pieces ride option 9's tilted ring over it; paper and orange sections are sheets lying on the mat; her cut-outs (eyes,
lips, torn strips, scissors, her hands) lie on it as cut paper. Built from `public/option-9/` (rings, planet menu, cart), with
option 1's mat, sheets and scraps and option 4's logo behaviour and orange About. Home only: `public/site-a/index.html`.

## Colour (tokens in `css/site.css` §1)
| Token | Value | Used for |
|---|---|---|
| `--mat` | `#028B71` | the ground (`body`): 1px pale grid `--mat-line` every `--u` (64/56/44px), measured from the centre line, soft light top-left |
| `--paper` | `#EFEDEA` | sheets (names, services, the deeper why), slips, cards, the menu and cart; large display type on the mat |
| `--cobalt` | `#122FAB` | every word on paper, the planet, buttons on paper |
| `--orange` | `#FF5630` | the About sheet only |
| `--ink` | `#231F20` | words and the button on orange, the footer (with a faint grid: the mat's underside) |
Sections set `data-tone="mat|paper|orange|ink"`, giving `--bg / --fg / --chip / --chip-fg`; components read those.
**Words on the green:** only large display type (Neco headlines, white, 3.6:1, large-text AA). Everything smaller sits on paper:
`.slip` (subhead, "Work with me", ring captions and hints, the card facts, the doorway names) or `.card` (Stay in touch).

## Type
Option 9's: Neco 500 for headlines and lines, TT Interphases for body and controls, mono only for "Original, 1 of 1" and "soon".
About: option 4's poster voice, TT Interphases 900 at 75% width in capitals, `--mega: min(14.6vw, 13.5rem)` (option 4: 22vw).

## Paper, depth
`.sheet` = a section inset by `--edge`, paper on `::before` turned ±.2–.34deg with a contact shadow; the About sheet overlaps the
names sheet like two papers. `.scrap` = a real cut-out, absolutely placed, turned by `--r`, tight double drop-shadow, no border.
Prints and cards carry option 1's `--shadow-rest`. No sticker borders, no tape, no ruler, no torn edges.

## Motion
One curve `cubic-bezier(.16,1,.3,1)`; only transform, opacity, clip-path. Reduced motion: everything laid out and still.
- **The ring** (`orbit()` in `js/site.js`, unchanged from option 9): hero (12 prints, drag to spin, leans to the pointer, turns
  with scroll), names, the work (6 cards, drag), services (a moon per line), the deeper why, the menu.
- **Scraps**: the hero's slide onto the mat from their nearest edge on load, turned, and settle (`@keyframes scrap-in`); those
  further down slide in when seen (`data-reveal` + a settling turn); all drift and turn with scroll at their own rates (`--v` from
  the section, `--dx/--dy/--dr`), so they slide out as the section leaves; each shifts away from the pointer (option 1's code).
- Headlines word by word; her name drifts sideways with scroll (option 4); the logo shrinks to 58% once you scroll.
- Page to page: the next page opens out of the planet (option 9).

## Moving around
Logo alone top-left, fixed, nothing behind it: white over the mat, black over paper and orange, hidden over the footer
(`html[data-logo]`, the ground under its corner). Option 9's planet at the bottom centre: Menu (seven pages on a ring; a large
list on a phone), the cart count as its moon. Cart: paper panel over the dimmed mat. No top bar.

## The other pages (plan)
- **About**: orange sheet opener (name + portrait, same scale as Home), the statement word for word on a paper sheet, the story on
  a card on the mat beside three process prints lying at angles, exhibitions on a sheet, soft close with both buttons.
- **Shop**: on the mat. Intro line on a slip, the three filters as paper discs, pieces lying straight on the mat in a grid with
  their slips (title, year, mark, price, add disc); no ring, for speed. Empty Prints/Goods: an empty ring on the mat with one slip.
- **Product**: the piece arrives whole at the front of a ring over the mat (neighbours a turn away); facts on a paper card.
- **Services**: paper sheet with the three moons; the project carousel as loud placeholders lying on the mat.
- **Exhibition**: the list on a paper sheet; The Local Collage on the mat with its photos as prints.
- **Commissions / Contact**: the form on a card on the mat in the first screen, her hands cut-out reaching in beside it.
- **Shipping & Returns / Privacy**: one paper sheet, pending parts marked.
