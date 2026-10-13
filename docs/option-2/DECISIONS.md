# Option 2 — The Gallery Wall: decisions

One line per choice Dre or Camila might want to change. Started with the Home slice, 2026-10-13.

## Site-wide
- Look: paper wall, all type in cobalt, black and white frames with white mats, black picture ledges, cobalt "painted wall" bands. Orange appears only as the focus ring and (later) the sold dot.
- Frames are black or white only. Her real frames are also red; red was left out because this option keeps orange-red for tiny signals.
- Header logo: the black sticker with the planet (v1), 76px tall. Footer logo: the white v1 on cobalt (cobalt is the "dark" here, not black).
- Paper grain is drawn in code (a tiny noise pattern), not one of her textures.
- Words added because the doc has none: "Skip to content", "Menu", "Close", "Cart", and in the footer the label "Newsletter" with the placeholder "Email".
- Footer line is set as "Based in Miami, available in the US" (the doc's trailing comma read as punctuation of its own sentence).
- "@theglobalcollage" links to instagram.com/theglobalcollage (assumed from the handle; confirm).
- "Senor Tigre" is spelled as in the catalogue (no ñ); confirm the title.
- No cut-outs were made or used in this option.
- The opening fragment animation can be frozen for review with `index.html?frag=apart`.

## Home
- Hero piece: The Art of Art (2025). The Home hero folder is empty; this is a sharp high-res scan whose sky blue and orange butterfly sit well with the brand cobalt and orange. It is shown whole, framed, beside the headline (not as a wide picture under the text, since she has no horizontal piece).
- Hero wall label shows title, year, medium and "Original, 1 of 1". No price on Home yet: the label has an empty price slot for the shop layer.
- The H1 is broken into four lines on wide screens ("I make / worlds / out of / fragments."); the words are unchanged.
- About teaser portrait: the About portrait (Cami-754), reused because the Home portrait folder is empty. Shown in a plain black frame with no mat.
- Small headings taken from the doc's own section names and the menu: "About", "The Work", "Ways to own it", "Services", "Stay in touch", "The deeper why".
- Featured six: Senor Tigre, Be You, Society, Gaga's Offering, Curiosity, Reflections of Me. All high-res; none of the small files. Static for now (marked `data-todo="shop"`), to be fed by the shop layer.
- "See everything in the shop" sits beside "The Work" headline instead of after the doorways (action next to the headline).
- Doorway pictures: Originals = a detail of Zenda Beach; Commissions = a detail of Feet on the Ground (her finished commission); Prints & goods = the 2025 Tripping Animals wall photo, a stand-in because the Prints folder is empty and no single piece should look like it is offered as a print.
- Doorway links: Originals → shop.html?type=originals, Prints & goods → shop.html?type=prints, Commissions → commissions.html.
- Services arm picture: studio photo bw-107 (hands on the cutting mat); the Services folders are empty.
- Stay in touch picture: process shot DSCF5889 (The Art of Art in progress), reused from About > Process Shots.
- The Local Collage on Home: the doc gives no body text for it, so it is the heading "The deeper why", the photo DSCF7924 and the button "The Local Collage". Say if a line from the Exhibition page should be repeated here.
- On a phone the six featured pieces sit on one shelf that scrolls sideways (one large frame at a time) instead of six small ones.
- The cart and both Join forms work (sample catalogue; nothing is sent in preview). The other pages the menu links to are not built.

## Leftovers for the lead
- `_shots/option-2/option-2_index-1440-08.png` and `-09.png` are stale (from a broken render); the page is seven screens at 1440. Safe to bin.

## Review fixes (2026-10-13, before Camila's review)
- The sample-price note no longer floats over the page (it sat on wall labels, the Email field and the footer). It lies under the header at the top of the page, still dismissible, and scrolls away with it.
- Each wall label on the shelves has an underlined "Add to cart" under the price. It stands in for the product page until that page exists.
- "Read my story" and anything else that fades in can no longer stay invisible when the page is jumped to its foot.
