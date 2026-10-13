# Option 4 — "The Poster" (design system; build from this file and `public/option-4/template.html`)

**The idea.** The site is a living tour poster: every screen is one flat-colour poster carrying one giant condensed line, her artworks in full colour, and her own photo cut-outs (Camila, her hands, the mat, loose scraps) in black and white in front of and behind the type. Content is sharp rectangles; controls (dock, sheets, buttons) are rounded like an app, and there is no top bar.

## Colour (tokens in `css/site.css`)
| Token | Value | Allowed for |
|---|---|---|
| `--paper` | `#EFEDEA` | default poster ground; type on cobalt, orange (giant only) and ink; cart sheet |
| `--cobalt` | `#122FAB` | every sentence on paper; giant lines on paper; a poster ground; the menu sheet |
| `--orange` | `#FF5630` | giant lines on paper; a poster ground; primary button; "soon" marks. Never small text on paper |
| `--ink` | `#231F20` | dock, footer, type on orange, what shows behind a poster as it steps back |
| `--paper-2` | `#E2DFD9` | wells only (cart thumbnail, image loading) |
Posters: `.poster` (paper, cobalt type, orange giant) · `.poster--orange` (ink type, paper giant) · `.poster--cobalt` (paper type and giant). Never two of the same ground in a row; a colour poster is always followed by paper. Override the giant colour with `--big`. No shadows, gradients, textures or outlines-as-decoration. Photos and cut-outs of her/her table take `.cut-bw`; an artwork is never filtered.

## Type
- **Poster voice** `"TT Interphases"` 900, `font-stretch: 75%`, capitals, `letter-spacing: -.02em`, `line-height: .78`. `.mega` sized by `--mega` in vw so the line runs edge to edge: `--mega = 96 / width`, width in em: FRAGMENTS. 5.70 · THE WORK 4.62 · WAYS TO OWN IT 7.41 · STAY IN TOUCH 6.68 · CAMILA 3.48 · CASTILLO 4.21 · THE ARTIST 5.00 · SHOP 2.41 · THE DEEPER 5.1 (about .6 per letter, .28 per space). Under 820px keep each line under 93vw.
- **Row type** `.row-type`: same face, `clamp(1.75rem, 4.6vw, 4.25rem)/.9` (doorways, tabular rows). Cards `.piece__title` `clamp(1.2rem, .9rem + .9vw, 1.75rem)`.
- **Second voice** Neco, for sentences: `.lead` 500 `clamp(1.125rem, .9rem + 1.05vw, 1.75rem)/1.3`; `.prose` 450 `clamp(1.125rem, 1rem + .45vw, 1.375rem)/1.5`, max 36em; `.statement` 500 `clamp(1.4rem, 1rem + 1.9vw, 2.5rem)/1.22`, max 30em.
- **UI** TT Interphases 800, `font-stretch: 84%`, capitals, tracking .04–.07em: buttons 1rem, `.label` .8125rem. Body default 400 1.0625rem/1.5. No mono, no italics.

## Grid and spacing
`--gutter: clamp(16px, 3.2vw, 48px)`; `.wrap` = `min(100% - 2 gutters, 1400px)`. Giant lines ignore the wrap and start 1.6vw from the edge. Poster padding `clamp(2.75rem, 5vw, 5rem)`; first content sits within 3rem of its giant line, and pictures overlap the line's feet (negative margin 4–12vw). One breakpoint: **under 820px** everything stacks to one column, buttons go full width, the dock spans the thumb zone.

## Moving around (no top bar)
- **Logo** `.logo`: alone, fixed top-left, black/white pair swapped by the ground under it (`data-tone` on each poster), shrinks to 58% after 60px, hidden over the footer.
- **Dock** `.dock`: fixed bottom-centre ink capsule with a paper ring: `Menu` · `Shop` (orange, the primary action) · `Cart` + count. Phone: same dock, 48px targets, full thumb width. The open sheet's button reads `Close`.
- **Menu** `#menu.sheet.menu`: full-screen cobalt sheet sliding up from the bottom under the dock; seven giant rows in menu order; the current page has an orange dot; unbuilt pages are `<span class="menu__row is-soon">` with `<span class="soon">soon</span>`, not links. A picture per row (`.menu__pics img[data-pic]`) wipes in from the right for the row under the pointer or focus. Phone: rows only, current picture top-right.
- **Cart** `#cart.sheet.cart`: a paper sheet (28px radius, max 520px) rising out of the dock over a dimmer; phone the same, full width.
- Keyboard: focus moves into the open sheet, Tab cycles sheet + dock, Escape closes and returns focus; the rest of the page is `inert`.

