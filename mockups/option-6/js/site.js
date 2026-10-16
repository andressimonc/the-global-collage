// Option 6 — Inside the Piece. The one script every page loads, in the <head>, after the stylesheets:
//   <script type="module" blocking="render" src="js/site.js"></script>
// blocking="render" holds the first paint until this has run, so the arrival is set before anyone sees
// the page. (product.html keeps the motion kit's own pieceHero() block in front of it.)
//
// What it does on every page: the motion kit's init(); the first arrival (the world glides together from
// five fragments while the page rises); whole-pixel scenes; the tab riding the page's top edge; the menu and cart sheets;
// the cart interface on the shop layer; every form[data-newsletter]; the sliding words in .btn/.link;
// any [data-featured="handle,handle"] box filled with pieceCards; the sample note on pages with prices
// ([data-featured] or <body data-shop>). Nothing is hidden unless this script hid it.
//
// EXPORTS
//   pieceCard(product, { sizes })   -> <article class="piece">: the shared shop card (whole piece, title, year,
//                                      "Original, 1 of 1", price or Sold, and an Add control when available)
//   renderPieces(box, products, { sizes })  fills box (.pieces) with cards, reveals them, marks the ones in the cart
//   openCart(opener?) / openSheet(dialog, opener?) / closeSheet(dialog)   (in markup: data-menu-open, data-cart-open,
//                                   data-sheet-open="<dialog id>", and data-close inside a sheet)
//   guestWorld(scene, image | null) slides that picture in as the scene's world (pointer devices; null puts it back)
//   shatter(worldEl)                the five-fragment arrival on a .scene__world
//   dress(root = document)          gives .btn and .link inside root their sliding words (call after you add some)
//   cutFor(handle)                  -> { src, srcset, width, height } of the cut-out lifted from that piece, or null
import { init, reduced, reveal, magnetic } from '../../shared/motion.js';
import { getProducts, cart, formatPrice, imageAttrs, mountSampleNote } from '../../shared/shop/shop.js';
import { wireForm } from '../../shared/forms.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const html = document.documentElement;
const pointer = matchMedia('(hover: hover) and (pointer: fine)');
const wide = matchMedia('(min-width: 720px)');
html.classList.add('js');

// ---------- first arrival ----------
// [clip polygon, from x (vw), from y (vh), turn (deg)]: five pieces that tile the screen
const SHARDS = [
  ['0 0, 46% 0, 38% 44%, 0 36%', -16, -12, -7],
  ['46% 0, 100% 0, 100% 42%, 62% 58%, 38% 44%', 14, -14, 5],
  ['0 36%, 38% 44%, 30% 100%, 0 100%', -18, 10, 6],
  ['38% 44%, 62% 58%, 56% 100%, 30% 100%', 0, 22, -4],
  ['62% 58%, 100% 42%, 100% 100%, 56% 100%', 16, 12, -6],
];
export function shatter(world) {
  const base = $('.world', world);
  if (!base || reduced) return;
  const layer = el('div', 'shards is-waiting');
  layer.setAttribute('aria-hidden', 'true');
  SHARDS.forEach(([shape, dx, dy, rot], i) => {
    const shard = el('div', 'shard');
    shard.style.cssText = `--i:${i};--dx:${dx}vw;--dy:${dy}vh;--rot:${rot}deg;clip-path:polygon(${shape})`;
    const copy = base.cloneNode();
    copy.removeAttribute('fetchpriority');
    shard.append(copy);
    layer.append(shard);
  });
  world.classList.add('is-shattered');
  world.append(layer);
  const done = () => { world.classList.remove('is-shattered'); layer.remove(); };
  const go = () => { layer.classList.remove('is-waiting'); layer.lastChild.addEventListener('animationend', done, { once: true }); setTimeout(done, 2200); };
  // the pieces wait (still invisible) for the picture, but never longer than 1.2 s
  if (base.complete) go();
  else { let gone = false; const once = () => { if (!gone) { gone = true; go(); } }; base.addEventListener('load', once); base.addEventListener('error', once); setTimeout(once, 1200); }
}
function arrive() {
  if (reduced) return;
  // a visit from outside this site (or a reload) gets the arrival; moving between its pages gets the page transition
  let inside = false;
  try { inside = new URL(document.referrer).pathname.startsWith(location.pathname.replace(/[^/]*$/, '')); } catch { /* no referrer */ }
  if (inside && performance.getEntriesByType('navigation')[0]?.type !== 'reload') return;
  html.classList.add('is-arriving');
  const world = $('.scene__world[data-shatter]');
  if (world) shatter(world);
  setTimeout(() => html.classList.remove('is-arriving'), 2800);
}
arrive();
init();

