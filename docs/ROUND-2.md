# Round 2 — three new options (read after BRIEF.md; where they disagree, this file wins)

Dre looked at round 1 (options 1 to 3, home pages only) on 2026-10-13. His words:

> "The designs are okay. They're not my favorite. I don't hate them. … I like some of the stuff
> that you have but what I really don't like is the **top bar** and I don't really like this
> **feeling of like old technology**. I want it to feel **modern** and good, creative, **high
> technology**. Very creative, super cool looking, **very good animations and very fluid**, so maybe
> some things **slide in**, some things **slide out**. I really like some of the animations that you
> did … keep some of your ideas, save these websites … grab these Pinterest ideas and make three
> new ones. I want something like amazing, something beautiful, modern, that feels good, and we
> have to make sure that the Shopify thing can be incorporated in it as well."

So: **options 1 to 3 are saved and frozen** (`public/option-1..3`, read them for ideas, never edit
them). The new ones are **`public/option-4`, `option-5`, `option-6`**, each built from one of the
website references on Camila's own Pinterest board.

## What changes from the brief

1. **No top bar. Anywhere.** No strip across the top holding a logo, seven links and a cart. Each
   option has its own way to move around (given below). The logo may sit alone in a corner. On a
   phone the controls live where a thumb reaches.
2. **It must feel like new technology.** What made round 1 feel old: a static page you scroll down,
   a nav bar, a hero with text left and picture right, things that only fade in. What "modern and
   fluid" means here:
   - **Pages glide into each other.** Every page links `../shared/motion.css`, which turns on
     cross-document view transitions; each option designs its own exit and entrance (a slide, a
     wipe, a lift). Opening a piece from the shop **carries the picture across**: the same image
     flies from the grid to its place on the product page (`pieceTransition()` in the motion kit).
   - **Things slide in and slide out** as you scroll: layers at different depths, sections that
     rise over the one before, rows that travel sideways while the page moves down, pieces that
     leave by the edge they came from. Scroll position drives it (the kit sets `--p` per element),
     so it feels attached to the hand, not played at you.
   - **Something always answers the pointer**: depth that leans toward it, a piece that lifts, a
     button that pulls. On a phone, the same things answer scroll and touch.
   - **Headlines arrive word by word** (`splitWords`). One curve: `cubic-bezier(.16,1,.3,1)`.
     Arrivals 0.9 to 1.3 s; the fade ends before the glide; staggers .06 to .08 s.
   - Only `transform`, `opacity` and `clip-path` move. 60 frames a second or it is cut. No
     scroll-jacking (the page always scrolls at the visitor's own speed), no loading screens,
     nothing that loops forever in the corner of the eye. `prefers-reduced-motion`: everything is
     simply there.
   - Modern also means **big, confident type**, generous scale, real depth, and controls that feel
     like an app (a dock, a sheet, a drawer that slides) rather than a website from 2012. It does
     **not** mean paper textures, tape, torn edges, drop-shadowed boxes, rulers or tiny labels.
3. **Pages this round: `index.html` (the whole Home page), `about.html`, `shop.html`,
   `product.html`**, plus the menu and the cart. The menu still lists all seven pages in order;
   the four not built yet (Services, Exhibition, Commissions, Contact) show a small "soon" mark
   and are not links. The footer keeps everything the brief lists; its two legal links also wait.
   Home's buttons to unbuilt pages point at the page name anyway (`services.html`,
   `exhibition.html#the-local-collage`) so nothing has to be rewired later.
4. **The shop is part of the design, not a page bolted on.** The featured pieces on Home, the shop
   grid, the product page and the cart all run on `shared/shop/shop.js` exactly as §4 of the brief
   says, and each must be one of the best-looking things in the option.
5. **A dark page is allowed for option 5 only**, because Camila's own reference is dark.
6. **The shared motion kit** is `public/shared/motion.js` + `motion.css` (read the header comment
   for the exact exports). Use it for reveals, word splitting, scroll progress, pointer depth,
   dragging and the piece transition instead of writing those again; add your own on top.

Everything else in the brief stands: her words verbatim from `docs/COPY.md`, nothing invented, her
logo, colours and typefaces, relative links that name the file, loud placeholders, the quality
bar, looking at your own work with `tools/shot.mjs` at 1440, about 1000 and phone width.

## Her references (look at them: `docs/references/`)

`board-1.jpg`, `board-2.jpg`, `board-3.jpg` show all 23 pins. Four are websites or posters and
drive the three options; the other nineteen are photo references and give the mood: editorial
portraits on flat colour backdrops (red, olive-mustard, blush), artists on the floor among their
own prints seen from above, flash-on-film studio snapshots, type set large *behind* a figure.

