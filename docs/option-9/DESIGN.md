# Option 9 "The Orbit" — design notes

**The idea.** Her logo is a ringed planet, so her pieces travel on a tilted ring, in real perspective,
around the headline: near ones large and sharp, far ones small, tinted by the field, passing behind the words.
Everything else on the page is one orbital idea per section, in flat cobalt and paper with her art as the only other colour.

## Colour (tokens in `css/site.css`)
| Token | Value | Allowed for |
|---|---|---|
| `--cobalt` | `#122FAB` | the field (hero, about, services, the deeper why), all type and lines on paper, buttons on paper, the planet control, the cart scrim |
| `--paper` | `#EFEDEA` | the alternate ground, all type and lines on cobalt, buttons on cobalt, menu and cart surfaces |
| `--ink` | `#231F20` | the footer ground only |
Sections set `data-tone="cobalt|paper|ink"`, which gives `--bg` / `--fg`; components read those, never a colour.
No orange, no green, no gradients, no shadows, no glow. Depth is size, overlap and `--dim` (a veil of the ground colour).

## Type
- Neco 500: h1 `clamp(3.25rem, min(8.1vw, 13.4svh), 8.4rem)/.92` (phone 13.4vw, three lines); `.h2` `clamp(2.6rem, 6.2vw, 5.5rem)`;
  `.h3`; `.lead` `clamp(1.3rem, 2.15vw, 2rem)/1.3`; names, service lines, menu words, card titles, cart totals.
- TT Interphases: body 1.0625rem/1.5, buttons and links 600 1rem, captions .75 to .9375rem.
- TT Interphases Mono, capitals, only for the "Original, 1 of 1" mark and "soon".

## Moving around
- **The planet** (`nav.planet`, fixed bottom centre, desktop and phone): her icon on a cobalt disc is the Menu button; the
  cart count is a small moon on its right edge and is the Cart button. The words "Menu" and "Cart" show at the top of the
  page, tuck away once you scroll, and return on hover or keyboard focus. Their colour follows the section underneath.
- **Menu**: the planet grows into a full paper screen (clip-path circle from the control). Wide screens: the seven pages sit
  on a ring around her icon, each just outside the line with a dot where it touches; any of them can be pressed where it is,
  focus or drag turns the ring. Under 760 px wide (or 560 high): a plain large list set low, by the thumb. The planet stays
  on top and reads "Close". Escape closes; focus is held in the menu plus the planet and returns to the planet.
- **Cart**: a paper panel from the right (a sheet from below on a phone) over a cobalt scrim; the planet slides away while
  it is open. Lines with picture, title, mark, price, Remove; subtotal; the shipping line; Checkout (`cart.checkout()`).
- **Logo** alone top-left of the hero; it scrolls away with the page. No bar anywhere.

## Motion
One curve, `cubic-bezier(.16,1,.3,1)`. Only `transform`, `opacity` and `clip-path` change. Reduced motion: every ring is
laid out and still; nothing slides.
- Headlines rise word by word (kit `data-words`); blocks rise 40 px (kit `data-reveal`); hero subhead, buttons, caption and
  planet rise on load (`@keyframes rise`). Buttons pull toward the pointer (kit `magnetic`). Page to page: the next page
  opens out of the planet (`vt-in` redefined as a growing circle).
- **The signature: `orbit(root, options)` in `js/site.js`.** One function runs every ring. For item *i* at angle *a* it takes
  X = sin a, Z = cos a, places it at `centre + rotate(roll)·(R·X, B·Z) · s` with `s = (1−k)/(1−k·Z·depth)` (true perspective:
  the near side is spread wide, the far side bunches), writes one `transform` (translate3d, scale, a little `rotateY` for
  prints), a z-index band (0 to 30 behind the centre, 50 to 80 in front; the words sit at 40) and `--dim`. The angle chases a
  target with an exponential ease; a sideways drag (pointer events, `touch-action: pan-y`, so a vertical swipe and the wheel
  always scroll the page) moves the angle by `dx / R`, and on release it coasts to the nearest place. `scroll(rect)` adds a
  turn tied to scroll position; `lean` tilts the ring toward the pointer; `intro` sweeps it into place when first seen.
  A single `requestAnimationFrame` loop runs only while something is moving and on screen. The ring's line is an SVG path
  drawn once per resize and leaned with a CSS transform.
- Hero geometry is measured from the words (`heroGeo`): the far arc is aimed at the middle of the headline, the front piece
  fills the room between the buttons and the planet, and the pieces shrink until the front piece's neighbour clears the
  buttons. On a phone the ring is wider than the screen, so only the near arc and the far arc show and the words stay clean.
- Rings on Home: hero (12 prints, drag, lean, scroll), names (4, scroll), about (4 scraps round her portrait, scroll),
  the work (6 cards, drag), services (one moon round each line, scroll), the deeper why (the button rides the ring through
  the picture, scroll), menu (7 pages, drag). Doorway discs wear a CSS ring that tips on hover.

## Reusable classes and helpers
- `.btn` (label + `.btn__disc` arrow), `.link`, `.h2`, `.h3`, `.lead`, `.soon`, `.vh`, `.join` (pill field + round Join).
- `.orbit` + `data-orbit`, `.orbit__ring`, `.orbit__item`, `.orbit__bar`, `.orbit__turn[data-turn="±1"]`, `.is-orbit`,
  `.is-front`, `--dim`, `--ph` (piece height).
- `.piece` card (`pieceCard(product, { sizes })`): `.piece__art` (whole piece, true ratio), `.piece__info`, `.piece__add`,
  `.piece__sold`. `.print` (hero piece). `.door` (disc doorway). `.svc` + `.moon`.
- JS exports: `orbit`, `pieceCard`, `addToCart`, `openCart`, `closePanels`.

## How the shop and the product page would look
- **Shop**: paper ground. The intro line as the headline with "Originals from $111" beside it; the three filters as three
  small discs (the doorway discs, smaller) with the chosen one ringed. Originals in a calm grid of `pieceCard`s at their
  true ratios (2 across on a phone, 3 to 4 wide), each with its round add control; no ring here, because a grid is faster
  to shop. Prints and Goods: an empty ring with one line of words in its centre. The shipping line sits by the grid's foot.
- **Product**: cobalt ground. The piece arrives whole by the piece transition (`#piece-hero`) and stands at the front of a
  ring whose other places hold the framed photo and the neighbouring originals, so previous and next are a turn away. Title,
  medium, dimensions, year, price, story, mark and shipping line in paper Neco beside it; Add to cart is the `.btn`;
  "look closely" opens the 2400 file full screen out of a growing circle.