## Motion (one curve `cubic-bezier(.16,1,.3,1)`; only transform, opacity, clip-path)
- **Page to page**: the old page steps back (scale .93, fades to 35%) while the next rises from the bottom over it (.9s); dock and logo stay put (`view-transition-name`). A piece link (`a[data-piece]`) carries its picture across (kit).
- **Load-in, first screen**: `[data-enter="up|down|left|right"]` layers slide in from different edges (1.25–1.6s, set `--enter-delay`); the h1's three bands arrive from left, right, left at 1.5 / 1.75 / 2s and lock into the word; the small line rises word by word (`data-words`); the dock rises last. Skipped for dock and logo when arriving by a page transition.
- **Scroll**: (1) the stack: a poster scrolls until its last half-screen is left, then holds, shrinks to 94% and darkens while the next poster rises over it; (2) giant lines travel sideways (`.mega__line`, `--drift`, alternate lines opposite); (3) the hero's bands shear apart and its layers leave by the edge they came from (`.layer` with `--sx`/`--sy`); (4) the film strip runs across; (5) everything below the first screen arrives with the kit's `data-reveal` / `data-words` + `data-reveal`, staggers 70–80ms.
- **Pointer**: `.layer` leans by `--d` px; dock buttons and `[data-pull]` buttons are magnetic; buttons, doorway rows fill from the bottom (.5s); a piece lifts 10px; link underline wipes; menu rows shift and dim their neighbours. Phone: the same layers answer scroll.
- The names marquee is the only thing that runs by itself: 46s a loop, only while on screen, stops under the pointer. Reduced motion or no JavaScript: everything is simply there, the marquee is a wrapped list, the stack is a normal page.

