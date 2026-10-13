# Option 1 — The Cutting Mat · design system

**The idea.** The site is Camila's work table seen from above: a drawn green cutting mat with its pale measured grid, and on it only paper (prints, cut strips, torn strips, labels, tape) and her real hands at work. Realism comes from her photos, real contact shadows and the measured grid; nothing is glass, glowing or drawn-for-decoration.

Files: `public/option-1/css/site.css` (sections 1–9 are shared by every page, section 10 is Home only; add each new page's rules under its own `PAGE ONLY` comment), `js/site.js`, `img/` (cut-outs and the drawn mat parts; all rebuilt by `docs/option-1/make-cutouts.py`). Home (`index.html`) is the reference build: copy its header, footer and class names exactly.

## Colour (tokens in `:root`)
| Token | Value | Where it is allowed |
|---|---|---|
| `--mat` | `#028B71` | the page ground (`body`) only. Grid: `--mat-line` `rgba(247,240,180,.30)`, 1px every `--u`, measured from the centre line |
| `--paper` | `#EFEDEA` | sheets (whole sections), cards, the phone menu |
| `--white` | `#FBFAF7` | the brighter paper: headline strips on the mat, photo borders, tags, slips, the header strip |
| `--cobalt` | `#122FAB` | every word on paper; the inverse strip (cobalt paper, white word) |
| `--ink` | `#231F20` | words on orange, black strips, the footer ground, the focus ring |
| `--orange` | `#FF5630` | stickers and labels only: primary button, cart count, doorway arrows, list dots, error rule. Never text on paper |
Never: a dark page, colour gradients, white text on orange, text straight on the green (put it on paper first).

## Type
- **Neco** (display): headline strips 700–800, `line-height: 1`, `letter-spacing: -.012em`. H1 `clamp(3rem, 1.1rem + 6.3vw, 6.5rem)`; H2 `clamp(2.1rem, 1.2rem + 3.6vw, 4rem)`; H3 `clamp(1.7rem, 1.1rem + 2.2vw, 2.9rem)`. Also slip titles (700 1.08rem), doorway names, footer nav (600 1.22rem), phone menu links.
- **TT Interphases** (body, UI): 400 `1.0625rem/1.55`. `.body-lg` `clamp(1.14rem, .95rem + .75vw, 1.5rem)/1.42` for teasers and lead lines; `.body-md` `clamp(1.03rem, .98rem + .25vw, 1.19rem)/1.5` on cards. Buttons 1.02rem: label 800 at `font-stretch: 88%`, tag 700. `.strip--sans` (800, `font-stretch: 78%`, capitals) for one small connecting strip per headline, no more.
- **TT Interphases Mono**: `.mono-label` 500 .74rem, `letter-spacing: .15em`, capitals. At most one per section.

## Space and grid
`--u` (one mat square) 64px, 56px under 1100, 44px under 700. `--gutter` `clamp(16px, 4vw, 56px)`; `.wrap` is `min(100% - 2 gutters, 1240px)`. `--edge` `clamp(8px, 2.6vw, 38px)` is the strip of mat left bare beside a sheet. Section padding `clamp(3.5rem, 7.5vw, 6.5rem)`. Sections alternate **mat → sheet → mat**; never two mat sections or two sheets in a row except hero + proof strip. Two-column sections are `5fr 7fr` and stack under 860px. No dead bands: a headline's first content sits within 3rem of it.

## Signature components
1. **The mat** (`body`): flat `--mat` + two 1px line gradients sized `--u`, x-offset `calc(50% + var(--u)/2)` so a line sits on the centre; a soft white radial light from the top left; `body::before` is the printed ruler down the left edge (`img/ruler-y.svg`, 34px wide with numbers from 1320px, ticks only below, hidden on phones). `.on-mat` = a section where it shows (white type context); add `.ruled` for the ruler along its top edge (`img/ruler-x.svg`, centred). `.page-top` on a page's first section clears the header.
2. **Sheet** (`.sheet`, alternate `.sheet--b`): a full-width sheet of paper inset by `--edge`. The paper is `::before` (paper gradient `#F5F3F0 → --paper → #E9E6E1`, `--shadow-rest`), turned `-.28deg` / `.22deg` so its edges are never square to the screen while the words stay level.
3. **Headline strips** (`.strips` > `.strip`): each word or word-pair is its own cut strip: `padding: .13em .3em .17em`, turned by `--r` (defaults cycle -1.6°, 1.3°, -.6°), `filter: var(--drop-flat)`; the paper is `::before` with a four-point `clip-path` whose edges are never parallel (three variants by `:nth-child`). Neighbours overlap by `.1em`; a smaller strip always lies on top of a bigger one (`z-index`), so only margins are ever covered. Colours: white (default on the mat), `.strip--cobalt`, `.strip--ink`; on a sheet the default flips to cobalt. `.strips--stack` stacks them; `.strip-row` keeps two on one line.
4. **Prints.** `.piece` = an artwork: the sheet itself, no border, true ratio, never cropped, `--shadow-rest`, turned by `--r`, with a `.slip` caption (white slip: Neco title + small meta) under its left edge. `.photo` = a photograph: white border `clamp(6px, .75vw, 11px)`; `.taped` adds one piece of masking tape (92×27px, `--tape`, zig-zag ends by `clip-path`). Overlap two photos as `.photo--main` + `.photo--tucked`.
5. **Card and torn strip.** `.card` = cut paper for running text (`--paper`, 4-point clip, `--drop-flat`); `.card.torn` rips the top and bottom edges with a three-layer CSS mask (`img/torn-top.svg`, solid middle, `img/torn-bottom.svg`, 240×12px tiles). Torn is for lists of facts (exhibitions, shipping), cut is for everything else.
6. **Labels and tags** (the buttons). `.label` = orange price label: radius 3px, ink 800 type, a 1.5px printed frame inset 4px (`::before`), arrow `→` (`::after`; `.label--plain` removes it), turned -1.4°. One per view. `.tag` = white hang-tag: clipped left corners, punched hole (radial mask) showing the mat, cobalt 700 type, turned 1.3°. `.sticker` = orange disc (cart count, arrows). Min height 50px. Never pills, never outlines-only.
7. **Scraps** (`img.scrap[data-scrap]`): her real cut-outs (eye, lips, torn strips), absolutely placed, `alt=""`, tight double `drop-shadow`. At most one cluster per section; never over text.
`.needs-content` (dashed orange outline, striped, mono) is the loud placeholder for anything not supplied.

## Motion
Curve `--ease: cubic-bezier(.16,1,.3,1)` everywhere. **Arrive**: `[data-arrive]` (optionally `="left|right|down"`) starts 38–44px away and 3–4° over-turned, opacity 0; `.is-in` settles it: opacity .6s linear, `translate` and `rotate` 1.3s, stagger `--i × .07s`. Resting angle lives in `transform`, arrival in the separate `translate`/`rotate` properties. First-screen items arrive on load, the rest by IntersectionObserver. **Hover** (.5s): a linked piece or photo straightens to 0°, rises 7px, shadow goes `--shadow-rest → --shadow-lift`; labels and tags straighten and rise 3px; nav links get a cobalt strip that wipes in from the left. **Pointer**: scraps within 250px shift up to 16px away and turn slightly (`--sx/--sy/--sr`, fine pointers only). Nothing loops. `prefers-reduced-motion`: everything visible and still. Arrivals are armed only by `html.js`.

## Phone (under 700px; stacking starts at 860–900px)
Angles shrink (strips ≤ .8°, prints × .4), nothing overlaps text, sheets keep an 8px green edge. Header strip: logo tab, cart, a `Menu` tag; the menu is a full paper sheet sliding down with Neco links ≥ 2rem. Buttons are full thumb height (52px). Hero order: hands, strips, card, label, tag. Grids go to two columns with every third piece full width.

## Header, footer, cart, forms (every page)
- **Header**: sticky white strip (56px, turned -.32°) inset by `--edge`; the black logo on its own white tab hanging off the left end (-4°); nav right, current page on a cobalt strip; `Cart` + orange count sticker (`[data-cart-count]`, button `[data-cart-open]`).
- **Footer**: the dark underside of the mat (`--ink` + faint grid): white logo, the seven links in Neco, email / phone / Instagram, newsletter field + `Join` label, the Miami line, legal links.
- **Cart = a receipt.** A strip of white paper `min(420px, 100%)` wide slides in from the right over a dimmed table (`rgba(0,25,18,.45)`), torn bottom edge. Each line: 64px thumbnail of the piece (uncropped), Neco title, "Original, 1 of 1", price in mono, a text `Remove`. A dashed rule, then Subtotal in mono; `Checkout` is a full-width `.label` calling `cart.checkout()`. Empty state: one line on the receipt. Closes with a `Close` tag, Esc, or the dimmed table. Sold pieces never get an add button; a sold slip carries an ink strip reading "Sold".
- **Forms**: a `.card` on the mat. `.field` = bold label above a white input with a 2px cobalt bottom rule ("a line to write on"), 50px high; select and textarea the same; submit is a `.label--plain`. Errors: `.form-error` bold under the field plus an orange underline on it; `.form-status` bold line under the button. Wire with `wireForm` / `prefillFromQuery` from `shared/forms.js`.

## Page plan (picture ids are from `docs/manifest.json`)
**Home** (built). Hero: hands cut-out from `collage-photos/bw-110` + three scraps, H1 strips, subhead card, label + tag, `shop/originals/the-art-of-art` lying bottom right. Torn proof strip across the join. Sheet: `about/portrait/cami-754` taped, `collage-photos/bw-119` tucked. Mat: six originals (`be-you`, `senor-tigre`, `female-cactus`, `society`, `let-out`, `gagas-offering`) as a 12-column spread, three doorway tags, label. Sheet: services strips. Mat: `collage-photos/bw-92` + join card. Sheet: `exhibition/local-collage/the-local-collage-no-3-the-butterfly-effect` + `dscf7924`.

**About.** `.on-mat.page-top`: H1 "The Artist" as two strips, the lead line on a white card beside it, `about/portrait/cami-754` taped at right with `collage-photos/bw-115` tucked. Sheet: the artist statement, word for word, as one `.card--white` set in Neco 500 `.body-lg`, signature line in mono under it. Mat: expanded story on a card beside three overlapping process prints (`about/process/dscf8189`, `dscf8196`, `dscf5885-1`). Sheet: Selected Exhibitions as a torn strip + tag "See the full exhibition history". Mat close: the soft-close line as strips, label "Explore the collection" + tag "Commission a piece".

**Shop.** `.on-mat.page-top`: H1 "Shop" strip, intro line on a card, the three filters as tags (current one cobalt strip, `?type=`), "Originals from $111" as an orange sticker-label, shipping line on a slip; all inside the first 400px. Then the pieces straight on the mat: three columns (two on phones), true ratios, alternating `--r` ±1–2°, each `.piece` + slip (title, year, "Original, 1 of 1", price). Low-res pieces capped at their pixel width. Sold: ink "Sold" strip on the slip, no price link styling. Prints / Goods empty: one blank `.card` with a dashed inner outline and a single plain line. `mountSampleNote()` restyled as a slip.

**Product.** `.on-mat.page-top`, two columns `7fr 5fr`. Left: the piece whole (`object-fit: contain`, max-height 84vh) lying on the mat; clicking it opens the 2400px file in a full-screen dark `dialog` that pans by scroll ("look closely"); a framed photo (`shop/framed/…`, when the product has one) as a taped `.photo` beneath. Right: a white card, the spec sheet: H1 title strips, Medium / Dimensions / Year as ruled rows, price on an orange label, the story (or `STORY_PLACEHOLDER` as `.needs-content`), badge slip, shipping line, `Add to cart` `.label.add-to-cart`. Sold: ink "Sold" strip instead of the button.

**Services.** `.on-mat.page-top`: H1 "Services" strip + intro on a card. Sheet: the three services as three cards in a row, each headed by its name as a strip (cobalt, ink, white), body beneath. Mat: the carousel, a scroll-snap row of taped `.needs-content` prints ("Project name and one picture — coming from Camila"). Close: label "Start a project" → `contact.html?reason=services`.

**Exhibition.** `.on-mat.page-top`: H1 "Exhibition" strip, intro line as a second strip row. Sheet: the four shows, most recent first, each a torn strip (name in Neco, place and year beneath); Tripping Animals carries prints `exhibition/tripping-animals-2025/img-8898`, `img-8891`, `exhibition/tripping-animals-2024/img-5929` and the video in a photo border; the other three are text only. Mat, `id="the-local-collage"`: body on a card, prints `exhibition/local-collage/dscf7903`, `dscf7924`, `the-local-collage-no-3-the-butterfly-effect`, label → `contact.html?reason=press-exhibition`.

**Commissions.** `.on-mat.page-top`, two columns: lead copy on a card with `commissions/finished/feet-on-the-ground` as a `.piece` + slip (title, 12 x 16 in) beneath it; the inquiry form card on the right, in the first screen. Sheet: How it works, three rows, each an orange sticker numeral (1, 2, 3) and the sentence. "In progress" pictures: one `.needs-content` print.

**Contact.** `.on-mat.page-top`, two columns: left, H1 "Contact" strip, intro on a card, the four details as a torn strip, `collage-photos/bw-97` as a small taped print; right, the form card (reason select prefilled from `?reason=`). Nothing else on the page.

**Shipping & Returns / Privacy.** `.on-mat.page-top` with the H1 strip, then one sheet: the facts COPY states (US only, ships from Miami, insured) as a torn strip; every other heading present as a `.needs-content` block marked pending.
