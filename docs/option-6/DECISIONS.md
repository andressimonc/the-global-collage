# Option 6 — Inside the Piece: decisions

One line per choice Dre or Camila might want to change. Home, the menu and the cart are built (2026-10-13); About, Shop and Product follow from `DESIGN.md`.

## Site-wide
- Look: one of her collages fills the screen behind every stretch of the page; a flat paper page with cobalt type sits in the middle; figures cut out of that same collage stand on the page's edges.
- No bar. The logo sits alone, top left, and scrolls away. One small cobalt tab (planet, "Menu", "Cart" and its count) rides the page's top edge and then follows you down at the top right; on a phone it is fixed at the bottom centre.
- The menu is a second paper page that slides over from the right. Each page name brings its own picture in beside it: Home = Senor Tigre, About = studio photo bw-94, Shop = Lucky Pleasures, Services = I Am the Bad Guy, Exhibition = the Local Collage wall (DSCF7924), Commissions = Feet on the Ground, Contact = The Art of Art.
- About, Shop, Services, Exhibition, Commissions and Contact (every page except Home, since 2026-10-13) are marked "soon" in the menu and footer and are not links; Shipping & Returns and Privacy the same. Home's own buttons already point at `services.html`, `commissions.html` and `exhibition.html#the-local-collage`, which do not exist yet.
- Logos: white sticker (v1) on the artwork and on the footer; black sticker (v1) in the menu. Footer is ink (near-black), the only dark surface.
- Colours used: paper, cobalt, ink, and orange for small signals only (focus ring, cart count, the dot on the current page, Sold, errors, placeholders). Her green is not used.
- One cobalt page per site page (Home: the services arm). Say if it should be paper like the rest.
- Words added because the doc has none: "Skip to content", "Menu", "Cart", "Close", "soon", "Add", "In cart", "Sold", "Remove", "Subtotal", "Checkout", "Your cart is empty.", the footer label "Newsletter" with the placeholder "Email", the label "Email" on the envelope's field, and a heading "Services" that only screen readers get.
- The empty cart links to the shop with the doc's own words, "Explore the collection". The cart repeats the shop's line "Ships from Miami, insured, US only."
- Footer line is set as "Based in Miami, available in the US" (the doc's trailing comma read as its own punctuation).
- "@theglobalcollage" links to instagram.com/theglobalcollage (assumed from the handle; confirm). The phone number is a tap-to-call link.
- Apostrophes are straight, as typed in the doc ("I'm"). Curly ones would look better in the serif; say the word.
- "Senor Tigre" is spelled as in the catalogue (no ñ); confirm the title.
- The opening animation (the artwork gliding together from five cut fragments while the page rises) plays on a first visit and on reload, not when moving between this site's pages; those get the page sliding over from the side.
- The preview note about sample prices sits bottom right (top right, beside the logo, on a phone) and can be closed.
- On a phone the checkout preview notice is a little shorter, so it sits on the Checkout button only and no longer cuts through the shipping line (2026-10-13).
- No new cut-outs were made. Cut-outs taken from artworks (decoration only, each beside or over its own piece): Senor Tigre (walking tiger; woman with tiger), Curiosity (the three onlookers), I Am the Bad Guy (blue-haired figure), The Art of Art (quill). Photo cut-outs: Camila (from her portrait), the framed Local Collage piece.
- On large high-density screens the hero loads the 2400px file of Senor Tigre (2.1 MB). Fine for a preview; make a lighter file before launch.

## Home
- Hero world: Senor Tigre (2025), enlarged, with the walking tiger behind the page's top edge and the laughing woman with her tiger breaking the page's right edge (on a phone she sits on the top edge). The Home hero folder is empty; this is her most world-like high-resolution piece.
- The H1 breaks as "I make worlds / out of fragments." on wide screens; the words are unchanged.
- Social proof: the four names are set as a two-column list instead of one line with dots.
- About teaser: the doc's first sentence ("I'm Camila Castillo, a Venezuelan collage artist based in Miami.") is set large as the heading and the rest of the paragraph follows; no words changed.
- About teaser picture: Camila cut out of her About portrait (Cami-754), standing in a notch of the page with her work table (studio photo bw-107) behind her. The Home portrait folder is empty. Say if the plain rectangular portrait is preferred.
- Headings taken from the doc's own section names: "The work", "Ways to own it", "Stay in touch", "The deeper why".
- The work, world: Curiosity, with its three onlookers standing on the page's edge looking up at the map.
- Featured six, all high resolution: Be You, Society, Lucky Pleasures, Reflections of Me, Gaga's Offering, Zenda Beach. They come from the shop layer (price, Sold, Add); change the list in `data-featured` on the grid.
- With the pointer on a featured piece, that piece becomes the artwork behind the page.
- "See everything in the shop" appears twice: as a link beside "The work" (an action next to the headline) and as the button after the doorways (where the doc puts it).
- Doorway pictures: Originals = Artstract; Prints & goods = studio photo bw-119 (a stand-in: the Prints folder is empty and no single piece should look offered as a print); Commissions = Feet on the Ground (her finished commission).
- Doorway links: Originals → `shop.html?type=originals`, Prints & goods → `shop.html?type=prints`, Commissions → `commissions.html`.
- Services arm, world: I Am the Bad Guy, with its blue-haired figure behind the cobalt page. The Services folders are empty; no project pictures are shown here.
- Stay in touch is an envelope that opens as it scrolls into view, in the sky of The Art of Art, with that piece's quill on the corner of the letter.
- The deeper why: the doc gives no body text for Home, so it is the heading "The deeper why", the wall photo DSCF7924 behind, one framed Local Collage piece stepping over the page, and the button "The Local Collage". Say if a line from the Exhibition page should be repeated here.
- Footer world: studio photo bw-100.
- On a phone the six featured pieces are one row you swipe sideways.

## Left as placeholders
- Nothing on Home is a placeholder. `template.html` holds placeholder text for the page builders only.
