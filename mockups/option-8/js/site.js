// The Global Collage — Option 8 "The Floor". One module, loaded on every page from the <head>:
//   <script type="module" blocking="render" src="js/site.js"></script>
// It runs before the first paint (the page is parsed by then), so the floor is already in place.
//
// What it does: the two floors (the hero floor you travel over, the patch in "The work"), the chosen
// piece, the pad (map, Menu, Cart), the menu and cart panels on top of the shop layer, the newsletter
// forms, and the shared motion kit. With this file missing the page is plain: words, then prints in a grid.
//
// EXPORTS (for page scripts:  import { pieceCard, addToCart, openCart, makeFloor } from './site.js')
//   pieceCard(product, { sizes })   -> <article class="card">: the link (data-piece) with the whole piece as a
//                                      print, title, year, "Original, 1 of 1", price, and an "Add to cart"
//                                      control when it can be bought, a "Sold" mark when it cannot.
//   addToCart(product, button)      -> adds, then opens the cart; a refusal is shown in the cart.
//   openCart(from) / closePanels()  -> open the cart panel (focus returns to `from`) / close menu and cart.
//   makeFloor(root, options)        -> turns [data-floor] into a plane you drag. See THE FLOOR below.
import { init, reduced, magnetic } from '../../shared/motion.js';
import { getProducts, getProduct, cart, formatPrice, imageAttrs, mountSampleNote } from '../../shared/shop/shop.js';
import { wireForm } from '../../shared/forms.js';

const html = document.documentElement;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const el = (tag, className, text) => { const n = document.createElement(tag); if (className) n.className = className; if (text != null) n.textContent = text; return n; };
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const narrow = matchMedia('(max-width: 899px)');
const mouse = matchMedia('(hover: hover) and (pointer: fine)');

html.classList.add('is-live');
// arriving by a page transition: the floor is simply there, it does not play its load-in again
addEventListener('pagereveal', (e) => { if (e.viewTransition) html.classList.add('via-vt'); });

// ---------- panels: menu and cart, both opened from the pad ----------
const pad = $('.pad'), scrim = $('.scrim');
const panels = { menu: $('#menu'), cart: $('#cart') };
const toggles = { menu: $('[data-menu-toggle]'), cart: $('[data-cart-toggle]') };
const names = { menu: 'Menu', cart: 'Cart' };
const behind = $$('main, .footer, .skip'); // switched off while a panel is open
let openName = null, returnTo = null, floorSeen = true;
for (const panel of Object.values(panels)) { if (panel) { panel.hidden = false; panel.inert = true; } }
const paintPad = () => pad?.classList.toggle('is-away', !floorSeen || !!openName); // the map folds away when it has nothing to show

// The pad steps aside: it never sits on a headline, a button, a price or a field. Whatever of those comes under its
// resting place (by scrolling, or by dragging the strip of cards) sends it below the screen edge, and it comes back once
// the spot is clear. Never while a panel is open; keyboard focus brings it back (CSS). The hero floor is the pad's own ground.
// ponytail: measures every guarded thing (about 60) on scrolled frames and three times a second; cache the list if a page grows long.
const GUARDED = 'main :is(h2, h3, .btn, .link, button, input, .about__open, .card__title, .card__price, .way, .proof__names li, .services__list span):not(.floor *, .sr-only), .footer :is(a, button, input)';
const textRange = document.createRange();
// where a thing really is: a button or a field is its box; a headline is its words, line by line (its block runs the full column)
function boxesOf(node) {
  if (node.matches('input, button, .btn')) return [node.getBoundingClientRect()];
  const boxes = [], walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  while (walk.nextNode()) { textRange.selectNodeContents(walk.currentNode); boxes.push(...textRange.getClientRects()); }
  return boxes;
}
let asideFrame = 0, asideBack = 0;
function stepAside() {
  asideFrame = 0;
  const shown = pad.classList.contains('is-away') ? $('.pad__bar', pad) : pad, gap = 8;
  const r = shown.getBoundingClientRect(), dy = new DOMMatrixReadOnly(getComputedStyle(pad).transform).f; // dy: how far aside it is right now
  const hit = !openName && $$(GUARDED).some((node) => boxesOf(node).some((b) => b.width > 0 && b.right > r.left - gap && b.left < r.right + gap && b.bottom > r.top - dy - gap && b.top < r.bottom - dy + gap));
  if (hit) { clearTimeout(asideBack); asideBack = 0; pad.classList.add('is-aside'); }
  else if (openName) { clearTimeout(asideBack); asideBack = 0; pad.classList.remove('is-aside'); }
  else if (!asideBack && pad.classList.contains('is-aside')) asideBack = setTimeout(() => { asideBack = 0; pad.classList.remove('is-aside'); }, 350);
}
const watchPad = () => { if (pad) asideFrame ||= requestAnimationFrame(stepAside); };
addEventListener('scroll', watchPad, { passive: true });
addEventListener('resize', watchPad);
setInterval(watchPad, 350);

