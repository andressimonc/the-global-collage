# Option 3 "Sticker Pop" — decisions (one line each; all of these are yours to change)

## Look
- Band order on Home: cobalt hero, paper strip of exhibition names, orange about, green work, paper doorways, cobalt footer.
- Headlines are Neco Black; everything else TT Interphases; the mono only on the "drag the pieces" hint.
- The header is a paper bar with the black V1 logo; the footer is cobalt with the white V1 logo, tilted 4 degrees like a sticker.
- The orbit ring is orange on cobalt, green and paper, and white on orange, so it never matches the words in front of it.
- Hard shadows are ink everywhere; sticker edges are pure white.

## Home
- Hero piece: there is no hero image yet, so the hero is five cut-outs around the headline that visitors can drag.
- The five: her hands with the blade (from the brand banner photo), the tiger and the woman (Senor Tigre), the crowned head (Tears Water The Soul - Silver), the cactus (Female Cactus), the butterfly on the flower (The Art of Art).
- Camila's own cut-out is kept out of the hero and used once, as the About teaser portrait (from the About portrait, the only portrait we have).
- About teaser: her first sentence is set as the big headline, the rest of the paragraph under it; no words changed.
- Featured six: Be You, The Art of Art, Artstract, Gaga's Offering, Let Out, Society (all high resolution; chosen for colour and so two rows sit at similar heights).
- Each featured piece carries the "Original, 1 of 1" badge; no price shown on Home.
- Headings "The Work" and "Ways to own it" come from the copy's own section label ("THE WORK / WAYS TO OWN IT").
- Doorway stickers: the masked head (Tears Water The Soul - Green) for Originals, the flower head (Tears Water The Soul - Pink) for Prints & goods, the legs (Feet on the Ground, a finished commission) for Commissions.
- Doorway links: Originals to the shop's originals, Prints & goods to the shop's prints, Commissions to the Commissions page.
- "See everything in the shop" sits after the doorways, where the copy puts it.
- Home stops after the doorways for now: Services arm, Stay in touch and The Local Collage are planned in DESIGN.md, not built yet.

## Cut-outs (decoration only; none stands in for the piece itself)
- Cut from artworks: Senor Tigre, Tears Water The Soul - Silver, - Green and - Pink, Female Cactus, The Art of Art, Feet on the Ground. Any of these can be swapped for the whole piece in one pass.
- Cut from photos: Camila (About portrait) and her hands (brand banner).
- All nine live in public/option-3/img/stickers/ with the white edge baked in; made with tools/bin/cutout and docs/option-3/make-stickers.py.
- The shared cut-out library was not ready when this was built; these are this option's own.

## Words added (the copy does not give them)
- Hero hint: "drag the pieces".
- Phone menu button: "Menu" and "Close". Header cart button: "Cart".
- Footer newsletter label: "Stay in touch" (the copy's own section name); field hint: "Email".
- Footer line set without the trailing comma: "Based in Miami, available in the US".
- Apostrophes are typographic (I’m, Gaga’s); no other character changed.
- Planned for the pages still to build: "The Deeper Why" as the Home heading for The Local Collage (the copy's section name), menu words as the h1 on Shop, Services, Exhibition, Commissions and Contact, "Nothing here yet." for empty Prints and Goods, "Your cart is empty.", "Checkout", "Add to cart", "Subtotal", "Remove", "Sold", "This piece is not here.".

## Links and behaviour
- @theglobalcollage links to instagram.com/theglobalcollage (address assumed from the handle).
- The exhibition names scroll slowly and pause under the pointer; with reduced motion they sit still.
- On a phone a vertical swipe on a hero piece scrolls the page; a sideways drag moves the piece.
- With JavaScript off everything shows; on a phone the Menu button hides and the footer carries the navigation.
- The cart works on Home (see Review fixes below); the featured six are fixed markup and read the shop only to know which can be bought.
- Product pages will take their background from the piece's own average colour, made more vivid; words there always sit on a paper panel.

## Review fixes (2026-10-13, before Camila's review)
- The cart drawer now works: piece, price, Remove, Subtotal, Checkout (shows the shop layer's sample notice inside the drawer). The sample-price note shows inside the cart only, the one place on this page with a price.
- Each featured piece that can be bought has an underlined "Add to cart" under its title. It stands in for the product page until that page exists.
- Phone hero: the small tiger and the butterfly sat on top of the headline; they now sit beside "out of", a little smaller.
- "The Deeper Why": the small easel picture lay on the heading (it had no place of its own); it now sits bottom right of the photo on a laptop and is left out on a phone.
- Stickers moved off words and buttons: the hand off "Read my story" (phone), the onlookers off the "Let Out" and "Society" titles, the legs clear of "See everything in the shop", "The Art of Art" title clear of its neighbour's edge.
- Featured pieces and headings can no longer stay invisible when the page is jumped to its foot.