## Signature components (how each is made)
1. **Bands**: `<span class="bands" data-t="word"><span class="band">word</span></span>`: the real text is clipped to the top third, `::before`/`::after` repeat it (`attr(data-t)`) clipped to the middle and bottom thirds; each band has its own `translate` (`--b1..3`). The h1 keeps one copy of the text; give it `aria-label`.
2. **Type sandwich**: giant line `z-index: 1`, picture 2 (overlapping the line's feet), cut-out 4. A cut-out with a flat cut side always sits on a poster edge (hands from the top, Camila on the bottom).
3. **Stack**: `<main class="stack">` > `.poster` siblings; JS writes `--h` (height) and `--cover` (0→1). The last poster and `.proof` do not hold.
4. **Poster rows**: full-width rows between 2px rules (`.doors > li > a.door`, `.services__list`), name in row type, Neco line beside it, arrow right.
5. **Film strip** `.film`: a `max-content` flex row of 3:2 `.cut-bw` photos, wider than the screen, translated by `--v`.

## Component index
| Class / helper | Use | Markup |
|---|---|---|
| `.poster[--orange|--cobalt]` | a section | `<section class="poster poster--orange" data-tone="orange" data-scroll>` |
| `.mega` + `.mega__line` | giant line | `<h2 class="mega" style="--mega:20vw" data-words data-reveal><span class="mega__line">The Work</span></h2>` |
| `.bands` | cut word | see above; shears and loads in inside `.hero__word` and `.page-top__title` |
| `.page-top`, `__title`, `__intro` | inner-page opening | `template.html` |
| `.lead` `.prose` `.statement` `.statement__sig` `.label` `.row-type` | text | `<p class="statement">…<span class="statement__sig">— Camila Castillo, The Global Collage</span></p>` |
| `.btn` (`--ink` on orange, `--paper` on cobalt, `--cobalt`, `--block`), `.link`, `.arr` | actions | `<a class="btn" href="shop.html" data-pull>Explore the collection <span class="arr" aria-hidden="true">→</span></a>` |
| `.field`, `.form`, `.join`, `.form-error`, `.form-status` | forms | `<form class="join" data-newsletter><label class="field"><span class="label">Email</span><input type="email" name="email" required></label><button class="btn" type="submit">Join</button></form>` (`data-newsletter` is wired by site.js; `.form` is a 2-column grid, `.field--wide` spans it) |
| `.pieces` + `.piece` | shop grid, justified rows | `<ul class="pieces wrap" id="grid"></ul>` then `renderPieces(grid, products, { sizes })` |
| `.filters` | Originals · Prints · Goods | `<nav class="filters" aria-label="Shop sections"><a href="shop.html?type=originals" aria-current="true">Originals</a>…</nav>` |
| `.empty`, `.empty__big` | nothing here yet | `<div class="empty"><p class="empty__big">Prints</p><p class="lead">…</p></div>` |
| `.needs-content` | loud placeholder | `<p class="needs-content">Camila's note about this piece…</p>` |
| `.cut-bw`, `.layer`, `.film`, `.soon`, `.sr-only` | helpers | `<img class="layer cut-bw" style="--d:20px; --sy:-.3" alt="">` |
| `pieceCard(product, { sizes })` | one card: link (`data-piece`), whole piece, title, year, mark, price, `.piece__add`, or `.piece__sold` | `li.append(pieceCard(product))` |
| `renderPieces(list, products, { sizes })` | fills a `.pieces` list (rows of 2 then 4; phone 1 then 2), caps low-res pieces, arms reveals | |
| `addToCart(product, button)` | add, open the cart, show a refusal in the cart | `btn.addEventListener('click', () => addToCart(product, btn))` |
| `openCart(from)`, `closeSheets()` | sheets | |
`js/site.js` also calls the kit's `init()`, wires `form[data-newsletter]`, fills `[data-featured] li[data-handle]`, paints `[data-cart-count]`, and calls `mountSampleNote()` whenever a price is drawn. Every page links `../shared/fonts/fonts.css`, `../shared/motion.css`, `css/site.css`, then `<script type="module" blocking="render" src="js/site.js">`.

## about.html
1. **Paper, `.page-top`**: h1 "The Artist" in bands (`--mega: 19vw`, orange). Portrait `about/portrait/cami-754` as a `.cut-bw` rectangle, right, 36vw wide, top overlapping the h1's feet (z 2), `data-enter="up"`; cut-out `cutouts/hands-cutting` `.cut-bw` hanging from the top edge at 60vw, 20vw wide (z 4, `--sy:-.5`). Left, under the h1: the lead line as `.lead` (max 20em). Phone: h1 22vw, portrait 78vw right-aligned over the h1's feet, lead below, no hands.
2. **Cobalt**: `<h2 class="label">Artist statement</h2>`, the statement as one `.statement` block with `.statement__sig`, columns 1–8; `cutouts/mat-angled` `.cut-bw` bottom-right, 30vw, running off the edge. Reveal: `data-reveal` on the block.
3. **Paper**: the expanded story as `.prose` (columns 1–7), then a `.film` of process shots, in this order: `about/process/dscf5889`, `dscf8189`, `dscf8196`, `dscf5885-1` (crop left quarter), `dscf8181`, `dscf8194`.
4. **Orange**: h2 "Selected Exhibitions" as two `.mega__line`s (`--mega: 15.5vw`), body as `.lead`, `.btn.btn--ink` "See the full exhibition history" → `exhibition.html`; right, `exhibition/tripping-animals-2025/img-8899` `.cut-bw`, 40vw, `data-reveal="clip"`, overlapping the second line.
5. **Paper (last, does not hold)**: the soft-close line as `.statement` in cobalt, `.btn` "Explore the collection" → `shop.html`, `.link` "Commission a piece" → `commissions.html`; beside it two pieces from the shop layer (`renderPieces` with `curiosity`, `reflections-of-me`).

## shop.html (page script `js/shop.js`)
1. **Paper, `.page-top`**: h1 "Shop" in bands (`--mega: 30vw`, left); to its right in the same row the intro line as `.lead`, "Originals from $111" as `.row-type`, and the shipping line as `.label`; under them `.filters` (`?type=originals|prints|goods`, default originals, `aria-current="true"` on the active one). All of it inside the first 60vw of height.
2. Same poster: `<ul class="pieces wrap">` filled by `renderPieces(list, await getProducts({ type }), { sizes: '(min-width: 820px) 45vw, 92vw' })`; the first row overlaps the h1's feet (`margin-top: -5vw`, z 2). Sold pieces (`&sold=<handle>` to preview) show `.piece__sold` and no add control. Prints and Goods: `.empty` with the section name as `.empty__big`, one plain line, a `.link` back to Originals, and `cutouts/mat-with-eyes` `.cut-bw` at the right.
3. **Cobalt (last)**: the shipping line as a travelling `.mega` (`--mega: 9vw`), `.btn.btn--paper` "Commission a piece" → `commissions.html`.

## product.html (page script `js/product.js`)
Head, exactly: `<link rel="expect" blocking="render" href="#piece-hero">`, then a render-blocking module `import { pieceHero } from '../shared/motion.js'; pieceHero();` **before** `js/site.js`.
1. **Paper**: behind everything, the title as an `aria-hidden` `.mega` line (`--mega: 22vw`, orange, travels with `--v`). Columns 1–7: `<img id="piece-hero">`, whole piece, `object-fit: contain`, `max-height: 86svh`, `position: sticky; top: 7svh`, in front of the line (the sandwich); pressing it opens a full-screen ink `.sheet` with the 2400 file (`zoomSrc`), dragged with the kit's `draggable` (no zoom when `lowres`, and cap the picture at its file width). Columns 8–12: h1 title in `.row-type` (wraps), then poster rows between 2px rules: Medium, Dimensions, Year; the price in `.row-type`; the story as `.prose`, or `STORY_PLACEHOLDER` as `.needs-content`; the badge as `.label`; the shipping line; `<button class="btn btn--block" data-add>Add to cart →</button>` → `addToCart(product, button)`. Sold: a `.piece__sold`-style "Sold" mark, no button. Unknown handle: `.empty`.
2. Extra photos (`images[1..]`, framed): a `.film` strip, in colour.
3. **Orange (last)**: giant "The Work" and four other available originals through `renderPieces`.
Phone: picture first at full width (not sticky), then the rows; the add button is full width, 56px.