function setPanel(name, from) {
  if (name === openName || (name && !panels[name])) return;
  if (name && !openName) returnTo = from ?? document.activeElement;
  openName = name;
  if (name !== 'cart') $('.tgc-checkout-note')?.remove(); // the checkout note belongs to the open cart: it leaves with it
  for (const [key, panel] of Object.entries(panels)) {
    if (!panel) continue;
    const on = key === name;
    panel.classList.toggle('is-open', on);
    panel.inert = !on;
    toggles[key]?.setAttribute('aria-expanded', String(on));
    const label = toggles[key]?.querySelector('[data-label]');
    if (label) label.textContent = on ? 'Close' : names[key];
  }
  behind.forEach((node) => { node.inert = !!name; });
  scrim?.classList.toggle('is-on', !!name);
  html.classList.toggle('is-locked', !!name);
  paintPad();
  watchPad();
  if (name) panels[name].focus({ preventScroll: true });
  else { returnTo?.focus?.({ preventScroll: true }); returnTo = null; }
}
export const openCart = (from) => setPanel('cart', from);
export const closePanels = () => setPanel(null);

toggles.menu?.addEventListener('click', () => setPanel(openName === 'menu' ? null : 'menu', toggles.menu));
toggles.cart?.addEventListener('click', () => setPanel(openName === 'cart' ? null : 'cart', toggles.cart));
$$('[data-close]').forEach((node) => node.addEventListener('click', closePanels));
addEventListener('keydown', (e) => {
  if (!openName) return;
  if (e.key === 'Escape') { e.preventDefault(); closePanels(); return; }
  if (e.key !== 'Tab') return;
  // focus stays inside the open panel and the pad's two buttons
  const stops = [panels[openName], $('.pad__bar')].flatMap((root) => $$('a[href], button:not([disabled]), input, select, textarea', root)).filter((n) => n.getClientRects().length);
  if (!stops.length) return;
  const first = stops[0], last = stops.at(-1), at = document.activeElement;
  if (e.shiftKey && (at === first || !stops.includes(at))) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && (at === last || !stops.includes(at))) { e.preventDefault(); first.focus(); }
});
addEventListener('pageshow', (e) => { if (e.persisted) closePanels(); }); // Back must not bring a panel back open

// ---------- the cart, drawn from the shop layer ----------
const cartLines = $('[data-cart-lines]'), cartEmpty = $('[data-cart-empty]'), cartFoot = $('[data-cart-foot]');
const cartSubtotal = $('[data-cart-subtotal]'), cartStatus = $('[data-cart-status]'), checkout = $('[data-checkout]');
const say = (text = '', state = '') => { if (cartStatus) { cartStatus.textContent = text; cartStatus.dataset.state = state; } };
const fail = (err) => say(err?.message ?? 'Something went wrong. Please try again.', 'error');