| File | What it is | What to take from it |
|---|---|---|
| `web-cinema-poster.jpg` | A tour poster: one huge heavy condensed word in red, black-and-white photo cut-outs, a blue drawing, strips of stickers, small rows of dates ("SOLD OUT · 2ND DATE ADDED") on warm off-white | Poster composition: one giant word, cut-outs overlapping it, tight rows of small facts, two flat colours against black-and-white |
| `web-red-editorial.jpg` | A long editorial site: red hand-lettering, cut-out figures in red on spiral stairs, sky blue, cream, strips of photos like film, lots of rhythm | Bands that change character as you scroll, filmstrip rows, one accent colour carried through every picture |
| `web-paper-archive.jpg` | A site on near-black: real objects scattered around a centred serif title (camera, envelope, ticket, cherries), menu words spread wide with no bar, then a grid of polaroids with small captions | Objects on a dark table, a title held in the middle of them, prints with a caption beneath, menu as plain words |
| `web-page-over-painting.jpg` | A site that is one tall paper page floating over a full-screen painting; figures from the painting reach over the page's edges; an envelope at the foot | A world behind, a page in front, and things from the world overlapping the page |
| `photo-type-behind-figure.jpg` | Magazine cover: giant serif letters with the figure standing in front of them | The "type sandwich": a cut-out in front of the headline |
| `photo-artist-among-prints.jpg`, `photo-floor-of-cutouts.jpg` | Artists seen from above among their own work spread on the floor | Her own top-down photos and cut-outs are exactly this |

These are **references, not sources**: never copy a picture, a layout pixel for pixel, or any
wording from them, and never put these files on a page. Everything on the page is Camila's.

## The three options

