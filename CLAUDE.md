# The Global Collage website

Website for the collage artist Camila Castillo (brand: The Global Collage). She chose **"The Work Table"**
(site B) on 2026-10-14 after three review rounds; on 2026-10-16 it got all its pages and became the site at
the root of `public/`. Her shop stays on Shopify (store `2pssuy-7e.myshopify.com`, admin handle
`the-global-collage`; Dre is an admin): the site reads her products through the Storefront API and sends
the cart to Shopify's checkout.

Plain HTML, CSS and JavaScript modules. No framework, no build step. One dependency, installed by
Vercel at deploy only: `@vercel/blob`, for the old review notes.

| | |
|---|---|
| `public/*.html` | **The site**: Home, About, Shop, Product (`product.html?handle=`), Services, Exhibition, Commissions, Contact, Shipping & Returns, Privacy, 404 (root-absolute links: it opens at any depth) |
| `public/css/` `public/js/` `public/img/` | `site.css` + `site.js` are shared by every page (site.js exports `orbit()` and `addToCart()`); `pages-content.*` serve About to Contact, `pages-shop.*` serve Shop, Product and the legal pages |
| `public/shared/` | Pictures, logos, fonts, the shop layer (`shop/shop.js`), forms (`forms.js`), motion (`motion.js`, `motion.css`), switches (`config.js`: the public Storefront token, `formsLive: true`) |
| `public/robots.txt`, `sitemap.xml` | For search engines; `vercel.json` turns on clean addresses (`/about` serves `about.html`) |
| `api/contact.js` | The form function: contact, commission and newsletter go to her inbox through FormSubmit (no account; she activates it once) |
| `api/notes.js` | The old review-notes function (Vercel Blob / GitHub `notes` branch). Unused since launch prep |
| `mockups/` | Not deployed. Options 1–9, site A and the review site, kept as they were (their `../shared` paths no longer resolve) |
| `dev/` | `server.mjs` previews locally (forms are caught there and never sent); `*.test.mjs` check the shop layer and both functions |
| `tools/` | `shot.mjs` (real-Chrome screenshots, scripted steps, page health), `prepare-assets.py` (Drive folder → web images), `merge-catalogue.py`, `cutout.swift` |
| `docs/` | `LAUNCH.md` (**the domain switch, step by step**), `COPY.md` (her final words, verbatim), `BRIEF.md` then `ROUND-2.md` then `ROUND-3.md` (build rules; later wins), `site-b/DESIGN.md` + `DECISIONS.md` (the chosen site), each old option's notes, `manifest.json` / `catalogue.json` / `cutouts.json` |
| `_source/` | Camila's original files from Google Drive (not in git, never linked from a page) |
| `TO-CONFIRM.md` | What Camila and Dre still have to supply or decide |

```bash
npm run dev    # http://localhost:4180
npm test
node tools/shot.mjs /shop.html _shots/x --mobile
```

## Rules that hold here

- **Words come from `docs/COPY.md`, verbatim.** The artist statement is one fixed block.
- **Nothing invented**: no prices, sizes, client names or dates. Missing things are loud placeholders
  (class `needs-content`) and a line in `TO-CONFIRM.md`. Prices, titles and the one-line stories come from her Shopify.
- **Look, colours, type, layout and wording are Dre's and Camila's to change, not a chat's.**
- **Every headline is Neco in cut-paper strips** (her round-3 note). No top bar (Dre, 2026-10-13).
- **The shop layer is shared.** Pages never fetch Shopify or keep a cart themselves. Her Shopify products
  have no pictures yet, so `shop.js` borrows the site's own files per piece (three Shopify handles differ:
  `let-it-out`, `gaga-ate`, `dibujo-libre`).
- **Checkout is real.** Tests may add to a cart but never complete a checkout.
- Links are relative and name the file (`shop.html`, `shared/...`); Vercel serves them at clean addresses.
- Navigation, footer and cart markup are repeated in each page.
- Pictures come in fixed widths (`name-480.webp` … `-2400.webp`), made by `tools/prepare-assets.py`.

## Where it stands (2026-10-16)

- **Finished, waiting for the domain switch.** Every page is built and checked on desktop and phone. Her 25
  Shopify products were set Active by Dre's go-ahead on 2026-10-16 (they were drafts), so they also sell on
  her stock Shopify theme until the switch.
- **The switch is `docs/LAUNCH.md`**: Dre deploys and adds the domain to Vercel (a chat's auto mode refuses
  production deploys), then Camila follows her steps in Shopify and activates the forms.
- Vercel project `the-global-collage`, team `dres-projects-6e4b1739`; live preview
  https://the-global-collage.vercel.app. GitHub `andressimonc/the-global-collage` (private) is not connected to
  Vercel, so a push does not publish.
- The body typeface (TT Interphases) is a trial; Dre chose to swap it for a free one (2026-10-16, pick pending).
- Open content from Camila: `TO-CONFIRM.md`.