function cartLine(line) {
  const li = el('li', 'cart__line');
  const thumb = el('a', 'cart__thumb'); thumb.href = line.url; thumb.tabIndex = -1; thumb.setAttribute('aria-hidden', 'true');
  const img = el('img'); Object.assign(img, imageAttrs(line.image, '64px')); img.alt = '';
  thumb.append(img);
  const name = el('a', 'cart__name', line.title); name.href = line.url;
  const remove = el('button', 'cart__remove', 'Remove'); remove.type = 'button'; remove.setAttribute('aria-label', `Remove ${line.title}`);
  remove.addEventListener('click', () => { remove.disabled = true; cart.remove(line.id).then(() => panels.cart?.focus({ preventScroll: true }), fail); });
  li.append(thumb, name, el('span', 'cart__price', formatPrice(line.price) ?? ''), el('span', 'cart__mark', line.type === 'original' ? 'Original, 1 of 1' : ''), remove);
  return li;
}
let lastCount = null;
function paintCart(c) {
  for (const badge of $$('[data-cart-count]')) {
    badge.textContent = c.count;
    if (lastCount !== null && c.count > lastCount && !reduced) { badge.classList.remove('is-bump'); void badge.offsetWidth; badge.classList.add('is-bump'); }
  }
  lastCount = c.count;
  toggles.cart?.setAttribute('aria-label', `Cart, ${c.count} ${c.count === 1 ? 'item' : 'items'}`);
  if (!cartLines) return;
  cartLines.replaceChildren(...c.lines.map(cartLine));
  cartEmpty.hidden = c.count > 0;
  cartFoot.hidden = c.count === 0;
  cartSubtotal.textContent = formatPrice(c.subtotal) ?? '';
}
$$('[data-cart-count]').forEach((badge) => { badge.textContent = cart.count(); });
cart.subscribe((c) => { say(); paintCart(c); });
cart.get().then(paintCart, () => {});
checkout?.addEventListener('click', () => { say(); cart.checkout().catch(fail); }); // sample mode: the layer shows its own notice

export function addToCart(product, button) {
  if (button) button.disabled = true;
  say();
  return cart.add(product).then(() => openCart(button), (err) => { openCart(button); fail(err); }).finally(() => { if (button) button.disabled = false; });
}

// ---------- the piece card: a print with its caption (Home's featured six; the shop grid later) ----------
export function pieceCard(product, { sizes = '(max-width: 899px) 60vw, 22vw' } = {}) {
  const image = product.images[0], attrs = imageAttrs(image, sizes);
  const card = el('article', 'card'); card.dataset.handle = product.handle;
  const link = el('a', 'card__link'); link.href = product.url; link.setAttribute('data-piece', ''); link.draggable = false;
  const print = el('span', 'card__print'), img = el('img');
  img.loading = 'lazy'; img.decoding = 'async'; img.draggable = false;
  Object.assign(img, attrs);
  if (image.lowres) print.style.maxWidth = `${attrs.width}px`; // never wider than the file
  print.append(img);
  const head = el('span', 'card__head');
  head.append(el('span', 'card__title', product.title), el('span', 'card__year', product.year ?? ''));
  link.append(print, head, el('span', 'card__mark', product.badge ?? ''), el('span', 'card__price', product.available ? formatPrice(product.price) ?? '' : ''));
  card.append(link);
  if (product.available) {
    const add = el('button', 'card__add', 'Add to cart'); add.type = 'button'; add.setAttribute('aria-label', `Add ${product.title} to cart`);
    add.addEventListener('click', () => addToCart(product, add));
    card.append(add);
  } else {
    card.classList.add('is-sold');
    card.append(el('span', 'card__sold', 'Sold'));
  }
  return card;
}

// ---------- THE FLOOR ----------
// makeFloor(root, { map, label, onClick, onLayout }) -> { set, home, center, layout, freeze, size(), at(), items() }
//   root      [data-floor]: a window; inside it .floor__plane, the big plane, and on the plane .spot things.
//             The plane's size and home point come from CSS (--pw --ph --hx --hy, in floor units).
//   map       optional: the pad's map button (.map__chart with .map__view inside), kept in step.
//   label(e)  optional: the word shown beside a mouse ('' = none). Default: "Drag" over bare floor.
//   onClick(e) optional: every click that was not the end of a drag (capture phase).
//   onLayout({ items, W, H }) optional: after every measure (first run, resize).
// One element moves: the plane, by transform. A drag pans it and it coasts on release; the wheel and a
// vertical swipe are never listened to (touch-action: pan-y), so the page always scrolls. Arrow keys pan
// while focus is inside; at an edge the key is left to the page. Pictures near the view are loaded early.
const tagEl = mouse.matches ? document.body.appendChild(el('span', 'cursor-tag')) : null;
tagEl?.setAttribute('aria-hidden', 'true');
function tag(text, e) {
  if (!tagEl) return;
  tagEl.classList.toggle('is-on', !!text);
  if (!text) return;
  if (tagEl.textContent !== text) tagEl.textContent = text;
  tagEl.style.transform = `translate3d(${e.clientX + 14}px,${e.clientY + 18}px,0)`;
}

