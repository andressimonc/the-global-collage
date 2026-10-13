# Option 6 — Inside the Piece: the system

**The idea.** Every page is a sharp paper page floating inside one of her collages: the artwork fills the screen behind, enlarged and fixed, a different piece for each stretch of the page, and figures cut out of that same piece stand on the page's edges. The page slides over the worlds as you scroll, so the next world arrives under the same page.

Built reference: `public/option-6/index.html`, `css/site.css`, `js/site.js`. Start every page from `template.html` (head, logo, tab, footer, menu, cart are in it). Copy component markup from Home; never restyle a shared class. Page-only rules go in your own `css/<page>.css`, linked after `site.css`; page-only script goes in a module at the end of `<body>` that imports from `./js/site.js`.

## Colour (tokens in `:root`)
| Token | Value | Allowed for |
|---|---|---|
| `--paper` | `#EFEDEA` | every leaf (the page), the menu and cart sheets. Flat: no texture, no shadow on leaves |
| `--paper-hi` | `#F9F8F5` | form fields and the letter only |
| `--cobalt` | `#122FAB` (`--cobalt-deep #0B2082` on hover and inside the envelope) | ALL type on paper, buttons, the tab, `.leaf--cobalt` (one per page at most), the envelope |
| `--ink` | `#231F20` | the footer leaf, figure shadows, the scrim behind a sheet. Never type on paper |
| `--orange` | `#FF5630` | signals only: focus ring, cart count, current-page dot, Sold dot, error dot and border, `.needs-content`. Never text, never a fill behind text |
Colour otherwise comes from her work: the world behind and the pieces on the page. Green, mat green and marble blue are not used.

