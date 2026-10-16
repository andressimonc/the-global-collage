# Site B, "The Work Table": design notes

**The idea.** Option 1's world, which Camila loved: her work table seen from above, with the green cutting mat, paper lying on it and her hands at work. Option 9's Saturn ring sits on top of it as the way her art is shown and the way you move around. There is no top bar. Her logo sits alone in the corner, and her planet at the foot of the screen opens the menu. Her About section is option 4's orange poster, made smaller and laid on the mat as a sheet of orange paper.

Files: `public/site-b/index.html`, `css/site.css` (sections 1–12 are shared by every page, 13 is Home only), `js/site.js` (arrivals, the hero's parting layers, scraps, the logo's colour, `orbit()`, the planet and menu, the cart, forms), `img/` (option 1's cut-outs and drawn mat parts, copied).

## Colour
| Token | Value | Where |
|---|---|---|
| `--mat` | `#028B71` + pale grid `--mat-line` | the page ground, the menu |
| `--paper` / `--white` | `#EFEDEA` / `#FBFAF7` | sheets and cards / strips, slips, tags, the planet's word slips, the ring's arrows |
| `--cobalt` | `#122FAB` | words on paper, the planet disc, the cobalt strips |
| `--ink` | `#231F20` | words on orange, black strips, the footer |
| `--orange` | `#FF5630` | labels (primary buttons), the moon (cart count), the About sheet |
| `--ring-line` | paper at 62% | the ring's drawn line |
Pieces farther round the ring take on the mat's colour (`--dim`). No gradients, glass or glow.

## Type
Neco 700–800 for strips and headings (H1 `clamp(3rem, 1.1rem + 6.3vw, 6.5rem)`, as in option 1). TT Interphases for body and buttons. In the About section her name is Neco 800 in capitals and lower case, at 15vw (option 4 used 22vw), and the copy line is Neco on orange. TT Interphases Mono is used only for small labels: the proof label, "soon" and the sample-price note.

## Moving around
- **Logo**: fixed top-left with nothing behind it. It is white over the mat and black over paper, the proof strip and the orange sheet. Whichever toned ground is smallest under its middle wins. It shrinks to 62% once the page moves and steps away over the footer, which has its own logo.
- **Planet** (`nav.planet`, bottom centre): her white planet on a cobalt disc opens the menu, and the orange moon carrying the count opens the cart. "Menu" and "Cart" sit on white paper slips at the top of the page and tuck away once you scroll. The planet steps below the screen edge when it would sit on a headline, button, field or the front piece of the ring.
- **Menu**: the mat grows out of the planet as a circle. The seven pages ride a ring around her planet as paper strips you can drag. On phones and short screens they become a plain list of strips by the thumb.
- **Cart**: option 1's paper receipt slides in from the right, run on `shared/shop/shop.js`.

## Motion (one curve, `cubic-bezier(.16,1,.3,1)`; transform, opacity and clip-path only)
- Arrivals: things slide onto the table from their side and settle (1.3 s, staggered .07 s).
- The hero parts as you scroll away (`--o`): the headline strips drift apart like fragments, the scraps leave by the edge they came from, and the hands sink slower than the page.
- Scroll-linked (`--v` from the motion kit): sheets turn a fraction as they pass, her name's two lines slide opposite ways, and the headline strips, service strips and doorway tags travel sideways.
- The ring: drag to spin (it coasts to a place), use the arrows or keys, or let the scroll turn it about two pieces across the section. It leans toward the pointer and sweeps in the first time you see it. Near pieces are large, far ones small, and they pass behind "The work".
- Page to page: the old sheet slides off to the left and the next one is laid down from the right. The logo and planet stay put.
- With reduced motion everything is simply there and the ring stands still. With no JavaScript the pieces sit in a row and every word shows.

## The other pages (plan)
- **About**: orange sheet opening (her name and portrait, as on Home), then the artist statement word for word on a paper sheet, the story on the mat beside three process prints, and the exhibitions as a torn strip.
- **Shop**: intro on a card and the three filters as tags. Originals lie on the mat in a calm grid at their true ratios, each with a slip (title, year, mark, price) and an add tag. Prints and Goods are an empty ring holding one plain line.
- **Product**: the piece arrives whole by the piece transition and stands at the front of a ring of its neighbours. The spec sheet is a white card with the price label, story, badge, shipping and Add to cart.
- **Services / Exhibition / Commissions / Contact**: option 1's page plans (strips, cards, torn lists, forms on cards) without the top bar, with the planet and the logo as on Home.
