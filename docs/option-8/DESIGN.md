# Option 8 — "The Floor"

**The idea.** Home opens on a floor seen from above, far larger than the screen: all 25 originals laid
out as plain white-edged prints at slight angles, with the headline set huge on the floor so prints
overlap it. You drag to travel over it, press a print to glide in on it, and a small map shows where you are.

## Colour (tokens at the top of `css/site.css`)
| Token | Value | Where it is allowed |
|---|---|---|
| `--cobalt` | `#122FAB` | All headline type on light grounds, links, the menu panel, two bands (social proof, services), secondary buttons |
| `--paper` | `#EFEDEA` | The page: About, Stay in touch, the cart, the chosen-piece panel; type on cobalt and ink |
| `--floor` | `#E7E2D9` | Only the floors: hero, "The work", "The deeper why". The same paper a step warmer, so a white-edged print reads on it |
| `--ink` | `#231F20` | Body text, the pad, the footer |
| `--orange` | `#FF5630` | One signal: the primary button, the cart count, "you are here" on the map, the focus ring. Never text on paper |
| `--white` | `#FDFCFA` | The border of a print, form fields |
No gradients, no glass, no grain. The only shadow is the contact shadow under a print (`--shadow`).

## Type
- Display: TT Interphases 640, tracking -.05em, sentence case, cobalt. Hero `--ts` floor units (190 wide, 72 narrow); `.display` `clamp(2.75rem, 7.6vw, 7.25rem)/.92`; door rows and service lines the same face.
- Her voice: Neco 400, `.lead` `clamp(1.3rem, 2.05vw, 1.85rem)/1.32` (About, Services, Stay in touch, the door lines).
- Body and controls: TT Interphases 400 / 640, 17px; small facts 14px. No mono, no capitals, no serif-in-sans mixing inside one line.

## Moving around
- **No top bar.** Logo alone top-left of the floor (it scrolls away with it).
- **The pad**, fixed bottom-right, is the whole navigation: the map on top, Menu and Cart under it (on a phone one row at thumb height: map, Menu, Cart). Away from the floor the map folds into the bar.
- **Menu** and **Cart** are panels that open out of the pad's corner (`clip-path`), cobalt and paper. Focus is held in the open panel plus the two pad buttons, returns to the button on close, Escape or the dimmer closes. Menu lists the seven pages in order; pages not built are `<span>` rows marked "soon".
- **The floor**: drag with mouse or finger; arrow keys when focus is inside it; the map (press or drag on it). Wheel and vertical swipe are never listened to (`touch-action: pan-y`), so the page always scrolls; an arrow key at the floor's edge is left to the page.

## Motion, and how the signature interaction is built
- One curve `cubic-bezier(.16,1,.3,1)`. Only `transform` / `translate` / `rotate` / `scale`, `opacity` and `clip-path` move.
- `makeFloor(root)` in `js/site.js`. A floor is a window (`[data-floor]`, `overflow: clip`) onto one element, `.floor__plane`, moved by a single `translate3d() scale()`. Dragging sets it directly; release coasts on a decaying velocity (one `requestAnimationFrame` loop that stops itself); glides (map, keys, choosing) are a 1.15s CSS transition on the same transform, and a new press freezes the glide where it is.
- Places are CSS, not script: every `.spot` carries `--wx --wy --ww --wr` (wide) and `--nx --ny --nw --nr` (narrow, under 900px) in floor units; one unit is `--u` on the floor, so the whole floor scales with the screen. Plane size and the home point are `--pw --ph --hx --hy` on `.floor__plane`. To move a print, change its numbers in `index.html`.
- Choosing a print: the plane scales until the print fills the room left by the panel (never past a low-resolution file's own width), the print straightens, everything else fades, the facts panel slides in (right on wide, a sheet from below on a phone), and a sharper file is swapped in. A second press on the print, or "See the full piece", goes to its page and the shared `pieceTransition` carries the picture.
- Prints near a mouse lift (`--lift` 0 to 1 per print: scale, 6px rise, and a second shadow layer that only fades). A small word follows the mouse: Drag, View, Back.
- Floor pictures are 480px files, lazy; `makeFloor` switches each to eager when it comes within 320px of the view.
- Load-in: the view settles down onto the floor (`.floor__lens` scale 1.16 to 1) while prints slide in from the side they lie on and the headline rises word by word. Skipped when arriving by a page transition.
- Below the floor: headlines rise by word, blocks rise 36px (`data-reveal`); photographs slide in and straighten with the scroll (`--p` via `data-scroll`, `--t` in CSS); the three service lines travel sideways against each other (`--v`).
- Page to page: the old page lifts away (scale .96), the new one settles (from 1.05). Reduced motion: no load-in, no glides, no lift; the floor still drags. No script: words, then every print in a tidy captioned grid.

## Reusable classes and helpers
`.floor__plane` + `.spot` (anything placed on a floor) · `.print` (a floor print) · `.card` (from `pieceCard`) · `.snap` (a photograph as a print) · `.display` `.lead` `.btn` (`--cobalt` `--paper` `--block`) `.link` `.arr` · `.band` (`--cobalt` `--floor`) `.wrap` · `.join` `.field` · `.panel` `.pad` `.soon`.
JS exports: `pieceCard(product, { sizes })`, `addToCart(product, button)`, `openCart(from)`, `closePanels()`, `makeFloor(root, { map, label, onClick, onLayout })`.

## Shop page and product page (plan)
- **Shop**: the whole page is the floor. The three filters (Originals, Prints, Goods) sit in the pad above the map; choosing one sweeps the other prints off the edges and regroups what is left. "Originals from $111" and the shipping line are set on the floor like the headline. A "List" switch in the pad lays the same pieces out as a straight grid of `pieceCard`s for anyone who wants to scan, and that grid is the no-script and reduced-motion view. Prints and Goods, empty for now: a bare patch of floor with one line of type.
- **Product**: the page a chosen print grows into. The piece whole and uncropped on the floor at left (arriving by the piece transition), its facts on paper at right: title, medium, dimensions, year, price, story, "Original, 1 of 1", shipping line, Add to cart. Pressing the piece glides in to the 2400 file, and dragging then travels over the piece itself, the same engine one level down. Its framed photos lie beside it as smaller prints; "More from the floor" is a patch like Home's.