## Type (families from `../shared/fonts/fonts.css`; `--u` = 1% of the page's width, so type follows the page)
| Class | Family / weight | Size | Line / tracking |
|---|---|---|---|
| `.display` (Home h1) | Neco 600 | `clamp(2.75rem, 10.6u, 7.5rem)` | .93 / -.03em. `.display__line` spans = one line each from 720px |
| `.display.display--page` (inner h1) | Neco 600 | `clamp(2.6rem, 8.2u, 5.9rem)` | same. A long h1 (Shop's intro line) uses `.h2` instead |
| `.h2` | Neco 600 | `clamp(2.05rem, 5.2u, 3.9rem)` | 1 / -.022em |
| `.h3` | Neco 600 | `clamp(1.45rem, 2.8u, 2.05rem)` | 1.08 / -.012em |
| `.voice` (her voice: lead lines, statement, story) | Neco 400 | `clamp(1.28rem, 2.25u, 1.7rem)` | 1.3 |
| `.lede` | TT Interphases 400 | `clamp(1.0625rem, 1.65u, 1.25rem)` | 1.5, max 34em |
| body, buttons | TT Interphases 400 / 600 | 1.0625rem / 1rem | 1.55 / 1.2 |
| `.label`, `.soon`, `.piece__mark` | TT Interphases Mono 500, caps | .72 / .68 / .66rem | .14em. One per block at most |
Neco is never italic. No width-stretched sans (that is option 4). Everything is square-cornered and unrotated, except the tab's two round corners.

## Grid and spacing
`.page`: `--pw = min(1120px, 100vw - 2 * --side)`, centred; `--side` (least world beside it) = `clamp(12px, 8vw - 22px, 120px)`; `--edge` = the world actually showing each side. `.leaf` padding `--pad = clamp(20px, 6u, 68px)`. Inside a leaf: `.split` (12 columns, children `style="--span:7"`, one column under 720px), `.stack` (vertical rhythm 14 to 26px), `.head` (h2 left, link right, one baseline). Headline to the first thing under it: 16 to 40px. Leaves in consecutive scenes touch (one continuous page); a `.window` (170 to 290px, `--win` to change) is the only gap, and it always shows the world with a figure in it. No section is a screen tall for one thing.

## Moving around (no bar anywhere)
- **Logo** alone, top left of the first band (`.mast`), scrolls away. Home link.
- **The tab** (`nav.tab`): one small cobalt tab, planet icon + "Menu" | "Cart" + count. From 720px it sits on the first leaf's top edge (rounded on top), rides up with the page, then hangs from the top of the screen at the page's right (rounded below) and follows you down. Under 720px it is fixed bottom centre, 58px tall, for the thumb.
- **Menu** (`dialog#menu.sheet.menu`): a second paper page slides over from the right (660px; full screen on a phone, with the world as a strip on top). Seven pages in Neco, `clamp(2.3rem, 8.4svh, 5rem)`; current page has the orange dot; the four unbuilt ones are `span.menu__wait` + `.soon`, not links. Beside the sheet the page's own world wipes in, and the pointer (or focus) on another name slides that page's artwork in over it. "Close" is a tab in the same place the tab was. Modal `<dialog>`: focus is trapped, Escape closes, focus returns to the opener.
- **Cart** (`dialog#cart.sheet.cart`): same sheet, 470px. Without script the Menu control is a link to the footer navigation and the cart control is hidden.

## Motion (one curve `cubic-bezier(.16,1,.3,1)`; only transform, translate, scale, opacity, clip-path move)
- **First arrival** (a visit from outside the site, or a reload; `html.is-arriving` for 2.8s): the first scene's world (`data-shatter`) glides together from five cut fragments (1.25s, .06s apart) while the first leaf and the tab rise 30vh into it (1.2s); h1 words rise one by one (kit, `data-words`); the rest of the first leaf follows .09s apart. Home also walks the tiger in from the left and slides the woman in from the right.
- **Page to page**: view transition; the next page wipes in from the right over the old one, which shifts 9vw left (.9s), the same move as the menu. Shop card to product: the kit's piece flight.
- **Scroll**: the world is fixed and drifts 6lvh against the scroll (`--v`), so page and world move at different speeds and each scene's world is uncovered under the same page; `.view` pictures slide inside their openings; the middle column of `.pieces--wall` drifts; the envelope opens with `--p`. Arrivals use the kit: `data-reveal` (34px, 1.15s), `data-reveal="left|right"` for figures (`style="--reveal-dist:90px"`), `data-reveal="clip"` for views, `data-stagger="80"`.
- **Pointer**: world leans 14px away, figures lean with it (`--d` depth), a piece lifts 8px over a soft shadow and **its artwork slides in as the world behind the page**, button words slide out and in, the tab and buttons pull (kit `magnetic`), menu rows step 16px. Phone: the same things answer scroll.
- Reduced motion or no script: everything is there and still; the envelope is open.

## Signature components, exactly
1. **Scene + world** `section.scene[data-scroll][style="--avg:#hex"] > .scene__world > img.world[style="--pos:50% 30%"]` then `.page`. `.scene__world` is absolute, fills the scene and clips (`clip-path: inset(0)`); `.world` is `position: fixed`, `100% x 100lvh`, `object-fit: cover`, `scale: var(--zoom, 1.14)` about `--origin`. So: **nothing that wraps a scene may have a transform, filter or container-type.** `--avg` = the picture's `avg` from the catalogue (shows while it loads). Use the 1600 file (`srcset` 960w, 1600w), `sizes="(max-aspect-ratio: 3/4) 170vw, 100vw"` for upright pieces, `"(max-aspect-ratio: 3/4) 170vh, 115vw"` for wide photos; `loading="lazy"` except the first scene. If the world's own figure shows beside its cut-out, move it out of sight with `--pos`, `--zoom`, `--origin` (see `.work .world` in the phone block). site.js rounds every scene to a whole pixel so two leaves never show a hairline between them.
2. **Leaf** `.leaf` (+ `--cobalt`, `--ink`): the paper. A scene is usually `[.window] + .leaf`.
3. **Window + figure** `.window > figure.cut > img`: the figure is absolute; give it `right/left`, `bottom`, `height` (% of the window) and `aspect-ratio` in your page CSS. `.cut--behind` (z 1) tucks a flat-cut bottom under the leaf's top edge (`bottom: -34%`); a figure with real feet stands in front (`bottom: -3px`, `--dv: 0`). `--d` lean, `--dv` vertical lean, `--par` scroll drift. Only cut-outs of the scene's own artwork, or her photo cut-outs.
4. **Notch** (Home about): the page grid leaves a cell empty (`.about__hole`), so the world bites into the page; the figure stands in it on a paper sill and overlaps the leaf.
5. **View** `span.view[data-scroll][data-reveal="clip"] > img[style="--pos:.."]`: a window cut in a leaf; the picture is 120% of the opening's height and slides 8% with `--v`. Give `.view` a height or `aspect-ratio`. Photographs and details only, never a piece for sale.
6. **Piece card** from `pieceCard()`: the whole piece at its true ratio (no box, no crop), rows aligned on their bottoms (`.pieces { align-items: end }`); title + price on one line; year, `Original, 1 of 1`, and a 44px `Add` control. Sold: orange dot + "Sold", no control.
7. **Envelope** `.envelope` (Home): back, open flap, `.envelope__slot > .letter` (the form), front pocket (clip-path V), closed flap, all rectangles and triangles in cobalt; `--o` (from the scene's `--p`) folds the flap away and lets the letter rise; a quill from The Art of Art rests on the corner.

## Component index
| Class / helper | Markup |
|---|---|
| `.scene` `.scene__world` `.world` | see 1; `data-shatter` on the first scene's `.scene__world` |
| `.page` `.leaf` `.leaf--cobalt` `.leaf--ink` `.window` | `<div class="page"><div class="window"></div><div class="leaf">…</div></div>` |
| `.cut` `.cut--behind` | `<figure class="cut cut--behind my-figure" data-reveal style="--reveal-dist:120px"><img …alt=""></figure>` |
| `.opening__window` `.opening__leaf` | inner-page first scene, in `template.html` (band 130 to 220px; h1 + `.voice` + optional `.actions`) |
| `.display` `.display--page` `.h2` `.h3` `.voice` `.lede` `.label` `.soon` | `<h1 class="display display--page" data-words>The Artist</h1>` |
| `.statement` `.signature` `.prose` | `<div class="statement voice"><p>…</p><p class="signature">— Camila Castillo, The Global Collage</p></div>`; `.prose` = paragraphs at 36em |
| `.btn` (+ `--paper` on cobalt/ink, `--line`, `--full`) `.link` `.actions` | `<p class="actions"><a class="btn" href="shop.html">Explore the collection</a> <a class="link" href="…">…</a></p>` plain text inside; site.js adds the sliding words |
| `.head` `.split` `.stack` `.facts` `.price` `.cue` | `<dl class="facts"><dt>Year</dt><dd>2025</dd></dl>` |
| `.view` | see 5 |
| `.pieces` (+ `--wall` staggered columns, `--strip` sideways on a phone) `.piece…` | `<div class="pieces" data-stagger="80"></div>` then `renderPieces(box, products)`; or `data-featured="handle,handle"` and site.js fills it |
| `.filters` | `<nav class="filters" aria-label="Shop sections"><a href="shop.html?type=originals" aria-current="true">Originals</a>…</nav>` |
| `.empty` `.empty__note` | `<div class="empty"><span class="view" data-scroll aria-hidden="true"><img …></span><div class="empty__note"><h3 class="h3">…</h3><a class="link" href="…">…</a></div></div>` |
| `.needs-content` | `<p class="needs-content">Camila's note about this piece …</p>` dashed orange, mono, loud |
| `.fields` `.field` `.join` (+ `--dark`) `.form-error` `.form-status` | `<label class="field">Name <input name="name" required></label>`; newsletter: `<form class="join" data-newsletter>` (wired by site.js) |
| `.piece__sold` | `<span class="piece__sold">Sold</span>` anywhere a Sold mark is needed |
| `dialog.sheet` `.sheet__page` `.sheet__close` `.look` | `<button class="link" data-sheet-open="look">Look closely</button>` … `<dialog class="sheet look" id="look"><div class="sheet__page"><button class="sheet__close" type="button" data-close>Close</button><img></div></dialog>` |
| `data-menu-open` `data-cart-open` `data-cart-count` | in the tab; any other element may carry them |
| `pieceCard(product, { sizes })` | returns `article.piece` (link `a.piece__link[data-piece]`, add control `.piece__add`) |
| `renderPieces(box, products, { sizes })` | fills a `.pieces` box, reveals the cards, marks the ones in the cart, wires the world swap |
| `openCart(opener)` `openSheet(dialog, opener)` `closeSheet(dialog)` | after `cart.add(product)`: `.then(() => openCart(button))` |
| `guestWorld(scene, image or null)` | slides a shop image in as that scene's world; `null` puts the scene's own back |
| `shatter(worldEl)` | the fragment arrival on a `.scene__world` whose picture you set by script |
| `dress(root)` | call after adding `.btn` / `.link` by script |
| `cutFor(handle)` | `{ src, srcset, width, height }` of the cut-out lifted from that piece, or `null` (13 pieces have one) |
site.js also calls `mountSampleNote()` when the page has `[data-featured]` or `<body data-shop>`.

## about.html (COPY page 2; menu: `aria-current` on About, `is-on` on `data-world="about"`)
1. **Opening**, world `collage-photos/bw-94` (`data-shatter`). Leaf `.split`: `--span:7` h1 "The Artist" (`.display--page`, `data-words`) + lead line in `.voice`; `--span:5` a `.view` (ratio 4/5, `--pos:48% 29%`) of `about/portrait/cami-754`. Phone: words, then the portrait full width.
2. **Artist statement**, world `shop/originals/reflections-of-me`: `.window` with `cutouts/snake-dress` (`.cut--behind`, right 10%, height 130%, bottom -36%, `data-reveal`), then `.leaf--cobalt`: the fixed block as `.statement.voice` (one block, word for word) + `.signature`.
3. **Expanded story**, world `about/process/dscf5885-1` (`--pos:60% 55%`, keeps the car logo out): leaf `.split`: `--span:7` the story as `.prose.lede`; `--span:5` two `.view`s stacked (ratio 3/2): `about/process/dscf5889`, `about/process/dscf8181`. Phone: story, then the two views side by side.
4. **Selected exhibitions**, world `exhibition/tripping-animals-2025/img-8899`: `.window` (no figure), leaf `.stack`: h2 "Selected exhibitions" (`.h2`), body in `.lede`, `.btn` "See the full exhibition history" to `exhibition.html`.
5. **Soft close**, world `shop/originals/zenda-beach`: `.window` 170px, leaf: the line as `.h2` with both buttons beside it (`.actions`: `.btn` Shop, `.btn--line` Commissions), then `<div class="pieces pieces--strip" data-featured="senor-tigre,the-art-of-art,let-out" data-stagger="80">`. Then the footer.

## shop.html (COPY page 3; `<body data-shop>`; menu current = Shop)
One scene, world `shop/originals/lucky-pleasures` (`data-shatter`), so the pointer on any card swaps the world. `.opening__window` with `cutouts/lips` in front, top right (width 26u, bottom -18%, `--d:1.4`). Leaf: h1 = the intro line in `.h2` (`data-words`); a `.head` row: `.filters` (Originals · Prints · Goods, links to `shop.html?type=…`, `aria-current="true"` on the one showing; default originals) and `.cue` "Originals from $111"; the shipping line under it; then `<div class="pieces" data-stagger="80">` (3 columns, 2 on a phone, not a strip). Script: `const type = new URLSearchParams(location.search).get('type') || 'originals'; const list = await getProducts({ type }); list.length ? renderPieces(box, list, { sizes: '(min-width: 720px) 30vw, 46vw' }) : show the .empty`. Empty state for Prints and Goods: `.empty` with a `.view` of `collage-photos/bw-119`, note "No prints yet." / "No goods yet." + `.link` "See the originals" (list the wording in DECISIONS). Low-res pieces are already capped by `pieceCard`. Check `?sold=curiosity`.

## product.html (`product.html?handle=…`; `<body data-shop>`; head: the kit's `pieceHero()` block, then site.js)
One scene whose world **is the piece**: `<div class="scene__world"><img class="world" id="piece-world" alt="" style="--zoom:1.5"></div>` (no `data-shatter`). Script: `const p = await getProduct(handle)`; set the scene's `--avg` to `image.avg`; world = `imageAttrs(p.images[0], '100vw')`, or for a `lowres` piece its framed photo (`p.images.find(i => i.framed)`), or nothing (the avg colour); then `if (document.documentElement.classList.contains('is-arriving')) shatter(worldEl)`.
- `.opening__window`; when `cutFor(handle)` is not null, that figure as `.cut.cut--behind` at the right (height 150%, bottom -50%).
- Leaf `.split`: `--span:7` the piece whole, `<img id="piece-hero" alt="">` inside `<button data-sheet-open="look">` (`max-height: 84svh; width: auto`, true ratio, never cropped; `Object.assign(img, imageAttrs(p.images[0], '(min-width: 720px) 55vw, 92vw'))`; low-res: `max-width` = file width, no close look). `--span:5`, `position: sticky; top: 76px`: h1 title (`.h2`), `.facts` (Medium, Dimensions, Year; a null value is a `.needs-content` line), `.label` badge, `.price` (`formatPrice`), `.btn.btn--full` "Add to cart" (`cart.add(p).then(() => openCart(btn))`, errors in a `.form-status[data-state="error"]`); sold: `.piece__sold`, no button; the shipping line; `.link` "Look closely".
- Under the split: the story in `.voice` (`p.story`, else `STORY_PLACEHOLDER` in `.needs-content`); the framed photo, if any, as a `.view` (ratio 3/2); then h2 "More originals" + `.pieces.pieces--strip` of three others (`renderPieces`).
- Close look: `dialog.sheet.look#look`, `img.src = zoomSrc(p.images[0])` at its natural size, scrolls both ways.
- No such handle: `.empty__note` "This piece is not in the shop." + `.link` to `shop.html`. Phone: piece first at full width, the buy block under it, Add button full width.