export function makeFloor(root, { map = null, label, onClick, onLayout } = {}) {
  const plane = $('.floor__plane', root), chart = map && $('.map__chart', map), view = map && $('.map__view', map);
  let x = 0, y = 0, s = 1, W = 1, H = 1, vw = 1, vh = 1, mapK = 0, items = [], raf = 0, drag = null, dragged = false, ready = false, slim = narrow.matches;
  const locked = () => root.classList.contains('is-picked');
  const fit = (v, size, port) => (size <= port ? (port - size) / 2 : clamp(v, port - size, 0));

  function paint() {
    plane.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${s.toFixed(4)})`;
    if (view) {
      view.style.width = `${(vw / s * mapK).toFixed(1)}px`; view.style.height = `${(vh / s * mapK).toFixed(1)}px`;
      view.style.transform = `translate(${(-x / s * mapK).toFixed(1)}px,${(-y / s * mapK).toFixed(1)}px)`;
    }
    // pictures are fetched as they come near, not when the browser thinks a clipped picture is visible
    for (const it of items) {
      if (it.near || !it.img) continue;
      const l = it.x * s + x, t = it.y * s + y;
      if (l < vw + 320 && l + it.w * s > -320 && t < vh + 320 && t + it.h * s > -320) { it.near = true; it.img.loading = 'eager'; }
    }
  }
  function set(nx, ny, ns = 1, { glide = false, free = false } = {}) {
    cancelAnimationFrame(raf);
    s = ns; x = free ? nx : fit(nx, W * s, vw); y = free ? ny : fit(ny, H * s, vh);
    const g = glide && !reduced;
    root.classList.toggle('is-gliding', g); map?.classList.toggle('is-gliding', g);
    paint();
  }
  // take the plane where it is right now, mid-glide, so a hand can catch it
  function freeze() {
    if (!root.classList.contains('is-gliding')) return;
    const m = new DOMMatrixReadOnly(getComputedStyle(plane).transform);
    set(m.e, m.f, m.a, { free: true });
  }
  const center = (fx, fy, glide = false) => set(vw / 2 - fx, vh / 2 - fy, 1, { glide });
  const unit = () => W / (parseFloat(getComputedStyle(plane).getPropertyValue('--pw')) || W);
  const home = (glide = false) => { const cs = getComputedStyle(plane), u = unit(); center((parseFloat(cs.getPropertyValue('--hx')) || 0) * u, (parseFloat(cs.getPropertyValue('--hy')) || 0) * u, glide); };

  function layout() {
    const fx = (vw / 2 - x) / s / W, fy = (vh / 2 - y) / s / H; // what was in the middle stays in the middle
    const turned = slim !== (slim = narrow.matches); // the other layout (the review frame's Phone switch, a narrowed window) is a new floor: back to its headline
    W = plane.offsetWidth || 1; H = plane.offsetHeight || 1; vw = root.clientWidth; vh = root.clientHeight;
    items = $$('.spot', plane).map((node) => ({ node, link: $('a', node), img: $('img', node), x: node.offsetLeft, y: node.offsetTop, w: node.offsetWidth, h: node.offsetHeight, near: false, lift: 0 }));
    if (chart) { chart.style.aspectRatio = `${W} / ${H}`; mapK = chart.clientWidth / W; }
    onLayout?.({ items, W, H });
    if (ready && !turned) set(vw / 2 - fx * W, vh / 2 - fy * H); else home();
    ready = true;
  }

  // ---- dragging, with a little inertia ----
  function coast(vx, vy) {
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(now - last, 40); last = now;
      const k = 0.94 ** (dt / 16.7); vx *= k; vy *= k;
      const px = x, py = y;
      set(x + vx * dt, y + vy * dt);
      if (Math.hypot(vx, vy) > 0.03 && (x !== px || y !== py)) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  root.addEventListener('pointerdown', (e) => {
    if (e.button || locked() || e.target.closest('[data-nodrag]')) return;
    freeze(); cancelAnimationFrame(raf);
    drag = { id: e.pointerId, touch: e.pointerType === 'touch', sx: e.clientX, sy: e.clientY, ox: x, oy: y, lx: e.clientX, ly: e.clientY, lt: e.timeStamp, vx: 0, vy: 0, moved: false };
  });
  root.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) { hover(e); return; }
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < 6) return;
      if (drag.touch && Math.abs(dy) > Math.abs(dx)) { drag = null; return; } // a vertical swipe belongs to the page
      drag.moved = true;
      try { root.setPointerCapture(e.pointerId); } catch {}
      root.classList.add('is-dragging'); tag('');
    }
    const dt = Math.max(e.timeStamp - drag.lt, 1);
    drag.vx = 0.6 * (e.clientX - drag.lx) / dt + 0.4 * drag.vx; drag.vy = 0.6 * (e.clientY - drag.ly) / dt + 0.4 * drag.vy;
    drag.lx = e.clientX; drag.ly = e.clientY; drag.lt = e.timeStamp;
    set(drag.ox + dx, drag.oy + dy);
  });
  const drop = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    root.classList.remove('is-dragging');
    if (!d.moved) return;
    dragged = true; setTimeout(() => { dragged = false; }, 80); // the click that ends a drag opens nothing
    if (e.type === 'pointerup' && !reduced && e.timeStamp - d.lt < 90) coast(d.vx, d.vy);
  };
  root.addEventListener('pointerup', drop);
  root.addEventListener('pointercancel', drop);
  root.addEventListener('dragstart', (e) => e.preventDefault());
  root.addEventListener('click', (e) => {
    if (dragged) { dragged = false; e.preventDefault(); e.stopPropagation(); return; }
    onClick?.(e);
  }, true);

  // ---- the pointer: a word beside it, and the prints near it lift ----
  let queued = false, last = null;
  function hover(e) {
    if (e.pointerType !== 'mouse') return;
    tag(label ? label(e) : e.target.closest('a, button') ? '' : 'Drag', e);
    if (reduced || locked()) return;
    last = e;
    if (!queued) { queued = true; requestAnimationFrame(lift); }
  }
  function lift() {
    queued = false;
    const r = root.getBoundingClientRect(), px = (last.clientX - r.left - x) / s, py = (last.clientY - r.top - y) / s;
    for (const it of items) {
      const d = Math.hypot(px - it.x - it.w / 2, py - it.y - it.h / 2);
      const v = Math.round(clamp(1.3 - d / (it.w * 0.8), 0, 1) * 20) / 20;
      if (v === it.lift) continue;
      it.lift = v; it.node.style.setProperty('--lift', v); it.node.style.zIndex = v > 0.5 ? 2 : '';
    }
  }
  const settle = () => { tag(''); for (const it of items) if (it.lift) { it.lift = 0; it.node.style.removeProperty('--lift'); it.node.style.zIndex = ''; } };
  root.addEventListener('pointerleave', settle);

  // ---- keyboard: arrows travel; a print reached with Tab is brought into view ----
  root.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
    if (!step || locked() || e.target.closest('input, textarea, select')) return;
    const px = x, py = y;
    set(x + step[0] * 180, y + step[1] * 180, 1, { glide: true });
    if (x !== px || y !== py) e.preventDefault(); // at the edge of the floor the key goes on to the page
  });
  root.addEventListener('focusin', (e) => {
    const it = items.find((i) => i.node.contains(e.target));
    if (!it || locked() || drag || !e.target.matches(':focus-visible')) return;
    root.scrollIntoView({ block: 'nearest' });
    const l = it.x + x, t = it.y + y;
    if (l < 12 || t < 12 || l + it.w > vw - 12 || t + it.h > vh - 12) center(it.x + it.w / 2, it.y + it.h / 2, true);
  });

  if (!root.hasAttribute('tabindex')) root.tabIndex = 0;
  layout();
  new ResizeObserver(() => { if (root.clientWidth !== vw || root.clientHeight !== vh || plane.offsetWidth !== W) layout(); }).observe(root);
  return { set, home, center, layout, freeze, settle, size: () => ({ W, H, vw, vh }), at: () => ({ x, y, s }), items: () => items };
}

// ---------- the hero floor: the map, and choosing a print ----------
const heroRoot = $('[data-floor="hero"]');
if (heroRoot) {
  const map = $('.pad__map'), chart = $('.map__chart'), panel = $('.pick', heroRoot), copy = $('.floor__copy', heroRoot);
  const part = (name) => $(`[data-pick-${name}]`, panel);
  const products = new Map();
  let picked = null, before = null;
  if (panel) panel.inert = true;

  const hero = makeFloor(heroRoot, {
    map,
    label: (e) => {
      if (e.target.closest('.pick, .logo, .skip')) return '';
      const a = e.target.closest('.print a');
      if (picked) return a ? 'Open its page' : 'Back';
      return a ? 'View' : e.target.closest('a, button') ? '' : 'Drag';
    },
    onClick: (e) => {
      if (e.target.closest('.pick, .logo, .skip, .floor__copy a')) return;
      const a = e.target.closest('.print a');
      if (picked) { if (a === picked.link) return; e.preventDefault(); unpick(); return; } // a second press on the chosen print opens its page
      if (a) { e.preventDefault(); pick(hero.items().find((it) => it.link === a)); }
    },
    onLayout: ({ items, W, H }) => {
      if (picked) { picked.node.classList.remove('is-picked'); heroRoot.classList.remove('is-picked'); panel.inert = true; picked = null; }
      if (!chart) return;
      // the map: every print as a fleck of its own colour, the headline as a blue bar
      $$('i', chart).forEach((i) => i.remove());
      const dot = (l, t, w, h, className, color) => { const i = el('i', className); i.style.cssText = `left:${(l / W * 100).toFixed(2)}%;top:${(t / H * 100).toFixed(2)}%;width:${(w / W * 100).toFixed(2)}%;height:${(h / H * 100).toFixed(2)}%;${color ? `background:${color}` : ''}`; chart.prepend(i); };
      for (const it of items) dot(it.x, it.y, it.w, it.h, '', it.node.dataset.avg || '#8a8580');
      const title = $('.floor__title', copy);
      if (title) dot(copy.offsetLeft, copy.offsetTop + title.offsetHeight * 0.3, title.offsetWidth * 0.7, title.offsetHeight * 0.4, 'map__copy');
    },
  });

  // each print slides in from the side of the floor it lies on
  const { W, H } = hero.size();
  for (const it of hero.items()) {
    const dx = it.x + it.w / 2 - W / 2, dy = it.y + it.h / 2 - H / 2, d = Math.hypot(dx, dy) || 1;
    it.node.style.setProperty('--fx', `${(dx / d * 90).toFixed(0)}px`); it.node.style.setProperty('--fy', `${(dy / d * 90).toFixed(0)}px`);
  }

  function fill(it) {
    const p = products.get(it.link.dataset.piece);
    part('title').textContent = p?.title ?? $('.print__cap', it.node)?.firstChild?.textContent.trim() ?? '';
    part('year').textContent = p?.year ?? '';
    part('mark').textContent = p?.badge ?? '';
    part('price').textContent = p ? (p.available ? formatPrice(p.price) ?? '' : 'Sold') : '';
    part('add').hidden = !p?.available;
    part('link').href = it.link.href;
  }
  function pick(it) {
    if (!it || picked === it) return;
    if (!picked) before = hero.at();
    picked?.node.classList.remove('is-picked');
    picked = it; hero.settle(); tag('');
    it.node.classList.add('is-picked'); heroRoot.classList.add('is-picked');
    fill(it); panel.inert = false;
    // the room left for the picture: beside the panel on wide screens, above it on narrow ones
    const { vw, vh } = hero.size(), m = narrow.matches ? 18 : 44;
    const box = narrow.matches ? { l: m, t: 92, r: vw - m, b: vh - panel.offsetHeight - m } : { l: m, t: m, r: vw - panel.offsetWidth - m, b: vh - m };
    const p = products.get(it.link.dataset.piece), image = p?.images[0];
    const most = image?.lowres ? imageAttrs(image).width / it.w : 5; // a small file is never shown wider than it is
    const k = Math.max(1, Math.min((box.r - box.l) / it.w, (box.b - box.t) / it.h, most));
    hero.set((box.l + box.r) / 2 - (it.x + it.w / 2) * k, (box.t + box.b) / 2 - (it.y + it.h / 2) * k, k, { glide: true, free: true });
    if (image && it.img) { const a = imageAttrs(image, `${Math.ceil(it.w * k)}px`); it.img.sizes = a.sizes; it.img.srcset = a.srcset; } // a sharper file for the close look
    panel.focus({ preventScroll: true });
  }
  function unpick({ glide = true, refocus = true } = {}) {
    if (!picked) return;
    const it = picked; picked = null;
    it.node.classList.remove('is-picked'); heroRoot.classList.remove('is-picked');
    const inside = panel.contains(document.activeElement);
    panel.inert = true;
    hero.set(before.x, before.y, 1, { glide });
    if (refocus && inside) it.link.focus({ preventScroll: true });
  }
  part('close')?.addEventListener('click', () => unpick());
  part('add')?.addEventListener('click', (e) => { const p = picked && products.get(picked.link.dataset.piece); if (p) addToCart(p, e.currentTarget); });
  heroRoot.addEventListener('keydown', (e) => { if (e.key === 'Escape' && picked && !openName) unpick(); });
  addEventListener('pageshow', (e) => { if (e.persisted) unpick({ glide: false }); });

  // what the shop layer knows about each print (price, mark, sold); a sold piece stays on the floor
  getProducts().then((list) => { for (const p of list) products.set(p.handle, p); if (picked) fill(picked); }, () => {});

  // the map: press or drag on it and the view goes there
  if (map) {
    let from = null;
    const go = (e, glide) => {
      const r = chart.getBoundingClientRect(), size = hero.size();
      unpick({ glide: false, refocus: false });
      if (!glide) hero.freeze();
      hero.center(clamp((e.clientX - r.left) / r.width, 0, 1) * size.W, clamp((e.clientY - r.top) / r.height, 0, 1) * size.H, glide);
      if (scrollY > 4) scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    };
    map.addEventListener('pointerdown', (e) => { if (e.button) return; map.setPointerCapture(e.pointerId); from = { x: e.clientX, y: e.clientY, moved: false }; go(e, true); });
    map.addEventListener('pointermove', (e) => { if (!from) return; if (!from.moved && Math.hypot(e.clientX - from.x, e.clientY - from.y) < 4) return; from.moved = true; go(e, false); });
    for (const type of ['pointerup', 'pointercancel']) map.addEventListener(type, () => { from = null; });
    map.addEventListener('click', (e) => { if (e.detail === 0) { unpick({ glide: false, refocus: false }); hero.home(true); } }); // keyboard: back to the headline
  }

  // away from the floor the map has nothing to show, and a chosen piece is put back
  new IntersectionObserver(([entry]) => { floorSeen = entry.isIntersecting; if (!floorSeen) unpick({ glide: false, refocus: false }); paintPad(); }, { threshold: 0.12 }).observe(heroRoot);
} else { floorSeen = false; paintPad(); }

// ---------- the patch in "The work": the featured six, drawn by the shop layer, on a strip of floor ----------
for (const root of $$('[data-floor="patch"]')) {
  const floor = makeFloor(root);
  Promise.all($$('li[data-handle]', root).map((li) => getProduct(li.dataset.handle).then((product) => { if (product) li.replaceChildren(pieceCard(product, { sizes: li.dataset.sizes || undefined })); }, () => {})))
    .then(() => floor.layout());
}

// ---------- newsletter fields, the sample-price note, the motion kit ----------
$$('form[data-newsletter]').forEach((form) => wireForm(form, { kind: 'newsletter' }));
mountSampleNote(); // this page shows prices
{ const note = $('.tgc-sample-note'), patch = $('.work .patch'); if (note && patch) patch.after(note); } // Home: the note sits in the page, under the cards it is about
init({ pointer: false }); // nothing here uses --mx / --my, so the kit does not need to follow the pointer
magnetic('[data-pull]', { strength: 0.2, radius: 60 });