// ---------- whole-pixel scenes ----------
// A scene that ends on a fraction of a pixel leaves a hairline of world between its last leaf and the next
// scene's first one. So each scene is rounded up to a whole pixel (one that is also whole on this screen's
// device pixels): on its last leaf when it ends with one, otherwise on the scene itself. Measured again
// whenever a scene changes size.
function fit(scene) {
  const target = $(':scope > .page > .leaf:last-child', scene) ?? scene, dpr = devicePixelRatio || 1;
  target.style.minHeight = '';
  const natural = scene.getBoundingClientRect().height;
  let whole = Math.ceil(natural - 0.01);
  for (let n = 0; n < 8 && Math.abs(whole * dpr - Math.round(whole * dpr)) > 0.01; n++) whole++;
  let ask = target.getBoundingClientRect().height + whole - natural;
  for (let n = 0; n < 4 && whole - natural > 0.008; n++) { // layout can land 1/64 px short of what was asked: ask again for the rest
    target.style.minHeight = `${ask}px`;
    const got = scene.getBoundingClientRect().height;
    if (Math.abs(got - whole) < 0.008) break;
    ask += whole - got;
  }
}
if ('ResizeObserver' in window) {
  const sizes = new ResizeObserver((entries) => entries.forEach((e) => fit(e.target)));
  $$('.scene').forEach((scene) => sizes.observe(scene));
}

// ---------- the tab rides the first leaf's top edge, then follows down (wide screens) ----------
const tab = $('.tab'), firstLeaf = $('.leaf');
const docTop = (n) => { let y = 0; for (; n; n = n.offsetParent) y += n.offsetTop; return y; };
function ride() {
  if (!tab || !firstLeaf) return;
  const y = wide.matches ? Math.max(0, docTop(firstLeaf) - scrollY - tab.offsetHeight) : 0;
  tab.style.setProperty('--tab-y', `${y}px`);
  tab.classList.toggle('is-riding', y > 0);
}
addEventListener('scroll', ride, { passive: true });
addEventListener('resize', ride, { passive: true });
ride();

// ---------- sliding words ----------
export function dress(root = document) {
  for (const b of $$('.btn, .link', root)) {
    if (b.dataset.dressed != null || b.children.length) continue;
    const text = b.textContent.trim(), t = el('span', 't'), inner = el('span', 't__in', text);
    b.dataset.dressed = '';
    inner.dataset.t = text;
    if (!b.hasAttribute('aria-label')) b.setAttribute('aria-label', text); // the sliding copy is not read twice
    t.append(inner);
    b.replaceChildren(t);
  }
}
dress();
magnetic('.btn:not(.btn--full), .tab', { strength: 0.2, radius: 70 });

// ---------- sheets (menu, cart, any dialog.sheet): modal dialogs, so focus is trapped and Escape closes ----------
const menu = $('#menu'), cartEl = $('#cart');
const openers = new WeakMap();
export function openSheet(sheet, opener) {
  if (!sheet || sheet.open) return;
  openers.set(sheet, opener ?? document.activeElement);
  opener?.setAttribute('aria-expanded', 'true');
  sheet.showModal();
  void sheet.offsetWidth; // the closed position is painted first, so it slides
  sheet.classList.add('is-open');
  if (sheet === cartEl) mountSampleNote();
}
export function closeSheet(sheet) {
  if (!sheet?.open || sheet.classList.contains('is-closing')) return;
  const done = () => { sheet.classList.remove('is-closing'); sheet.close(); };
  sheet.classList.remove('is-open');
  if (reduced) return done();
  sheet.classList.add('is-closing');
  setTimeout(done, 480);
}
export const openCart = (opener) => openSheet(cartEl, opener);
for (const sheet of $$('dialog.sheet')) {
  sheet.addEventListener('cancel', (e) => { e.preventDefault(); closeSheet(sheet); }); // Escape
  sheet.addEventListener('click', (e) => { if (e.target === sheet || e.target.closest('[data-close], .menu__world')) closeSheet(sheet); });
  sheet.addEventListener('close', () => {
    const opener = openers.get(sheet);
    opener?.setAttribute?.('aria-expanded', 'false');
    opener?.focus?.({ preventScroll: true });
  });
}
for (const a of $$('[data-menu-open]')) { // without script it is a link down to the footer's navigation
  a.setAttribute('role', 'button'); a.setAttribute('aria-haspopup', 'dialog'); a.setAttribute('aria-expanded', 'false');
  a.addEventListener('keydown', (e) => { if (e.key === ' ') { e.preventDefault(); a.click(); } });
}
document.addEventListener('click', (e) => {
  const m = e.target.closest('[data-menu-open]'), c = e.target.closest('[data-cart-open]'), other = e.target.closest('[data-sheet-open]');
  if (m) { e.preventDefault(); openSheet(menu, m); } else if (c) openSheet(cartEl, c);
  else if (other) openSheet(document.getElementById(other.dataset.sheetOpen), other); // any other dialog.sheet, e.g. the close look
});

