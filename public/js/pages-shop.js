// Site B, "The Work Table": the Shop and Product pages. Loaded after js/site.js (which runs the logo, the planet,
// the menu, the cart and the arrivals already in the HTML). Every product comes from the shared shop layer, so the
// same code shows the sample catalogue now and her Shopify products once the token is in shared/config.js.
//   shop.html     ?type=originals|prints|goods shows that section only; no type shows all three.
//   product.html  ?handle=<handle>; an unknown handle shows the "not here" state.
import { orbit, addToCart } from './site.js';
import { getProducts, getProduct, formatPrice, imageAttrs, zoomSrc, STORY_PLACEHOLDER, mountSampleNote } from '../shared/shop/shop.js';
import { reduced } from '../shared/motion.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const el = (tag, className, text) => { const n = document.createElement(tag); if (className) n.className = className; if (text != null) n.textContent = text; return n; };
const params = new URLSearchParams(location.search);
const EMPTY = 'Nothing here yet.';

// things drawn after load arrive like the ones in the HTML (site.js only arms those)
const seen = !reduced && 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => { for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); seen.unobserve(e.target); } }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 })
  : null;
const arrive = (nodes) => nodes.forEach((node) => (seen ? seen.observe(node) : node.classList.add('is-in')));

// the shop layer's sample-price line, laid on the page as a slip instead of floating at the corner
function sampleNote() {
  mountSampleNote();
  const note = $('.tgc-sample-note'), slot = $('[data-note-slot]');
  if (note && slot) slot.append(note);
}

function picture(image, sizes, box) {
  const img = new Image(), attrs = imageAttrs(image, sizes);
  Object.assign(img, attrs);
  img.loading = 'lazy'; img.decoding = 'async';
  if (image.lowres) box.style.maxWidth = attrs.width + 'px';   // never wider than its small file
  if (image.avg) box.style.setProperty('--avg', image.avg);
  return img;
}

// ---------- shop: the pieces lie on the mat, each with its slip and an add tag ----------
function item(product, i) {
  const li = el('li', 'shop-item');
  li.dataset.arrive = ['left', '', 'right'][i % 3];
  li.style.setProperty('--i', i % 3);
  const a = el('a', 'piece');
  a.href = product.url; a.dataset.piece = '';
  a.append(picture(product.images[0], i % 3 === 2 ? '(min-width: 700px) 30vw, 92vw' : '(min-width: 700px) 30vw, 46vw', a));
  const slip = el('p', 'slip shop-slip');
  slip.append(el('span', 'slip-title', product.title), el('span', 'slip-meta', [product.year, product.badge, product.available ? formatPrice(product.price) : null].filter(Boolean).join(' · ')));
  const caption = el('div', 'shop-caption');
  caption.append(slip);
  if (product.available) {
    const add = el('button', 'tag shop-add', 'Add to cart');
    add.type = 'button';
    add.setAttribute('aria-label', `Add ${product.title} to cart`);
    add.addEventListener('click', () => addToCart(product));
    caption.append(add);
  } else {
    caption.append(el('span', 'strip strip--ink strip--sans shop-sold', 'Sold'));
  }
  li.append(a, caption);
  return li;
}

// an empty section is an empty ring holding one plain line
function emptyRing(grid, line) {
  const li = el('li', 'shop-empty');
  li.dataset.arrive = '';
  li.append(el('p', 'slip', line));
  grid.classList.add('is-empty');
  grid.replaceChildren(li);
  arrive([li]);
}

