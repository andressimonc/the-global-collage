# Option 1 — The Cutting Mat · decisions

One line per choice Dre or Camila may want to change. Home page only so far.

## Pictures
- Hero picture: Camila's hands from the studio photo `collage-photos/bw-110`, lifted off her real mat and set on the drawn one (not a rectangular photo). The Home hero folder is empty.
- Three loose paper pieces from that same photo (an eye, a black strip, an L of strips) are separate so they slide in and answer the pointer.
- Finished piece lying in the hero: **The Art of Art** (links to its product page). Picked because its cut-out words are where the headline treatment comes from. Hidden below 900px wide.
- Featured six: **Be You, Senor Tigre, Female Cactus, Society, Let Out, Gaga's Offering**. All high-resolution; none of the small-file pieces. Lucky Pleasures and Modern Love were left out of Home on purpose (lingerie and tobacco; raised middle fingers).
- About teaser portrait: `about/portrait/cami-754` cropped to 4:5 (the Home portrait folder is empty), with studio photo `collage-photos/bw-119` tucked behind it.
- Stay in touch picture: studio photo `collage-photos/bw-92` (COPY names no picture for that block).
- The Local Collage pictures: `the-local-collage-no-3-the-butterfly-effect` and `dscf7924`, reused from the Exhibition folder as COPY asks.
- Cut-outs made for this option, all from her studio photos, none from an artwork: `hero-hands`, `scrap-eye`, `scrap-strip`, `scrap-ell` (bw-110), `scrap-lips` (bw-119), `scrap-eye-square` (bw-107). In `public/option-1/img/`; rebuilt by `docs/option-1/make-cutouts.py`.
- The mat, its grid, rulers, tape and torn edges are drawn (CSS and small SVG files), not photographs.

## Headline and words
- The H1 is set as separate cut strips, and "fragments." is cut into two pieces ("frag" + "ments."). Screen readers get the whole sentence.
- "out of" is shown in capitals in the sans (styling only; the word is unchanged).
- Section headings come from COPY's own section names: "The work", "Ways to own it", "Stay in touch", "The deeper why" over "The Local Collage". The About and Services blocks have no visible heading (hidden ones read "About" and "Services").
- The Local Collage block has no paragraph: COPY gives a direction for it, not a sentence, so it shows the title, two pictures and the link.
- Featured captions show title, year where the file list has one, and "Original, 1 of 1". No prices on Home yet (see Not connected).
- Words added: "Cart" (header), "Menu" / "Close" (phone), "Skip to content", "Email" (field label), and "Stay in touch" above the footer field (reused from COPY).
- Footer line printed without the trailing comma: "Based in Miami, available in the US".
- Instagram link points to instagram.com/theglobalcollage (COPY gives the handle, not the address).

## Look
- The logo is the black v1 on a white paper tab stuck over the end of the header strip; the footer uses the white v1. Neither is altered.
- Primary buttons are orange price labels with black type (white or cobalt on orange fails contrast); secondary links are white hang-tags.
- Doorways: Originals → shop (originals), Prints & goods → shop (prints), Commissions → the Commissions page.
- Ruler numbers on the mat are decoration; they count mat squares, not inches.

## Not connected yet
- The featured grid is fixed markup (`data-todo="shop"`); it reads the shop only to know which pieces can be bought.
- The cart works on Home (see Review fixes below); it runs on the sample catalogue until Shopify is connected.
- Newsletter fields use the shared forms layer; in preview they send nothing.
- The other nine pages are planned in DESIGN.md, not built; their links from Home lead nowhere yet.

## Review fixes (2026-10-13, before Camila's review)
- The cart now opens: a white paper receipt from the right, as DESIGN.md planned it (piece, price, Remove, Subtotal, an orange Checkout label). Checkout shows the shop layer's sample notice inside the receipt.
- Each featured piece that can be bought has a small white "Add to cart" hang-tag under its caption. It stands in for the product page until that page exists; no price shows on Home, only in the cart.
- The sample-price note shows inside the cart only, because that is the only place on this page with a price.
- Words added: "Add to cart", "Remove", "Subtotal", "Checkout", "Your cart is empty.", and the shop layer's line "Ships from Miami, insured, US only.".
- Footer: the e-mail address no longer breaks in two on a small laptop.
- Pieces that slide in can no longer stay invisible when the page is jumped to its foot.
