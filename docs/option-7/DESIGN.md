# Option 7 "The Cover" — design notes

**The idea.** Every screen is a magazine cover: one flat saturated colour edge to edge, a giant Neco
Black masthead across the whole width, a full-colour cut-out standing in front of it, and the words
set small and tight. Scrolling turns to the next cover; a paper spine on the left edge is the only
chrome.

## Colour (`css/site.css` §1, §3)
| Token | Value | Allowed for |
|---|---|---|
| `--cobalt` | `#122FAB` | cover ground (Home, The Deeper Why); masthead on orange and paper; all type on paper |
| `--orange` | `#FF5630` | cover ground (The Artist, Stay in touch); masthead on cobalt only; buttons on cobalt/green/ink; the Menu block. Never small text on paper |
| `--paper` | `#EFEDEA` | cover ground (The Work); the spine, the contents page, the cart; type on cobalt/green/ink |
| `--green` | `#496843` | cover ground (Services) |
| `--ink` | `#231F20` | back cover (footer); type and masthead on orange; the two preview notes |
A section sets `data-tone="cobalt|orange|paper|green|ink"`, which gives `--ground --text --mast --btn
--btn-on --btn-hov --focus`. A featured piece sits on a colour from its own picture (`--ground`,
with `--on` = ink or paper, whichever reads at 4.5:1). Nothing is black-and-white, nothing has a
gradient or a soft shadow.

## Type
- **Masthead**: Neco 900, capitals, `-.02em`, one line, sized so the word spans the cover exactly:
  `font-size: calc(100cqi / var(--em))` (`--em` = the word's width in em; `fit()` in site.js measures
  it, the HTML carries the measured value for no-script). Trimmed to cap height (`text-box`).
- **Kicker / lede / big lines**: Neco 600 `clamp(1.5rem, 3.1cqi, 2.75rem)`; Neco 500
  `clamp(1.14rem, .98rem + .8cqi, 1.62rem)`; Neco 700 `clamp(1.45rem, 1.05rem + 1.9cqi, 2.6rem)`.
- **Cover lines**: TT Interphases 500 `clamp(1rem, .9rem + .45cqi, 1.25rem)`. **Labels**: TT
  Interphases 700, `.76rem`, capitals, `.13em`. **Buttons**: TT Interphases 700 `1rem`, square.
- The mono face is not used.

## Moving around
- **Desktop / tablet**: the spine (`.spine`, 64 px, fixed left): planet = home, one tick per cover
  (press to turn there), the current cover's name set down it, Cart with its count, Menu (the orange
  block at the foot). Menu and Cart are panels that slide out from under the spine; the spine stays
  and its button reads Close. Focus is held in the panel + spine, Escape closes, focus returns.
- **Phone** (< 700 px): the spine lies along the bottom edge (60 px): planet, cover name, Cart, Menu.
  Panels rise from it as sheets. The contents page keeps its cover on top; tapping a line changes it.
- **Contents page**: the seven pages as numbered Neco lines; beside them a small cover (colour,
  masthead, figure) that wipes in for the line under the pointer or focus.

## Motion (one curve `cubic-bezier(.16,1,.3,1)`; only transform, opacity, clip-path)
- **The cover turn (signature).** Every `.cover` is `position: sticky; top: min(0px, 100svh - its
  height)`: it holds while the next one slides up over it at the visitor's own scroll speed. Nothing
  is hijacked; with reduced motion or no script the covers are ordinary sections.
  `paint()` (one rAF-throttled scroll listener) writes two numbers per cover: `--enter` (0 below the
  screen, 1 landed) and `--under` (how far the next cover has come over it). CSS does the rest:
  the masthead travels in sideways `(1 - enter) * 36vw` (alternate covers from alternate sides) and
  leaves by the far side `under * 26vw`; the figure gets `.is-on` at 30 % and lands with a 1.25 s
  transition (the beat later); the cover underneath falls into shade and its figure sinks 7vh.
- **Depth.** The kit's `--mx/--my` are passed to the cover in view only (`.is-current`): masthead
  moves against the pointer (16 px), figure with it (24 px, sideways only: it stands on the foot).
- **Scroll margins.** A held cover cannot be scrolled to mid-screen, so `settle()` gives everything
  inside a cover a `scroll-margin` that makes "centre this" mean "bring its cover to rest". Keyboard
  focus on a link under a later cover scrolls that cover back (`focusin`).
- **The rack.** A native horizontal scroller: touch swipes it (snap), arrow buttons and arrow keys
  step it, a mouse drags it with a short glide. Wheel and vertical swipes are never touched. It
  slides in from the side opposite the masthead as its cover lands; a card lifts under the pointer.
- **Load.** Masthead from the side, kicker word by word (`data-words`), figure, lines, strip, spine.
- **Elsewhere.** `data-reveal` for lines on later covers; buttons fill by a clip-path wipe.

## Reusable pieces
- `.cover[data-tone]` > `.cover__in` > `.masthead` + `.figure` (`--r` ratio, `--fx` centre, `--fw`
  max width, `--bite` overlap; `.figure--bleed` anchors left, `.figure--hang` hangs a wide picture)
  + `.lines` (`.lines__a` words, `.lines__b` actions). Wide screens: words left, figure standing on
  the foot. Narrow or tall: masthead, figure on a rule, words in columns beneath.
- `.btn`, `.link`, `.biglink`, `.tag`, `.sub`, `.lede`, `.bigs`, `.join`, `.strip`, `.soon`.
- `site.js` exports `pieceCard(product, { sizes, ground })` (`.issue`), `addToCart`, `openCart`,
  `closePanels`. Cart markup hooks: `data-cart-lines|empty|foot|subtotal|status|count`,
  `data-checkout`, `data-close`. Featured list: `ul[data-featured] > li[data-handle]` with
  `style="--ground:…"`.

## Plan for the shop and product pages
- **Shop** = the newsstand. One cobalt cover with the masthead SHOP and the intro; the three filters
  are three spine-style tabs (Originals · Prints · Goods) with "Originals from $111" as the cover
  price. Below, on paper, every piece is an `.issue` card in a wall of covers (4 across, 2 on a
  phone), each on its own colour, whole piece, "Original, 1 of 1", price, Add to cart; sold pieces
  keep their cover with a Sold mark. Prints and Goods: one empty cover saying nothing is here yet.
- **Product** = that piece's own cover. The ground is the piece's colour, its title is the masthead,
  and the piece arrives whole in front of it by the piece transition (`#piece-hero`). Cover lines
  down the side: medium, dimensions, year, price, the badge, the shipping line, Add to cart; the
  story below on paper (placeholder styling until Camila writes it); press the piece for the 2400
  close look.
