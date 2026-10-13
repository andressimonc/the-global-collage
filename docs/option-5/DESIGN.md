# Option 5 — "The Archive": the system

**The idea.** The site is a dark table of Camila's things, photographed at night and lit from the top left: her cut-outs lie around a centred paper-white title as real objects you can pick up, and her pieces are white-bordered prints with a caption beneath. Scrolling travels across the table (one cluster slides out by the edges as the next slides in), and the menu and the cart are things put down on the same table.

Built already: `public/option-5/css/site.css` (tokens, every shared component, Home's page-only rules), `js/site.js`, `index.html`, `template.html` (copy it for every new page). Reuse the classes; do not restyle per page. Page-only rules go at the very bottom of site.css under `/* PAGE ONLY (file.html) */`, as Home's do.

## Colour
| Token | Value | Allowed for |
|---|---|---|
| `--table` / `--table-lit` / `--table-far` | `#161314` / `#322c2d` / `#121011` | The ground. `--table` is the `html` background; the other two are the fixed lamp (`body::before`). Never a card or panel colour. |
| `--paper` | `#EFEDEA` | All type on the table; the fill of a paper sheet (`.sheet`, `.cart`). |
| `--print` | `#F8F6F2` | The white border of a print. Nothing else. |
| `--ink` | `#231F20` | Type on paper and on orange. |
| `--orange` | `#FF5630` | The one signal, meaning "act": primary `.btn`, the add control on hover and when in the cart, focus rings, field errors, the dashed edge of `.needs-content`. Never body text on paper, never decoration. |
| `--muted` | paper at 66% | Second voice on the table: years, "Original, 1 of 1", "soon", notes. |
All other colour comes from her pictures. No gradients except the lamp, no glow, no blur, no glass, no tint over an artwork. Components read `--fg --fg-2 --rule --focus --warn`; `.sheet` and `.cart` swap them to ink, so anything placed on paper is already right.

## Type (families from `../shared/fonts/fonts.css`)
- `"Neco"` 400 (captions 500), never italic: `.t-hero` clamp(2.9rem, 13.2vw, 4.5rem)/.93 under 700px, clamp(4.4rem, 8.6vw, 9rem)/.9 above (the page h1) · `.t-1` clamp(2.375rem, 5.4vw, 5.25rem)/.96 (section h2) · `.t-2` clamp(1.625rem, 3vw, 2.75rem)/1.04 · `.t-3` clamp(1.25rem, 1.8vw, 1.625rem)/1.15 · `.lead` clamp(1.25rem, 1.9vw, 1.75rem)/1.34 (her own sentences). Tracking −.018em on headings. The corner words, print captions, door names, cart title are Neco too.
- `"TT Interphases"` 400 body 1.0625rem/1.6; 600 for buttons, links, labels, prices (tabular numerals); `.small` .875rem. Stretch stays 100%.
- `"TT Interphases Mono"` only inside `.needs-content`.
- Pages whose copy gives no H1 (Shop) use the menu word as the h1 and the intro line as `.opening__intro.lead`.

## Grid and spacing
`.wrap` = min(100% − 2 × `--gutter`, 1240px); `--gutter` clamp(20px, 8.5vw, 150px), deliberately wide so the fixed logo sits in the margin and never on the column. `.grid` = 12 columns, `--gap` clamp(16px, 2.4vw, 36px). Every section after the opening is `.sec` (padding `--sec`/2 top and bottom, `--sec` = clamp(72px, 9vw, 132px)). A headline to the first thing under it: `--under` clamp(20px, 2.6vw, 40px), never more. Words and captions stay straight; only objects and prints tilt (objects ±3 to 14deg, prints ±1 to 3deg, alternate the sign).

## Moving around (no bar anywhere)
`<nav class="corners">` holds four fixed plain words, no background: logo top left (home), **Shop** top right, **Menu** bottom left, **Cart** bottom right with its count. The three words use `mix-blend-mode: difference`, so they stay readable over a white print. Under 700px the logo scrolls away with the page and the three words sit along the bottom edge (Menu · Shop · Cart), 48px targets, above the safe area.
**Menu** = `<dialog id="menu">`, a native modal (focus trapped, Escape closes, focus returns to Menu): the page fades, every `.obj` slides out by its own edge, and seven captioned prints arrive from the edges, staggered .06s (4 + 3 on desktop, 2 columns on a phone). Built pages are links; Services, Exhibition, Commissions, Contact are a dimmed print plus "soon" and are not links (swap the `div.mprint.is-soon` for an `a.mprint` when a page exists). Close sits where Menu was.
**Cart** = `<dialog id="cart">`, a paper sheet: slides in from the right (480px), on a phone up from the bottom (88dvh). site.js draws it. Moving `aria-current="page"`: the corner link, the menu print and the footer link.

## Motion language (one curve, `--ease` = cubic-bezier(.16,1,.3,1); only transform, opacity, clip-path)
- **Page to page**: the old table fades and slides 7vw left in .5s, the new one slides in from 9vw right in 1.1s; the four corners hold still (they carry `view-transition-name`). A card's picture flies to the product page (kit `pieceTransition`, automatic for `a[data-piece]`).
- **First screen**: the title rises word by word (`data-words`); every `.obj` in an `.opening` slides in from its exit point, .07s apart by `--i`, fade .7s, glide 1.3s; `.opening__intro`, `.opening__actions` and anything with `.arrive` (set `--wait`) rise after them.
- **Scroll**: a `[data-table][data-scroll]` section gets `--v` from the kit and `--e` (0 = at rest). Each `.obj` moves by `--e × (--ox, --oy)` and turns a little, so a cluster slides in from the edges, rests while the section is mid-screen, and leaves the same way; nearer objects (`--d`) also drift faster. The opening's words sink and fade as its objects leave. Cards in `.pieces` lag by column (`--lag`). Home's exhibition names travel sideways on a native scroll timeline. Text below the first screen uses `data-reveal` (36px, 1.2s) and headings `data-words data-reveal`; lists stagger with `data-stagger="70"`.
- **Pointer**: every object leans against the pointer by its depth, the lamp shifts, prints straighten and lift 10px with a longer shadow (.7s), buttons rise 3px, `[data-pull]` controls lean toward the pointer, any object can be dragged (it grows 4% while held). On a phone the same objects answer scroll, and a sideways drag moves them.
- Reduced motion or no JavaScript: everything is simply in place. Never hide anything in CSS except through the kit's `[data-armed]:not(.is-in)`.

## Signature components
1. **Object** `.obj` inside `.objs` inside a `[data-table][data-scroll]` section. An absolutely placed cut-out from `../shared/img/cutouts/` (transparent WebP, no border). All placement is inline custom properties: `--x --y` (percent of the section), `--w` (vw), `--r` (tilt), `--d` (depth .5 far to 1.7 near: sets lean and shadow length), `--ox --oy` (where it comes from and leaves to, vw/vh, pointing at the nearest edge), `--i` (order of arrival); phone overrides `--xm --ym --wm`; `.obj--desk` hides it on a phone. Shadow = two `drop-shadow`s falling down-right. Default is behind the words; `.obj--front` puts it in front (the type sandwich) and must never sit over a link, button or field. `.obj--flow` keeps it in the layout (a figure in a grid cell). A print can be an object: `figure.obj > span.print > img` (its own box shadow is used). Objects are decoration: `alt=""`, wrapper `aria-hidden="true"`; if the picture is content (Home's Local Collage frame) leave it outside `.objs` and give it alt text.
2. **Print** `.print`: padding `--b` (clamp 7px, .9vw, 13px) of `--print`, `--shadow`, `rotate: var(--r)`. `.print--crop` crops to `--ratio` (default 4/3) at `--pos`. Caption beneath, on the table: `.cap` (Neco 500) with an optional `<small>`. Photos shot on black (`shop/framed/*`) can instead take `.onblack`, which melts their edge into the table.
3. **Piece card** `.piece`, made only by `pieceCard()`: the whole piece uncropped in a `.print`, title and year, then "Original, 1 of 1", the price and the add control; sold = a solid paper "Sold" label, no price, no button. A low-res piece is capped at its file width (`--cap`).
4. **Paper sheet** `.sheet`: paper fill, ink type, `--shadow`, slight `--r`. The artist statement is `.sheet > .statement` with `.statement__sign`. The cart is the same idea.
5. **Corner word** `.corner` (see Moving around). 6. **The lamp**: `body::before`, fixed, one radial falloff from the top left.

## Component index
| Class / helper | Markup |
|---|---|
| `.opening` (+`.opening--tall` = full screen) | `<section class="opening" data-table data-scroll><div class="opening__copy"><h1 class="t-hero" data-words>…</h1><p class="opening__intro lead">…</p><p class="opening__actions">…</p></div><div class="objs" aria-hidden="true">…</div></section>` |
| `.obj` | `<div class="obj obj--front" style="--x:4%;--y:44%;--w:15vw;--r:-7deg;--d:1.2;--ox:-40vw;--oy:6vh;--i:0;--xm:-6%;--ym:66%;--wm:30vw"><img src="../shared/img/cutouts/lips-480.webp" srcset="… 480w, … 960w" sizes="(max-width: 699px) 30vw, 15vw" width="960" height="835" alt=""></div>` |
| `.sec`, `.wrap`, `.grid`, `.stack` | `<section class="sec" data-table data-scroll><div class="wrap">…</div></section>`; `--still` on the section (default .45; .8 for one taller than two screens) sets how long its objects rest |
| `.t-hero .t-1 .t-2 .t-3 .lead .small .muted .prose` | text; `.prose` caps long text at 34em |
| `.btn` · `.btn--line` · `.btn--plain` · `.btn--wide` | `<a class="btn" href="shop.html" data-pull>Explore the collection</a>` orange, arrow added by CSS; `--line` = outlined secondary; `--plain` = no arrow (Join, Checkout). One orange `.btn` per screen. |
| `.link` · `.link--big` · `.actions` | `<a class="link" href="about.html">Read my story</a>` |
| `.print` `.print--crop` `.cap` `.onblack` | `<figure><span class="print" style="--r:-2deg"><img …></span><figcaption class="cap">Title <small>2025</small></figcaption></figure>` |
| `.pieces` · `.pieces--shop` · `.pieces--laid` | `<div class="pieces pieces--shop" data-stagger="70"></div>` 2 columns, 3 from 820px, `--shop` 4 from 1280px; `--laid` is Home's three-size layout and phone flick row |
| `.doors` `.door` | `<ul class="doors"><li><a class="door" href="…"><span class="print print--crop door__pic"><img …></span><span class="door__name">Originals</span><span class="door__note">…</span><span class="door__go" aria-hidden="true">→</span></a></li></ul>` (rows for lists of ways, services, shows) |
| `.filters` `.cue` | `<nav class="filters" aria-label="Shop sections"><a href="shop.html?type=originals" aria-current="true">Originals</a>…</nav>` `<p class="cue">Originals from $111</p>` |
| `.empty` | `<div class="empty"><span class="empty__print"></span><h2 class="t-2">…</h2><p class="empty__text">…</p></div>` |
| `.needs-content` | `<div class="needs-content">Dimensions — coming from Camila</div>` dashed orange, mono capitals |
| `.field` `.field__label` `.input` `.form` | `<form class="form"><label class="field"><span class="field__label">Name</span><input class="input" name="name" required></label>…</form>` underline fields; `.form-error` and `.form-status` (from forms.js) are styled |
| `.join` | Home's one-line newsletter form; add `data-newsletter` and site.js wires it |
| `.sheet` `.statement` `.statement__sign` | `<div class="sheet" style="--r:.6deg"><p class="statement">…<span class="statement__sign">— Camila Castillo, The Global Collage</span></p></div>` |
| `.arrive` | first-screen element that should rise in: `style="--wait:.6s"` |
| `pieceCard(product, { sizes, from })` | the card element (see 3). `from` fills an existing static card. |
| `layPieces(container, products, { sizes })` | replaces the container's children with cards and arms their reveal |
| `addToCart(product, noteEl)` | adds, opens the cart; a refusal goes into `noteEl` as text |
| `openCart()` | opens the cart sheet |
Hooks site.js acts on: `[data-menu-open] [data-menu-close] [data-cart-open] [data-cart-close] [data-cart-count] [data-add] [data-featured] form[data-newsletter] [data-pull]`, `<body data-prices>` (mounts the sample line: every page that shows a price), `[data-table] .obj` (draggable).

## about.html
Title and meta from COPY. No `data-prices`.
1. **Opening** (`style="min-height:min(64svh,620px)"`): h1 "The Artist", lead line as `.opening__intro.lead`. Objects: `cutouts/hands-placing` hanging from the top (`--x:66%;--y:-9%;--w:22vw;--d:.6;--oy:-60vh`, phone `--xm:46%;--ym:-4%;--wm:56vw`), and a loose face bottom left made of `cutouts/scrap-eye`, `scrap-eye-2`, `scrap-lips` (5 to 7vw each, `--d` 1.4 to 1.7; phone: only the first eye).
2. **Statement** `.sec[data-table][data-scroll]`, `.wrap.grid`: columns 1–5 the portrait `about/portrait/cami-754` as `figure.obj.obj--flow > .print` (`--r:-2.5deg`); columns 5–12 the fixed block, word for word, in `.sheet` (`--r:.6deg`, `margin-left:-4vw`, `z-index:1`) so the paper overlaps the photo; `data-reveal` on both, the sheet from the right. `cutouts/scissors` (`--w:4.5vw;--r:35deg`, `.obj--front`) lies on the sheet's top right corner. Phone: portrait 80% wide, then the sheet full width pulled up 28px over it.
3. **Story** `.sec[data-table][data-scroll]`: columns 1–6 the expanded story in `.prose` (first sentence may take `.lead`); columns 7–12 three process photos as draggable print objects in a `position:relative` box: `about/process/dscf5889` (full width, `--r:2deg`), `dscf8196` (55%, bottom left, `--r:-4deg`), `dscf8189` (48%, top right, `--r:5deg`), each with `--ox` to the right. Phone: text, then the first photo at 84% and the two others at 56%, overlapping by 20px.
4. **Selected exhibitions** `.sec`: h2 `.t-1` "Selected exhibitions" (the copy's section name), body as `.lead` (max 24em), `.btn.btn--line` "See the full exhibition history" → `exhibition.html`; right, `exhibition/tripping-animals-2024/img-5709` as a `.print.print--crop` (`--ratio:4/5`, `--r:-2deg`, columns 9–12).
5. **Soft close** `.sec[data-table][data-scroll]`, centred: the line as `.t-1` `data-words data-reveal`, then `.actions` centred: `.btn` "Explore the collection" → `shop.html`, `.btn.btn--line` "Commission a piece" → `commissions.html`. Objects left and right: `cutouts/butterfly`, `cutouts/garden-head`.

## shop.html
Title and meta from COPY. `<body data-prices>`. `?type=originals|prints|goods` (none = originals).
1. **Opening** (`style="min-height:min(58svh,540px)"`): h1 "Shop", intro line as `.opening__intro.lead`. Objects: `cutouts/framed-red` left (`--x:5%;--y:30%;--w:15vw;--r:-8deg`), `cutouts/tiger-walking` right (`--x:74%;--y:56%;--w:22vw`).
2. **Bar** (`.sec` with `padding-bottom:0`, `.wrap`, flex, space-between, wraps): `.filters` (three links, `aria-current="true"` on the one showing), then `.cue` "Originals from $111" and `.small.muted` "Ships from Miami, insured, US only." The cue shows for originals only.
3. **Grid** `<div class="pieces pieces--shop" id="pieces" data-stagger="70">`. Page script: `import { getProducts } from '../shared/shop/shop.js'; import { layPieces } from './js/site.js';` then `layPieces(pieces, await getProducts({ type }), { sizes: '(min-width:1280px) 22vw, (min-width:820px) 30vw, 46vw' })`. Sold pieces stay, marked Sold (try `&sold=curiosity`). The flight to the product page needs nothing more.
4. **Prints / Goods** (empty list): unhide a `.empty` block already in the HTML (`hidden`): `.empty__print`, a `.t-2` line, an `.empty__text` line, and Home's `.join[data-newsletter]` form. Wording goes in DECISIONS.
Phone: two columns of cards (title and year stack, the add control goes full width under the price); the filters stay one row.

## product.html
`<head>`: add the two lines from the top of `../shared/motion.js` (`<link rel="expect" blocking="render" href="#piece-hero">` and `pieceHero(); init();`). `<body data-prices>`. `?handle=`.
1. One section `.sec[data-table][data-scroll]` with `padding-top:clamp(96px,14svh,150px)`, `.wrap.grid`. Columns 1–7: the piece, whole, straight (no tilt, so the flight lands cleanly), in a `.print`: `<button class="product__look" aria-label="Look closely"><span class="print"><img id="piece-hero" alt=""></span></button>`, `max-height:82svh; width:auto`; set it with `imageAttrs(product.images[0], '(min-width:900px) 52vw, 100vw')`. Columns 8–12, `position:sticky; top:96px`, each child `.arrive` with `--wait` .15s apart: `.piece__mark` (product.badge) · h1 `.t-1` title · year, medium, dimensions as a `dl` (`dt` `.small.muted`; a null value is a `.needs-content`) · price `.t-2` · the story as `.lead`, or `STORY_PLACEHOLDER` in `.needs-content` · the shipping line `.small.muted` · `<button class="btn btn--plain btn--wide" data-buy>Add to cart</button>` calling `addToCart(product, note)` with `<p class="piece__note" role="status">` under it. Sold: `.piece__sold` "Sold" in place of the button.
2. **Close look**: `<dialog class="look">` (full screen, `--table` fill, `overflow:auto`, the `zoomSrc()` file at its real size, a `.corner.corner--bl` Close). Not offered when `image.lowres`.
3. **In its frame**: the remaining `product.images` (framed photos, shot on black) as `.onblack` pictures, 2 or 3 across, each an `.obj.obj--flow`.
4. Unknown handle: `.empty` with one `.t-2` line and a `.btn` to `shop.html`.
Phone: the piece first at full column width, then the panel; the add button is `position:sticky; bottom:64px` so it stays above the three corner words.