Working titles only (names are Dre's to change).

### Option 4 — "The Poster" (from the tour poster and the red editorial site)

The site is a living poster. Warm off-white ground (`#EFEDEA`). **One giant word or line per
screen** in the brand sans pushed condensed and heavy (`font-stretch: 75%`, weight 900, capitals,
tight) in orange `#FF5630` or cobalt `#122FAB`, big enough to run off the edges. Her photo
cut-outs (Camila, her hands, the mat) in **black and white** (a CSS filter on the cut-outs, never
on an artwork) overlap the type in front and behind (the type sandwich); her artworks stay in
full colour and are the colour in the poster. Small facts sit in tight tabular rows like tour
dates: the exhibition list and the social-proof names are made for it ("FORTHCOMING" where the
poster says "SOLD OUT"). Neco is the second voice for sentences.
Motion: on load the poster assembles, layers sliding in from different edges at different speeds;
as you scroll each section is the next poster rising over the last; the giant words travel
sideways with the scroll; picture strips run across like film (the red editorial reference).
Moving around: **a floating dock at the bottom centre** (a solid ink capsule: Menu, Shop, Cart
with its count), the logo alone top-left shrinking as you scroll. Menu opens a full-screen sheet
that slides up: the seven pages as huge poster rows, a picture sliding in beside the row under
the pointer.
Carry over from round 1: the headline cut into moving bands (option 1) and the slow marquee of
names (option 3).

### Option 5 — "The Archive" (from the Paper Archive site)

A dark table of her things. Near-black ground (ink `#231F20` deepened toward `#121011`), her
cut-outs as real objects around a centred Neco title in paper white, each with a soft true shadow
and its own depth. Her pieces are shown as **prints with a white border and a caption beneath**
(title, year). Colour comes only from her work and one orange signal.
Motion and technology: the table has real depth. Objects sit on different planes and lean with
the pointer (and with scroll on a phone); scrolling travels across the table, so the hero's
objects **slide out to the edges as the next cluster slides in**; any object can be picked up and
moved (the kit's `draggable`). Prints flip, lift or straighten under the pointer.
Moving around: **the four corners**, plain words with no background: logo top-left, Shop
top-right, Menu bottom-left, Cart bottom-right. Menu: the objects clear and the seven pages
arrive as seven captioned prints laid out on the table.
Carry over from round 1: drag-the-pieces (option 3).
Keep it from reading as a generic "dark theme": no glow, no gradients, no glass, no neon; it is
a photographed tabletop at night, lit from one side.

### Option 6 — "Inside the Piece" (from the page floating over a painting)

Every page is a clean paper page floating inside one of her collages. **Behind**: one artwork
filling the screen, enlarged, slowly drifting, a different piece for each section and each page.
**In front**: a centred page (paper `#EFEDEA`, crisp cut edge, cobalt Neco type, generous size)
that the words and the shop live on. **Between**: figures cut out of the same artwork overlap the
page's edges, so the page sits *inside* the piece (use the cut-outs in `docs/cutouts.json`, or
cut new ones as §10 allows).
Motion: the world and the page move at different speeds; when a section ends its world slides
out and the next slides in behind the same page; the overlapping figures drift a little with the
pointer. On a product page the world behind **is that piece**, and the piece itself arrives whole
on the page by the piece transition. The newsletter is an envelope at the foot of Home that
opens as it comes into view (clean geometry, no ornament).
Moving around: **one small tab riding the top edge of the page** (the planet icon and the word
Menu, cart count beside it) that follows you down; it opens a second page that slides over from
the side with the seven pages set large. On a phone the tab sits at the bottom.
Carry over from round 1: fragments that align (option 2): on first load the world behind arrives
as a few cut fragments that glide together.
Keep it modern: no lace, no scallops, no parchment, no script type. The page is a sharp modern
sheet; the richness is all hers, behind it.

## Three different sites

At a glance: 4 is **loud type on off-white**, 5 is **objects on black**, 6 is **her art
full-screen with a page in the middle**. If two start to look alike, pull them apart.

---

# Options 7, 8 and 9 (added 2026-10-13, after Dre saw 4 to 6)

Dre on options 4 to 6: "Okay, I like these. Can we make three more? So we have nine options."
All nine will sit in one review site for Camila, so each new one must be clearly unlike the
other eight. Everything above still holds (no top bar, new-technology feel, her words, the shared
shop and motion kits).

**Scope for 7 to 9: the Home page only**, complete, with its navigation, menu and working cart.
No `template.html` and no inner-page components yet; those wait until an option is chosen. Home's
buttons point at the page names (`shop.html`, `about.html`, …) even though they do not exist: the
review site shows a friendly "not built yet" page for them. Featured cards link to
`product.html?handle=…` the same way.

### Option 7 — "The Cover" (from the magazine cover with type behind the figure, and the colour-backdrop portraits)

Every screen is a magazine cover. A full-screen flat colour, a different one for each section
(cobalt, orange, green `#496843`, paper, ink), a **giant Neco Black masthead word across the
whole width set behind a colour cut-out** (Camila from her portrait, her hands, a figure from a
piece), and the section's words set small and tight in columns like cover lines. Nothing
black-and-white here: full colour, saturated, flat. Any small label is a real fact (a page name,
"Miami", "Originals from $111"); do not invent issue dates or coverlines.
Motion: scrolling turns to the next cover. The new cover slides up over the old one while its
masthead travels in sideways and its figure lands a beat later; the pointer moves masthead and
figure at different rates so the cover has depth.
Moving around: **a spine**. A slim vertical band on the left edge, like a magazine's spine: the
planet icon at the top, the current section's name set along it, Menu and Cart at the foot. Menu
opens the contents page: the seven pages as large numbered lines, a cover sliding in beside the
one under the pointer. On a phone the spine lies along the bottom edge.
The featured pieces are a rack of covers, each piece on a colour taken from its own palette.
Unlike option 4 (condensed sans, off-white, black-and-white cut-outs): this is serif, full-bleed
colour, full-colour figures, one cover per screen.

### Option 8 — "The Floor" (from the photos of artists kneeling over a floor covered in their own pictures)

Home opens on a floor seen from above, far larger than the screen: her originals laid out as
plain prints at slight angles in loose clusters on warm paper, with the headline set huge on the
floor itself so prints overlap it. **You move over it by dragging** (mouse or finger; arrow keys
too) and it glides with a little inertia; prints near the pointer lift. Choosing a print brings
the view gliding in until it fills the screen, with its title, year, mark, price and add-to-cart
beside it and a link on to its page. **A small map** in the bottom-right corner shows where you
are over the whole floor and moves you when pressed; Menu and Cart sit with it as one compact
control. The logo sits alone top-left.
The mouse wheel and a vertical swipe always scroll the page, never the floor (no scroll trap):
below the floor the rest of Home follows as normal sections, each arriving from the direction of
travel, with "the work" as a second, smaller patch of floor holding the featured six.
Build it to be fast: one plane moved by `transform`, 480-wide images on the floor, pictures
loaded as they come near. With no script the prints are simply a tidy grid.
Unlike option 5 (dark, objects around a title, you scroll through it): this is light, the
pieces themselves are the ground you travel over, and you steer.

### Option 9 — "The Orbit" (from her own logo: the ringed planet)

Her pieces travel on a tilted ring in real 3D around the headline, like the ring around the
planet in her logo. Flat cobalt `#122FAB` field, paper-white Neco type, her art as the only other
colour. Prints coming round the front are large and sharp; those passing behind are smaller and
dimmer and go *behind the headline*. The ring turns as you scroll, leans toward the pointer, and
can be spun by dragging (it coasts to a stop). The print at the front can be opened.
Below the hero the sections alternate paper and cobalt, each with one orbital idea: the
social-proof names riding a ring, the three doorways as three discs, the featured six on a
flatter ring you can turn.
Moving around: **the planet is the control**. Her planet icon floats bottom-centre with the cart
count riding it like a moon; pressing it opens a full-screen system where the seven pages sit on
a ring (a plain large list on a phone).
No space kitsch: no stars, no glow, no gradients, no "galaxy". Flat graphic colour, real depth,
her art in motion.
Unlike option 3 (cobalt hero with white-edged stickers scattered flat): clean prints, true 3D,
one ordered ring.
