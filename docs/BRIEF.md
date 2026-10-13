# The Global Collage — build brief (read this first, all of it)

Three complete websites for the artist **Camila Castillo** (brand: **The Global Collage**), built
side by side so Dre and Camila can pick one and then change it. Same words, same pictures, same
shop underneath; three different looks. Dre's ask, in his words: *"super creative", "super cool",
"the collages should be kind of like a big theme of the websites"*, and it must connect to her
Shopify shop.

Her current site is a stock Shopify theme at theglobalcollage.com (store `2pssuy-7e.myshopify.com`):
a home page, Originals and Prints collections, About, Exhibitions, Commissions, Contact, a cart.
The new site replaces its front end and keeps Shopify for the catalogue and the checkout.

## 1. What is fixed (do not change, do not invent)

| | |
|---|---|
| **Words** | `docs/COPY.md` is the only source. Use it **verbatim**, in its order, every section of every page. No rewrites, no extra marketing lines, no lorem ipsum. The **artist statement is one fixed block, word for word, with its signature line.** A word the doc does not give (a form's "sent" message, an empty state, an aria-label) stays short and plain and gets one line in your DECISIONS file. |
| **Facts** | Nothing invented: no prices, sizes, dates, client names, press quotes, reviews, counts. If the page needs a fact nobody has given, use a **loud placeholder** (see §6). |
| **Pictures** | Only what is in `public/shared/` (list: `docs/manifest.json`; what each shows: `docs/catalogue.json`; cut-outs: `docs/cutouts.json`). No stock photos, no AI images, no downloads, no hot-linked files. |
| **Brand** | Her logo files, her colours and her typefaces (§3). Never redraw, recolour, stretch or re-letter the logo. |
| **Menu** | Home, About, Shop, Services, Exhibition, Commissions, Contact, in that order. Primary action site-wide: explore and buy the art (Shop). |
| **Footer (every page)** | Light logo on dark, full navigation, theglobalcollage@gmail.com, +1 (305) 335-3506, @theglobalcollage, newsletter email field, the line "Based in Miami, available in the US," and legal links (Shipping & Returns, Privacy). |

## 2. The project

No framework, no build step, no dependencies, no CDN scripts. Plain HTML, CSS and JavaScript
modules. (House pattern: Dre's Outlaw EVs site.) **Never run `npm install`, a formatter or a
bundler.**

```
public/
  index.html              the page Dre opens to compare the three (the lead owns it)
  shared/                 used by all three sites — READ ONLY for site builders
    brand/                logo files (webp, transparent)
    fonts/  fonts.css     the brand typefaces
    img/<section>/…       every picture, as <name>-<width>.webp (480, 960, 1600; artworks also 2400)
    video/                one exhibition clip + poster
    shop/shop.js          the shop layer: products, cart, checkout (Shopify or the sample catalogue)
    forms.js              contact / commission / newsletter forms
    config.js             the switches (Shopify token, forms live or not)
  option-1/  option-2/  option-3/     one complete site each
api/contact.js            the function the forms post to when the site is live
dev/server.mjs            local preview; never sends mail
tools/shot.mjs            real-Chrome screenshots + page health check
docs/                     COPY.md, this brief, manifest/catalogue/cutouts, each site's DESIGN + DECISIONS
_source/                  Camila's original files — never link to these from a page
```

**Each site is one folder with exactly these pages:**
`index.html` (Home) · `about.html` · `shop.html` · `product.html` · `services.html` ·
`exhibition.html` · `commissions.html` · `contact.html` · `shipping-returns.html` · `privacy.html`,
plus its own `css/` and `js/`. Each site also has a cart (a drawer or panel; your design).

**Links are relative and always name the file**: `href="shop.html"`, `href="index.html"`,
`../shared/…` for shared files. Never a root-absolute path (`/shop`), never a bare folder link.
The site must work when its folder is moved or becomes the root.

- Product pages: `product.html?handle=<handle>`. Shop sections: `shop.html?type=originals|prints|goods`.
- "Start a project" → `contact.html?reason=services` (preselects the dropdown). "Bring The Local
  Collage to your event" → `contact.html?reason=press-exhibition`. "The Local Collage" (Home) →
  `exhibition.html#the-local-collage`.
- Every page: its `<title>` and meta description from COPY.md, `<html lang="en">`, a viewport tag,
  one `<h1>`, a "skip to content" link, `<meta name="robots" content="noindex">` (these are previews).

**Who may edit what.** You edit only the files your task names. `public/shared/`, `docs/COPY.md`,
`docs/BRIEF.md`, `tools/`, `dev/`, `api/` are read-only unless your task says you own them. If a
shared file is wrong or missing something, do not patch around it and do not edit it: say exactly
what is needed in your report.

**Things you will be refused, by design. Do not retry or work around them; write the exact command
in your report and move on:** deleting files (the house rule is the Trash, and only the lead does
it), `git` commands, installing anything, submitting forms on real websites, downloading files.

## 3. The brand

Measured from her brand board (the hex labels printed on the board are wrong; these are the real swatches):

| Token | Value | |
|---|---|---|
| Cobalt | `#122FAB` | the brand's ink: on the board all type is this blue on off-white |
| Paper | `#EFEDEA` | off-white ground |
| Ink | `#231F20` | near-black |
| Orange | `#FF5630` | the hot accent |
| Green | `#496843` | deep green |
| Mat green | `#028B71` | the cutting mat (with its pale grid) — a brand texture, not a swatch |
| Marble blue | `#5D7EB4` | the marbled-paper blue behind the logo — texture only |

The board's other textures: a blurred cobalt-to-orange photo gradient with grain; the green
cutting mat with its measured grid; blue marbled paper; a top-down photo of her hands cutting
magazine faces on the mat.

**Type** (`public/shared/fonts/fonts.css` defines the families):
- `"TT Interphases"` — the brand sans (variable: weight 100–900, width 75–100 via `font-stretch`,
  slant via `font-style: oblique`). Body and UI.
- `"TT Interphases Mono"` — the brand mono (variable, weight 400–700). The board sets small labels in it, widely
  tracked capitals in cobalt. Use sparingly.
- `"Neco"` — the display serif supplied with the brand files (variable, weight 400–900, with italic). Headlines.
- These TT files are a **trial**: fine for a preview, to be licensed before launch (already on the
  to-confirm list). Do not add other typefaces.

**Logo** (`public/shared/brand/`, each at `-400.webp` and `-1000.webp`, transparent, trimmed):
`logo-{black|white}-v1` (solid sticker with the planet), `-v2`, `-v3` (outline letters);
`text-only-{black|white}-v1..v3` (wordmark, no planet); `icon-{black|white}` (the ringed planet
with the puzzle-piece cut-out). The logo is a chunky die-cut sticker; give it clear space.
`<img alt="The Global Collage">` when it is the home link.

## 4. The shop (Shopify)

All shop behaviour comes from `public/shared/shop/shop.js`. **Do not write your own fetches,
your own cart, or your own price formatting.** Read the header comment of `shop.js` for the exact API.
In short:

```js
import { getProducts, getProduct, cart, formatPrice, imageAttrs, isSample, mountSampleNote } from '../shared/shop/shop.js';
```

- With no Shopify token in `shared/config.js` the layer serves the **sample catalogue**
  (`shop/products.sample.json`): her 25 real originals with real titles and years, and **sample**
  price and size. `mountSampleNote()` must be called on every page that shows a price; it adds one
  small line saying the prices and sizes are samples. Never hide it.
- **Sold or unavailable pieces stay on show** with a clear "Sold" mark and no buy button; they must
  never look buyable. Originals are 1 of 1: quantity is never more than one.
- Shop page: intro line, the three filters (Originals · Prints · Goods), "Originals from $111",
  each original marked "Original, 1 of 1", the shipping line. Prints and Goods have no products
  yet: show a designed empty state, not a broken grid (wording goes in DECISIONS).
- Product page shows the listing template from COPY.md: title, medium, dimensions, year, price,
  the story, the badge, the shipping line, an add-to-cart button, and a way to look closely at
  the piece (the 2400 image). When `product.story` is null in sample mode, show the layer's
  `STORY_PLACEHOLDER` styled as a placeholder (§6).
- Cart: add, remove, subtotal, and a checkout button that calls `cart.checkout()` (live: goes to
  Shopify's checkout; sample: the layer shows its own short notice). Cart count in the header.
- **On shop cards and product pages the whole piece is visible, uncropped** (`object-fit: contain`
  or its true ratio). Elsewhere a piece may be cropped or shown as a detail for effect.
- Some originals only exist as small files (`lowres: true`). Never show those wider than their
  real pixel width; do not pick them for a hero or a featured slot.

Forms: `import { wireForm } from '../shared/forms.js'` for the contact form, the commission inquiry
and every newsletter field. It validates, guards against bots, and in preview **sends nothing**.
Fields and options exactly as COPY.md lists them.

## 5. What Dre likes, and what he reads as "AI-made" (from his own past feedback)

- **Her real work carries the design.** Real pictures beat anything drawn. Show the art big.
- **Compact and solid.** He dislikes "dead space between sections" and screen-tall sections that
  hold one row of cards. Check the gap from every headline to the first thing under it.
- **An action sits beside the headline**, not three scrolls down. Contact and Commissions open
  with the form in or near the first screen.
- **Motion is part of "expensive"**: things fade and slide in, and something always answers the
  pointer. His benchmark: one curve `cubic-bezier(.16,1,.3,1)`; arrivals 1.15–1.4 s over 28–44 px;
  the fade finishes before the glide; staggers of .06–.08 s; hovers .5 s. Nothing that loops
  forever or bounces. Respect `prefers-reduced-motion` (everything visible, nothing moving).
- **Reads as AI-made to him, avoid all of it:** a dark theme as the default; a serif-italic accent
  word inside a sans headline; frosted-glass pills and chips; rows of tiny mono labels everywhere;
  film grain over the whole page; a giant outlined word in the footer; drawn placeholder art;
  emoji as icons; purple-to-blue gradients; identical rounded cards in a 3-column grid as the
  answer to everything.
- **Flat white-grey reads "sterile" to him.** Give surfaces texture and depth that come from her
  world (paper, the mat, her photos), not from generic effects.
- He looks at sites in a pane **700–1200 px wide** and on a **phone**. Both must be right, not only 1440.

## 6. Placeholders (things Camila has not sent yet)

Empty folders: Home hero, Home portrait, Home featured, all of Services, Prints & goods,
Commissions in progress, Contact, and the Studio 18, Unsin and Coconut Grove exhibitions.

- Where another real picture honestly fits (the About portrait as the Home teaser; her strongest
  high-res piece as the hero; six high-res originals as "featured"), use it and write the choice
  in DECISIONS.
- Where nothing real fits (Services project carousel: no project names, no pictures; exhibitions
  with no photos; an original's story), build the real component and fill it with a **loud
  placeholder**: a dashed outline, the class `needs-content`, and plain words saying what is
  missing, e.g. "Project name and one picture — coming from Camila". It must be impossible to
  mistake for finished content. Exhibitions without photos are simply text entries.
- Shipping & Returns and Privacy: state only what COPY.md states (US only, ships from Miami,
  insured) and mark the rest as pending.

## 7. Quality bar

- Semantic HTML, real `<button>`s and `<a>`s, visible focus styles, labels on every field, alt
  text on every picture (use `alt` from the catalogue; decorative fragments get `alt=""`).
  Text contrast at least 4.5:1 (cobalt on paper passes; orange on paper does **not** for text).
- Pictures: `<img>` with `srcset`/`sizes`, `width` and `height` set, `loading="lazy"` below the
  first screen, `decoding="async"`. The hero image is not lazy.
- No horizontal scroll at any width from 360 up. `min-width: 0` on grid children.
- A page with JavaScript off still shows all its words and pictures (reveals only arm when JS runs).
- The phone layout is designed, not shrunk: a real menu, thumb-sized targets, the cart reachable.
- CSS in your site's `css/`, JS in its `js/`; keep each file readable. One class name per idea;
  check a short class name is not already used before reusing it.

## 8. Check your own work by looking at it

```bash
node tools/shot.mjs /option-1/index.html _shots/option-1 --w 1440
node tools/shot.mjs /option-1/index.html _shots/option-1 --w 1000
node tools/shot.mjs /option-1/index.html _shots/option-1 --mobile
node tools/shot.mjs "/option-1/product.html?handle=curiosity" _shots/option-1 --mobile --click ".add-to-cart"
node tools/shot.mjs /option-1/contact.html _shots/option-1 --no-walk --steps "type:#name=Test; type:#email=test@example.test; click:button[type=submit]; wait:900; shot:sent"
node tools/shot.mjs /option-1/index.html _shots/option-1 --nojs        # the page with JavaScript off
```

`--steps` runs a short script of real clicks (or phone taps), hovers, typing, drags and named
shots; a click reports when another element covers the spot a visitor would press. The top of
`tools/shot.mjs` lists every step. Forms on this preview send nothing, so submit them here freely.

It runs real Chrome against a private preview server, scrolls like a visitor, saves one PNG per
screenful, and prints a JSON line with console errors, failed requests, broken images, sideways
overflow and text still invisible after scrolling. **Open the PNGs with the Read tool and look at
them.** A page is not done until you have seen it at 1440, about 1000, and phone width, and the
JSON line is clean. Do not start any other server, and do not use the in-app browser.

## 9. Your DECISIONS file

`docs/option-N/DECISIONS.md`: one plain line for every choice you made that Dre or Camila might
want to change (which piece is the hero, which six are featured, wording you had to add, a picture
reused outside its folder, anything you left as a placeholder). No essays. He reads this in the
morning instead of digging through the pages.

## 10. Cut-outs

`tools/bin/cutout <in> <out.png> [all|<n>]` lifts the subject out of a picture as a transparent
PNG (it prints how many subjects it found; `<n>` picks one). The shared library is in
`public/shared/img/cutouts/` and listed in `docs/cutouts.json`. If your design needs one that is
not there, make it from a file in `_source/`, look at it on a contrasting background before you
keep it, save it as WebP with transparency in **your own site's** `img/` folder (Pillow:
`/private/tmp/claude-501/-Users-dre-Library-Application-Support-Claude-scratch-workspaces-d1762b62-5331-4b0b-9187-35fa617bc97d-d622dd59-6b22-44dc-a38f-968423504d25-scratch-2026-10-13-40c74c/39eaf076-5b36-4648-9361-d75acb61a6b5/scratchpad/venv/bin/python`), and list it in DECISIONS.
A figure cut out of one of her **artworks** is decoration only: it never stands in for the piece,
and DECISIONS must say which pieces were cut, so they can be swapped for whole pieces in one pass
if she prefers.

## 11. Why you are allowed to make creative choices here

The house rule is that colours, type, layout and wording are Dre's to choose. For this job he
asked, in his words, for *"three options fully built"* overnight while he is away: *"Give me
three options. We're gonna get creative with it. And based off of that, we're gonna make some
changes."* So make the choices your option's direction needs, make them boldly, and write each
one down in DECISIONS so he can change it. Stay inside your own option's direction; the three
must stay clearly different from each other. Nothing is deployed, sent or published by anyone
but the lead.