if ($('[data-shelf]')) {
  const type = params.get('type')?.replace(/s$/, '');
  const shelves = $$('[data-shelf]');
  const wanted = shelves.some((s) => s.dataset.shelf === type) ? type : null;
  shelves.forEach((s) => { s.hidden = Boolean(wanted) && s.dataset.shelf !== wanted; });
  $$('[data-filter]').forEach((a) => { if (a.dataset.filter === wanted + 's') a.setAttribute('aria-current', 'page'); });
  const open = shelves.filter((s) => !s.hidden);
  // ponytail: a Shopify product with no type (no originals/prints/goods collection, no Product type) is in no section.
  getProducts().then((all) => {
    // COPY's "Originals from $111", with the lowest price an original has in her store today
    const from = $('[data-from]'), prices = all.filter((p) => p.type === 'original' && p.available && p.price).map((p) => p.price);
    if (from && prices.length) from.textContent = 'Originals from ' + formatPrice(prices.reduce((a, b) => (b.amount < a.amount ? b : a)));
    for (const shelf of open) {
      const grid = $('[data-grid]', shelf), pieces = all.filter((p) => p.type === shelf.dataset.shelf);
      if (!pieces.length) { emptyRing(grid, EMPTY); continue; }
      const items = pieces.map(item);
      grid.replaceChildren(...items);
      arrive(items);
    }
    if (all.some((p) => p.available && p.price && open.some((s) => s.dataset.shelf === p.type))) sampleNote();
  }, (err) => open.forEach((shelf) => emptyRing($('[data-grid]', shelf), err.message)));
}