// the menu: each page name brings its own world in beside the sheet
if (menu) {
  let now = $('.menu__scene.is-on', menu)?.dataset.world, z = 1;
  const show = (key) => {
    if (!key || key === now) return;
    now = key;
    const pic = $(`.menu__scene[data-world="${key}"]`, menu); // it slides in over the one showing
    if (!pic) return;
    pic.classList.remove('is-on'); pic.style.zIndex = ++z; void pic.offsetWidth;
    pic.classList.add('is-on');
  };
  const over = (e) => show(e.target.closest?.('.menu__list [data-world]')?.dataset.world);
  menu.addEventListener('pointerover', over);
  menu.addEventListener('focusin', over);
}

// ---------- a scene's world can be swapped for a guest picture (the piece under the pointer) ----------
export function guestWorld(scene, image) {
  const world = scene && $('.scene__world', scene);
  if (!world || reduced || !pointer.matches) return;
  let guest = $('.world--guest', world);
  if (!image || image.lowres) { guest?.classList.remove('is-on'); if (guest) guest.dataset.want = ''; return; }
  if (!guest) { guest = new Image(); guest.className = 'world world--guest'; guest.alt = ''; world.append(guest); }
  const attrs = imageAttrs(image, '60vw');
  guest.dataset.want = attrs.src;
  if (guest.dataset.has === attrs.src) { guest.classList.add('is-on'); return; }
  guest.classList.remove('is-on');
  clearTimeout(guest.timer);
  guest.timer = setTimeout(() => { // let the last guest slide out, and skip pieces the pointer only crossed
    if (guest.dataset.want !== attrs.src) return;
    Object.assign(guest, { sizes: attrs.sizes, srcset: attrs.srcset, src: attrs.src });
    guest.dataset.has = attrs.src;
    guest.decode().catch(() => {}).then(() => { if (guest.dataset.want === attrs.src) guest.classList.add('is-on'); });
  }, 220);
}

// ---------- the piece card ----------
const CUTS = { // handle: [cut-out file, width, height]
  'senor-tigre': ['tiger-walking', 960, 444], curiosity: ['onlookers', 960, 1146], 'the-art-of-art': ['feather', 562, 960],
  'i-am-the-bad-guy': ['blue-hair', 960, 1648], 'modern-love': ['ink-hand', 960, 939], 'lucky-pleasures': ['lips', 960, 835],
  'reflections-of-me': ['snake-dress', 960, 1734], 'let-out': ['face-scream', 960, 2385], stuck: ['meditator', 960, 1544],
  'female-cactus': ['cactus', 960, 1150], 'tears-water-the-soul-silver': ['treasure-head', 960, 1196],
  'tears-water-the-soul-green': ['garden-head', 960, 1088], 'tears-water-the-soul-pink': ['flower-head', 917, 1167],
};
export function cutFor(handle) {
  if (!CUTS[handle]) return null;
  const [name, width, height] = CUTS[handle], base = new URL(`../../shared/img/cutouts/${name}`, import.meta.url).href;
  return { src: `${base}-${width}.webp`, srcset: `${base}-480.webp 480w, ${base}-${width}.webp ${width}w`, width, height };
}

