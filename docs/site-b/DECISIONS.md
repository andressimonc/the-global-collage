# Site B, "The Work Table": decisions

One line per choice that Dre or Camila may want to change. Home page only.

## Where her notes left room
- The ring holds "The work" (option 1's six originals), not the hero. The first screen stays option 1's hands-on-the-mat hero, as briefed.
- There are six pieces on the ring, because COPY asks for 3 to 6: Be You, Society, Senor Tigre, Female Cactus, Gaga's Offering and Let Out (option 1's six, all high-resolution). Be You is at the front when the section sits in the middle of the screen.
- The ring turns a little with the scroll (about two pieces across the section). It also turns by dragging, by the arrows and by the arrow keys. Only the front piece opens its page; pressing another brings it round.
- Under the front piece a white slip shows its title, year, "Original, 1 of 1" and price, with an "Add to cart" tag (or "Sold"). Prices therefore show on Home, so the shop layer's sample-price note sits under the ring.
- Option 1's hero piece, The Art of Art, still lies in the hero. It is not on the ring, so no piece shows twice.
- The planet has a cobalt disc with a white rim and her white planet icon. The moon is orange with an ink count, like option 1's cart sticker. "Menu" and "Cart" are written on small white paper slips.
- The menu is the mat itself, opening out of the planet, with the seven pages as paper strips on a ring around her white planet. Home is a cobalt strip. The other six are paler and marked "soon", and they are not links, as in option 9. On a phone it is a list of strips.
- The footer's page links and legal links show "soon" in the same way. The Home buttons still point at `shop.html`, `services.html`, `about.html`, `commissions.html` and `exhibition.html#the-local-collage`, which open the "not built yet" page.
- Logo: black v1 and white v1 from her files. It is white over the mat and black over paper, the white proof strip and the orange sheet (as in option 4). It hides over the footer, which has its own logo, and shrinks to 62% once the page moves. As in option 4, it sometimes sits over words as they scroll past.
- About: an orange sheet laid on the mat, 72% of the screen wide on desktop, left-aligned and turned half a degree. Her name is 15vw (option 4 used 22vw, so 68%) and her portrait is 26vw (option 4 used 38vw). On a phone it is about 80% of option 4 (name 18vw, portrait 68vw), because she saw and liked it on her phone.
- Her portrait stands on the sheet's bottom edge and reaches a little past its right edge onto the mat. Her lips and an eye lie on the mat beside the sheet (hidden on phones).
- Her name in off-white on orange is about 2.7:1 contrast, below the usual bar for text. It is kept because it is the exact look she asked for, and screen readers get the name from the heading.
- The About copy line is Neco in ink on orange (as in option 4). "Read my story" is option 1's white hang-tag, not option 4's ink pill.
- Kept from option 1 because she loved that world, and easy to remove: the ruler down the left edge and over "Stay in touch", the torn proof strip, and the masking tape on one Local Collage photo. Round 2 called tape and rulers old-fashioned.
- Photographs keep a thin white print border; they are prints, not cut-outs. No cut-out has a white border, peel or bounce.
- Motion added on top of option 1: the hero parts as you scroll away (strips drift apart, scraps drift out, the hands sink). Sheets turn slightly as they pass, strips and tags travel sideways with the scroll, the cart moon circles the planet once when something is added, and pages glide (old sheet out left, new sheet in from the right).
- The planet steps below the screen edge whenever it would cover a headline, button, field or the front piece, and comes back when the spot is clear (option 9's rule). On a phone this happens often.

## Words not in COPY.md
- "Menu", "Close", "Cart", "soon", "Add to cart", "Sold", "Remove", "Subtotal", "Checkout", "Your cart is empty.", "Skip to content", "Email".
- For screen readers only: "Previous piece", "Next piece", "Featured originals", "Add <title> to cart", "Cart, N items", "Exhibitions", and the hidden heading "Services".
- From the shop layer: its sample-price note, its checkout note and "Ships from Miami, insured, US only." (the same as COPY's shipping line).
- The footer's "Stay in touch" label reuses COPY's section name. The footer line is printed without its trailing comma.

## Pictures and cut-outs
- Copied from option 1's `img/` into `public/site-b/img/`: `hero-hands` (from studio photo `collage-photos/bw-110`), `scrap-eye`, `scrap-strip`, `scrap-ell` (bw-110), `scrap-lips` (bw-119), `scrap-eye-square` (bw-107), and the drawn `ruler-x`, `ruler-y`, `torn-top` and `torn-bottom` files. None is cut from an artwork.
- About portrait: shared cut-out `cutouts/camila` (from `about/portrait/cami-754`), shown in black and white by a CSS filter (`cut-bw`, from option 4).
- Ring: `shop/originals/` be-you, society, senor-tigre, female-cactus, gagas-offering and let-out (480/960 files), whole and uncropped. Hero piece: the-art-of-art.
- Stay in touch: studio photo `collage-photos/bw-92`. The Local Collage: `exhibition/local-collage/the-local-collage-no-3-the-butterfly-effect` and `dscf7924`.
- Brand: `logo-black-v1`, `logo-white-v1` and `icon-white` (the planet and the menu's centre), unaltered.