// ---------- product: the piece stands at the front of a ring of its neighbours; the spec sheet beside it ----------
const productRoot = $('[data-product]');
if (productRoot) {
  const hero = $('#piece-hero');
  const missing = (why) => {
    productRoot.hidden = true;
    $('[data-missing]').hidden = false;
    const line = $('[data-missing-why]');
    if (why) { line.textContent = why; line.hidden = false; }
  };
  const handle = params.get('handle');
  (handle ? getProduct(handle) : Promise.resolve(null)).then((product) => (product ? show(product) : missing()), (err) => missing(err.message));

  function show(product) {
    productRoot.removeAttribute('aria-busy');
    document.title = `${product.title} | The Global Collage`;
    const image = product.images[0], attrs = imageAttrs(image, '(min-width: 900px) 42vw, 76vw');
    Object.assign(hero, attrs);   // the sharper file takes over from the one that flew in
    if (image.lowres) hero.style.maxWidth = attrs.width + 'px';
    if (image.avg) hero.style.setProperty('--avg', image.avg);

    // the title in cut strips: a word each, a short word riding with the next one
    const title = $('[data-title]'), words = [];
    for (const word of product.title.split(/\s+/).filter(Boolean)) {
      if (words.length && words.at(-1).length <= 3 && !words.at(-1).includes(' ')) words[words.length - 1] += ' ' + word;
      else words.push(word);
    }
    title.setAttribute('aria-label', product.title);
    title.replaceChildren(...words.flatMap((w, i) => [i ? ' ' : '', el('span', 'strip strip--cobalt', w)]));

    const row = (sel, value, wanting) => {
      const dd = $(sel), known = value != null && value !== '';
      dd.textContent = known ? value : wanting;
      dd.classList.toggle('needs-content', !known);
    };
    row('[data-medium]', product.medium, 'Medium, coming from Camila');
    row('[data-dimensions]', product.dimensions, 'Size in inches, coming from Camila');
    row('[data-year]', product.year, 'Year, coming from Camila');

    const price = $('[data-price]'), shown = product.available ? formatPrice(product.price) : null;
    if (shown) { price.textContent = shown; price.hidden = false; sampleNote(); }
    const story = $('[data-story]');
    story.textContent = product.story ?? STORY_PLACEHOLDER;
    story.classList.toggle('needs-content', !product.story);
    if (product.badge) { const badge = $('[data-badge]'); badge.textContent = product.badge; badge.hidden = false; }
    $('[data-shipping]').textContent = product.shipping;
    const add = $('[data-add]');
    add.hidden = !product.available;
    $('[data-sold]').hidden = product.available;
    add.addEventListener('click', () => addToCart(product));

    // her other photos of the piece (a framed shot, the back...), as taped prints under the sheet
    const photos = product.images.slice(1).map((extra, i) => {
      const fig = el('figure', 'photo taped spec-photo');
      fig.dataset.arrive = i % 2 ? 'right' : 'left';
      fig.append(picture(extra, '(min-width: 900px) 30vw, 80vw', fig));
      return fig;
    });
    $('[data-photos]').append(...photos);
    arrive(photos);

    if (!image.lowres) closeLook(product, image);
    getProducts(product.type ? { type: product.type } : {}).then((list) => ring(product, list), () => {});
  }

  // the close look: the largest file at its own size on a dark ground, moved around by scrolling
  function closeLook(product, image) {
    const open = $('[data-look-open]'), look = $('[data-look]'), img = $('[data-look-img]');
    open.hidden = false;
    open.setAttribute('aria-label', `Look closely at ${product.title}`);
    look.setAttribute('aria-label', product.title);
    const centre = () => look.scrollTo((look.scrollWidth - look.clientWidth) / 2, (look.scrollHeight - look.clientHeight) / 2);
    open.addEventListener('click', () => {
      if (!img.getAttribute('src')) { img.width = imageAttrs(image).width; img.alt = image.alt; img.src = zoomSrc(image); }
      look.showModal();
      if (img.complete) centre(); else img.addEventListener('load', centre, { once: true });
    });
    $('[data-look-close]').addEventListener('click', () => look.close());
  }

  // up to six neighbours (the pieces after this one in the shop, same kind) ride a ring behind it. An empty first
  // place holds the front, where the piece itself stands, so the ring never turns away from it.
  function ring(product, list) {
    const at = list.findIndex((p) => p.handle === product.handle);
    const kin = [...list.slice(at + 1), ...list.slice(0, Math.max(at, 0))].filter((p) => p.handle !== product.handle).slice(0, 6);
    if (!kin.length) return;
    const root = $('[data-kin]'), ul = el('ul', 'orbit__ring kin-ring'), slot = el('li', 'orbit__item kin-slot');
    slot.setAttribute('aria-hidden', 'true');
    ul.append(slot, ...kin.map((p, i) => {
      const li = el('li', 'orbit__item'), a = el('a', 'print'), image = p.images[0];
      a.href = p.url; a.dataset.piece = '';
      a.style.setProperty('--ar', (image.width / image.height).toFixed(4));
      a.style.setProperty('--tilt', `${i % 2 ? 1.6 : -1.8}deg`);
      const img = picture(image, '200px', a);
      img.draggable = false;
      a.append(img);
      li.append(a);
      return li;
    }));
    // orbit() turns a ring to whatever takes focus or an arrow key; this one stands still behind the piece
    ul.addEventListener('focusin', (e) => e.stopImmediatePropagation());
    root.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopImmediatePropagation(); });
    root.append(ul);
    orbit(root, {
      lean: 1, yaw: 22, dim: .55, path: 'split', intro: true, introTurn: -1.6, introMs: 1700, watch: [hero],
      measure: (box) => {
        const r = box.getBoundingClientRect(), h = hero.getBoundingClientRect();
        if (!h.height) return null;   // the picture has no size yet: the ring waits for it
        const W = r.width, phone = W < 600, ph = Math.min(Math.max(h.height * .3, 84), 190);
        // a neighbour at the side is drawn at .7 of its size and .7 of R out: far enough to clear the piece, and
        // (not on a phone, where they may pass off the edges) near enough to stay inside the column
        const clear = (h.width / 2 + ph * .4 + 12) / .7, inside = (W / 2 - ph * .3) / .7;
        box.style.setProperty('--ph', `${Math.round(ph)}px`);
        return {
          cx: h.left - r.left + h.width / 2, cy: h.top - r.top + h.height * .15,
          R: phone ? clear : Math.min(clear, inside), B: h.height * .5,
          roll: phone ? .05 : .08, k: .3, depth: .94,
        };
      },
    });
  }
}
