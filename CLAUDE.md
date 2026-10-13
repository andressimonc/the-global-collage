# The Global Collage website

Nine home-page options for the collage artist Camila Castillo (brand: The Global Collage), inside
one review site where she pages through them and leaves notes. Built 2026-10-13. Once she picks,
the chosen option gets its other pages and the rest move to `mockups/`. Her shop stays on Shopify
(store `2pssuy-7e.myshopify.com`, live at theglobalcollage.com on a stock theme).

Plain HTML, CSS and JavaScript modules. No framework, no build step. One dependency, installed by
Vercel at deploy only: `@vercel/blob`, for the review notes.

| | |
|---|---|
| `public/index.html` + `public/review/` | **The review site**: the option in a frame, a notes chat beside it, arrows, a wrap-up. How it works and how to put it online: `docs/REVIEW-SITE.md` |
| `public/option-1/` `-2/` `-3/` | First round, saved as they were (Cutting Mat, Gallery Wall, Sticker Pop). Dre: "okay, not my favorite"; they keep their top bar |
| `public/option-4/` `-5/` `-6/` | From Camila's Pinterest board (The Poster, The Archive, Inside the Piece). Dre: "I like these" |
| `public/option-7/` `-8/` `-9/` | Three more (The Cover, The Floor, The Orbit) |
| `public/shared/` | What every option stands on: pictures, logos, fonts, the shop layer (`shop/shop.js`), forms (`forms.js`), motion (`motion.js`, `motion.css`), switches (`config.js`) |
| `public/404.html` | What the frame shows for a page that is not built yet |
| `api/contact.js`, `api/notes.js` | The form function (Resend) and the review-notes function (Vercel Blob) |
| `dev/` | `server.mjs` previews locally, never sends mail, keeps review notes in `_notes/`; `*.test.mjs` check the shop layer and both functions |
| `tools/` | `shot.mjs` (real-Chrome screenshots, scripted steps, page health), `prepare-assets.py` (Drive folder → web images), `merge-catalogue.py`, `cutout.swift` |
| `docs/` | `COPY.md` (her final words, verbatim), `BRIEF.md` then `ROUND-2.md` (the build rules; round 2 wins), `references/` (her Pinterest board, never used on a page), `manifest.json` / `catalogue.json` / `cutouts.json`, each option's `DESIGN.md` and `DECISIONS.md` |
| `_source/` | Camila's original files from Google Drive (not in git, never linked from a page) |
| `TO-CONFIRM.md` | What Camila and Dre still have to supply or decide |

```bash
npm run dev    # http://localhost:4180
npm test
node tools/shot.mjs /option-1/index.html _shots/x --mobile
```

## Rules that hold here

- **Words come from `docs/COPY.md`, verbatim.** The artist statement is one fixed block.
- **Nothing invented**: no prices, sizes, client names or dates. Missing things are loud placeholders
  (class `needs-content`) and a line in `TO-CONFIRM.md`.
- **Look, colours, type, layout and wording are Dre's and Camila's to change, not a chat's.**
  The nine options are proposals.
- **No top bar on anything new** (Dre, 2026-10-13: "what I really don't like is the top bar and this
  feeling of like old technology"). Pages glide into each other, things slide in and out.
- **The shop layer is shared.** Sites never fetch Shopify or keep a cart themselves.
  With no token in `public/shared/config.js` it serves the sample catalogue and says so on the page.
- **Links are relative and name the file** (`shop.html`, `../shared/...`) so an option works from
  any folder. Clean addresses are a launch task.
- Navigation, footer and cart markup are repeated in each page of an option.
- Pictures come in fixed widths (`name-480.webp` … `-2400.webp`), made by `tools/prepare-assets.py`.

## Where it stands (2026-10-13)

- **Live for review** at https://the-global-collage.vercel.app (unlisted, noindex). Published with
  `vercel deploy --prod --yes --scope dres-projects-6e4b1739` from this folder; **Dre runs it** (a chat's
  auto mode refuses production deploys). GitHub `andressimonc/the-global-collage` (private) is not
  connected to Vercel, so a push does not publish.
- Camila reviews at `/?who=camila&k=<key>`; her notes are committed to the `notes` branch as
  `notes/camila.json`. The key is in `.review-key` (not in git). Details: `docs/REVIEW-SITE.md`.
- Every option is its Home page only. Next: read her notes, then build the other pages of what she picks.
- This folder was moved here from a scratch workspace on 2026-10-13; `.git`, `.claude/launch.json` and
  `tools/bin/cutout` were rebuilt after the move (`swiftc -O tools/cutout.swift -o tools/bin/cutout`).