const markAdd = (button, inCart) => {
  button.classList.toggle('is-in', inCart);
  button.lastChild.textContent = inCart ? 'In cart' : 'Add';
  button.setAttribute('aria-label', `${inCart ? 'In your cart:' : 'Add to cart:'} ${button.dataset.title}`);
};
export function pieceCard(product, { sizes = '(min-width: 720px) 30vw, 70vw' } = {}) {
  const card = el('article', 'piece'), link = el('a', 'piece__link'), art = el('span', 'piece__art'), img = new Image();
  const image = product.images[0], attrs = imageAttrs(image, sizes);
  card.dataset.handle = product.handle;
  card.dataset.reveal = '';
  link.href = product.url;
  link.dataset.piece = product.handle;
  img.loading = 'lazy'; img.decoding = 'async';
  Object.assign(img, attrs);
  if (image.lowres) img.style.maxWidth = `${attrs.width}px`; // a small file is never shown wider than it is
  art.append(img);
  link.append(art, el('span', 'piece__title', product.title),
    product.available ? el('span', 'piece__price', formatPrice(product.price) ?? '') : el('span', 'piece__price piece__sold', 'Sold'));
  const meta = el('p', 'piece__meta');
  if (product.year) meta.append(el('span', 'piece__year', String(product.year)));
  if (product.badge) meta.append(el('span', 'piece__mark', product.badge));
  card.append(link, meta);
  if (product.available) {
    const add = el('button', 'piece__add');
    add.type = 'button';
    add.dataset.handle = product.handle;
    add.dataset.title = product.title;
    add.append(el('span', 'plus'), el('span', '', 'Add'));
    markAdd(add, false);
    add.addEventListener('click', () => {
      if (add.classList.contains('is-in')) return openCart(add);
      $('.piece__note', card)?.remove();
      cart.add(product).then(() => openCart(add), (err) => { const note = el('p', 'piece__note', err.message); note.setAttribute('role', 'status'); card.append(note); });
    });
    card.append(add);
  } else card.classList.add('is-sold');
  card.addEventListener('pointerenter', () => guestWorld(card.closest('.scene'), image));
  return card;
}
export function renderPieces(box, products, opts) {
  box.replaceChildren(...products.map((p) => pieceCard(p, opts)));
  if (!box.dataset.wired) { box.dataset.wired = ''; box.addEventListener('pointerleave', () => guestWorld(box.closest('.scene'), null)); }
  reveal(box);
  cart.get().then(paint, () => {});
}

// ---------- the cart ----------
const say = (text) => { const status = cartEl && $('[data-cart-status]', cartEl); if (status) { status.textContent = text; status.dataset.state = text ? 'error' : ''; } };
function cartLine(line, i) {
  const li = el('li', 'cart__line'), art = el('a', 'line__art'), img = new Image(), title = el('a', 'line__title', line.title), remove = el('button', 'line__remove', 'Remove');
  li.style.setProperty('--i', i);
  art.href = title.href = line.url;
  art.tabIndex = -1; art.setAttribute('aria-hidden', 'true');
  Object.assign(img, imageAttrs(line.image, '84px'));
  art.append(img);
  remove.type = 'button';
  remove.setAttribute('aria-label', `Remove ${line.title}`);
  remove.addEventListener('click', () => cart.remove(line.id).catch((err) => say(err.message)));
  li.append(art, title, el('span', 'line__price', formatPrice(line.price) ?? ''));
  if (line.type === 'original') li.append(el('span', 'line__mark label', 'Original, 1 of 1'));
  li.append(remove);
  return li;
}
function paint(c) {
  for (const n of $$('[data-cart-count]')) { n.textContent = c.count; n.dataset.has = c.count > 0; }
  for (const b of $$('[data-cart-open]')) b.setAttribute('aria-label', `Cart, ${c.count} ${c.count === 1 ? 'item' : 'items'}`);
  const held = new Set(c.lines.map((l) => l.handle));
  for (const b of $$('.piece__add')) markAdd(b, held.has(b.dataset.handle));
  if (!cartEl) return;
  $('[data-cart-lines]', cartEl).replaceChildren(...c.lines.map(cartLine));
  $('[data-cart-empty]', cartEl).hidden = c.lines.length > 0;
  $('[data-cart-foot]', cartEl).hidden = c.lines.length === 0;
  $('[data-cart-subtotal]', cartEl).textContent = formatPrice(c.subtotal) ?? '';
  if (!c.lines.length) say('');
}
for (const n of $$('[data-cart-count]')) { const count = cart.count(); n.textContent = count; n.dataset.has = count > 0; }
cart.subscribe(paint);
cart.get().then(paint, () => {});
$('[data-cart-checkout]')?.addEventListener('click', async (e) => {
  const button = e.currentTarget;
  say('');
  button.disabled = true;
  try { await cart.checkout(); } catch (err) { say(err.message); } // sample mode: the layer shows its own notice inside this sheet
  button.disabled = false;
});

// ---------- newsletter fields, featured pieces, the sample note ----------
for (const form of $$('form[data-newsletter]')) wireForm(form, { kind: 'newsletter' });
for (const box of $$('[data-featured]')) {
  const handles = box.dataset.featured.split(',').map((h) => h.trim());
  getProducts().then((all) => {
    const picks = handles.map((h) => all.find((p) => p.handle === h)).filter(Boolean);
    if (picks.length) renderPieces(box, picks, { sizes: box.dataset.sizes || undefined });
  }).catch(() => { /* the cards written in the page stay */ });
}
if ($('[data-featured]') || document.body.hasAttribute('data-shop')) mountSampleNote();
